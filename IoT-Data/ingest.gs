/**
 * IoT-Data — HTTP POST ingestion endpoint.
 *
 * Devices push arbitrary-key JSON to the Web App /exec URL, e.g.
 *   {"devEUI":"70B3D57ED006A1B2","temp":25.3,"humidity":60}
 * A device identifier is required. Only SN/serial or devEUI-like keys are used
 * as IDs. deviceName/name values are stored only as reference names.
 * Platform metadata is skipped. The decoded payload is preferred when it is
 * nested under common LoRaWAN wrapper keys. Scalar number / numeric-string /
 * boolean values become metrics; nested objects and arrays are flattened.
 *
 * doPost NEVER throws — it always returns a JSON envelope:
 *   {"ok":true,"device_id":"dev1","metrics":2,"ts":"..."}
 *   {"ok":false,"error":"bad json"}
 */

const DEVICE_ROW_CACHE_PREFIX = 'iot_device_row_v2:';
const LATEST_INDEX_CACHE_KEY = 'iot_latest_index_v2';
const DEVICE_ID_KEYS = [
  // LoRaWAN devices: devEUI only.
  'deveui',
  'dev_eui',
  'device_eui',
  'deviceeui',
  // Normal devices identify by SN only.
  'device_sn',
  'sn'
];
const DEVICE_NAME_KEYS = [
  'devicename',
  'device_name',
  'name',
  'dev_name',
  'devname',
  'device',
  'model',
  'device_model'
];
const DECODED_PAYLOAD_PATHS = [
  ['uplink_message', 'decoded_payload'],
  ['uplinkMessage', 'decodedPayload'],
  ['decoded_payload'],
  ['decodedPayload'],
  ['decoded'],
  ['object'],
  ['payload_fields'],
  ['payloadFields'],
  ['data']
];
const RESERVED_INGEST_KEYS = makeReservedIngestKeys_();

function doPost(e) {
  try {
    return jsonOut_(handlePost_(e));
  } catch (err) {
    // Last-resort guard — doPost must never surface an exception to the device.
    return jsonOut_({ ok: false, error: 'internal', detail: String((err && err.message) || err) });
  }
}

function handlePost_(e) {
  ensureIngestReady_();

  // 1. parse guard
  if (!e || !e.postData || !e.postData.contents) {
    return { ok: false, error: 'no body' };
  }

  // 2. JSON parse, with URL/form parameter fallback for simple webhooks.
  const parsedBody = parsePostPayload_(e);
  if (!parsedBody.ok) return parsedBody;
  let payload = parsedBody.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, error: 'bad json' };
  }

  // 3. token check intentionally disabled for device-platform webhooks.
  // Keep the Web App URL private; any caller that knows it can submit readings.

  // 4. extract device_id + metrics
  const parsed = parseIngestPayload_(payload);
  if (!parsed.device_id) return { ok: false, error: 'device_id required' };
  if (parsed.metrics.length === 0) return { ok: false, error: 'no metrics' };

  // 5. lock — all sheet writes happen inside
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { ok: false, error: 'busy' };
  try {
    const ts = new Date();

    // 6. writes
    const deviceState = touchDevice_(parsed.device_id, parsed.device_name, ts);
    appendReadings_(parsed.device_id, parsed.metrics, ts);
    upsertLatest_(parsed.device_id, parsed.metrics, ts);
    const derived = applyDefinitionsForDevice_(parsed.device_id, ts);

    // 7. done
    return {
      ok: true,
      device_id: parsed.device_id,
      device_key: parsed.device_key,
      device_name: parsed.device_name,
      device_enabled: deviceState.enabled,
      device_registered: deviceState.registered,
      metrics: parsed.metrics.length,
      derived: derived.length,
      ts: ts.toISOString()
    };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Pull device_id + a flat list of {metric, value} from an arbitrary-key payload.
 * Identifier aliases, token, and timestamp-like fields are skipped. Only scalar
 * number / numeric-string / boolean values become metrics.
 */
function parseIngestPayload_(payload) {
  const result = { device_id: '', device_key: '', device_name: '', metrics: [] };

  const idHit = findDeviceId_(payload);
  result.device_id = idHit.value;
  result.device_key = idHit.key;
  result.device_name = findDeviceName_(payload);

  const metricRoot = findDecodedPayloadRoot_(payload) || payload;
  collectMetrics_(metricRoot, '', result.metrics, 0);
  result.metrics = dedupeMetrics_(result.metrics);

  return result;
}

function parsePostPayload_(e) {
  const raw = String((e && e.postData && e.postData.contents) || '');
  if (raw.trim()) {
    try {
      return { ok: true, payload: JSON.parse(raw) };
    } catch (parseErr) {
      if (e && e.parameter && Object.keys(e.parameter).length) {
        return { ok: true, payload: e.parameter };
      }
      return { ok: false, error: 'bad json' };
    }
  }
  if (e && e.parameter && Object.keys(e.parameter).length) {
    return { ok: true, payload: e.parameter };
  }
  return { ok: false, error: 'no body' };
}

function collectMetrics_(obj, prefix, out, depth) {
  if (!obj || typeof obj !== 'object' || depth > 6) return;

  if (Array.isArray(obj)) {
    obj.forEach(function (item, i) {
      const path = prefix ? prefix + '_' + i : String(i);
      if (item !== null && typeof item === 'object') {
        collectMetrics_(item, path, out, depth + 1);
      } else {
        pushMetric_(out, path, item);
      }
    });
    return;
  }

  Object.keys(obj).forEach(function (key) {
    if (isReservedIngestKey_(key)) return;
    const v = obj[key];
    const path = prefix ? prefix + '_' + key : key;

    if (v !== null && typeof v === 'object') {
      collectMetrics_(v, path, out, depth + 1);
      return;
    }
    pushMetric_(out, path, v);
  });
}

function pushMetric_(out, path, value) {
  let num = null;
  if (typeof value === 'number' && isFinite(value)) {
    num = value;
  } else if (typeof value === 'boolean') {
    num = value ? 1 : 0;
  } else if (typeof value === 'string' && value.trim() !== '' && isFinite(Number(value))) {
    num = Number(value);
  } else {
    return;
  }
  out.push({ metric: sanitizeMetricName_(path), value: num });
}

function findDecodedPayloadRoot_(payload) {
  for (let i = 0; i < DECODED_PAYLOAD_PATHS.length; i++) {
    const root = valueAtPath_(payload, DECODED_PAYLOAD_PATHS[i]);
    if (root && typeof root === 'object' && !Array.isArray(root)) return root;
  }
  return null;
}

function valueAtPath_(obj, path) {
  let cur = obj;
  for (let i = 0; i < path.length; i++) {
    if (!cur || typeof cur !== 'object') return null;
    cur = cur[path[i]];
  }
  return cur;
}

function dedupeMetrics_(metrics) {
  const byMetric = {};
  const order = [];
  metrics.forEach(function (m) {
    if (!m.metric) return;
    if (!Object.prototype.hasOwnProperty.call(byMetric, m.metric)) order.push(m.metric);
    byMetric[m.metric] = m.value;
  });
  return order.map(function (metric) {
    return { metric: metric, value: byMetric[metric] };
  });
}

function findDeviceId_(payload) {
  return findDeviceIdDeep_(payload, 0);
}

function findDeviceName_(payload) {
  const hit = findKeyValueDeep_(payload, DEVICE_NAME_KEYS, 0);
  return hit.value;
}

function findDeviceIdDeep_(payload, depth) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || depth > 4) {
    return { key: '', value: '' };
  }

  const keyByNorm = {};
  Object.keys(payload).forEach(function (key) {
    keyByNorm[normalizeKey_(key)] = key;
  });

  for (let i = 0; i < DEVICE_ID_KEYS.length; i++) {
    const norm = normalizeKey_(DEVICE_ID_KEYS[i]);
    const actualKey = keyByNorm[norm];
    if (!actualKey) continue;
    const value = normalizeDeviceId_(payload[actualKey]);
    if (value) return { key: actualKey, value: value };
  }

  const keys = Object.keys(payload);
  for (let j = 0; j < keys.length; j++) {
    const child = payload[keys[j]];
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      const hit = findDeviceIdDeep_(child, depth + 1);
      if (hit.value) return hit;
    }
  }
  return { key: '', value: '' };
}

function findKeyValueDeep_(payload, keys, depth) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || depth > 4) {
    return { key: '', value: '' };
  }

  const keyByNorm = {};
  Object.keys(payload).forEach(function (key) {
    keyByNorm[normalizeKey_(key)] = key;
  });

  for (let i = 0; i < keys.length; i++) {
    const norm = normalizeKey_(keys[i]);
    const actualKey = keyByNorm[norm];
    if (!actualKey) continue;
    const value = normalizeDeviceName_(payload[actualKey]);
    if (value) return { key: actualKey, value: value };
  }

  const childKeys = Object.keys(payload);
  for (let j = 0; j < childKeys.length; j++) {
    const child = payload[childKeys[j]];
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      const hit = findKeyValueDeep_(child, keys, depth + 1);
      if (hit.value) return hit;
    }
  }
  return { key: '', value: '' };
}

function normalizeDeviceId_(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizeDeviceName_(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return '';
  return String(value).trim();
}

function normalizeKey_(key) {
  return String(key || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function makeReservedIngestKeys_() {
  const out = {
    token: true,
    ts: true,
    timestamp: true,
    time: true,
    datetime: true,
    date: true,
    applicationid: true,
    applicationname: true,
    deviceaddress: true,
    devaddr: true,
    devicename: true,
    gatewayid: true,
    gatewaytime: true,
    fcnt: true,
    fport: true,
    frequency: true,
    datarate: true,
    rssi: true,
    snr: true,
    adr: true,
    confirmed: true,
    event: true,
    reporttype: true,
    snapshot: true,
    dststatus: true,
    timezone: true,
    starttime: true,
    endtime: true,
    ipaddress: true,
    devicemac: true
  };
  DEVICE_ID_KEYS.forEach(function (key) {
    out[normalizeKey_(key)] = true;
  });
  DEVICE_NAME_KEYS.forEach(function (key) {
    out[normalizeKey_(key)] = true;
  });
  return out;
}

function isReservedIngestKey_(key) {
  return !!RESERVED_INGEST_KEYS[normalizeKey_(key)];
}

function sanitizeMetricName_(key) {
  const s = String(key || '').trim().replace(/[^A-Za-z0-9_]/g, '_').replace(/_+/g, '_');
  return s || 'value';
}

/** Append one Readings row per metric. Raw JSON is intentionally not stored. */
function appendReadings_(device_id, metrics, ts) {
  const sh = getSheet_(SHEET_READINGS);
  const rows = metrics.map(function (m) {
    return [ts, device_id, m.metric, m.value, ''];
  });
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, 5).setValues(rows);
}

/** Upsert one Latest row per (device_id, metric): value + ts. */
function upsertLatest_(device_id, metrics, ts) {
  const sh = getSheet_(SHEET_LATEST);
  const idx = headerIndex_(sh);
  const index = latestRowIndex_(sh, idx);
  const appends = [];
  metrics.forEach(function (m) {
    const key = latestKey_(device_id, m.metric);
    const row = index[key];
    if (row) {
      setLatestValues_(sh, row, idx, m.value, ts, key);
    } else {
      appends.push(latestRow_(idx, device_id, m.metric, m.value, ts, key));
    }
  });
  if (appends.length) {
    sh.getRange(sh.getLastRow() + 1, 1, appends.length, appends[0].length).setValues(appends);
    CacheService.getScriptCache().remove(LATEST_INDEX_CACHE_KEY);
  }
}

/**
 * Update Devices.last_seen, or auto-register an unknown device as disabled.
 * Disabled devices still store readings; Dashboard only displays enabled devices.
 */
function touchDevice_(device_id, deviceName, ts) {
  const sh = getSheet_(SHEET_DEVICES);
  const idx = headerIndex_(sh);
  const cache = CacheService.getScriptCache();
  const cacheKey = deviceRowCacheKey_(device_id);
  const cachedRow = Number(cache.get(cacheKey) || 0);
  if (cachedRow > 1) {
    const cachedValues = sh.getRange(cachedRow, 1, 1, sh.getLastColumn()).getValues()[0];
    if (String(valueByHeader_(cachedValues, idx, 'device_id')) === device_id) {
      const enabled = parseBool_(valueByHeader_(cachedValues, idx, 'enabled'));
      updateDeviceNameIfBlank_(sh, cachedRow, idx, cachedValues, deviceName);
      sh.getRange(cachedRow, idx.last_seen + 1).setValue(ts);
      return { enabled: enabled, registered: true };
    }
  }

  const lastRow = sh.getLastRow();
  if (lastRow > 1) {
    const ids = sh.getRange(2, idx.device_id + 1, lastRow - 1, 1).getValues();
    const enabled = sh.getRange(2, idx.enabled + 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === device_id) {
        const row = i + 2;
        cache.put(cacheKey, String(row), 21600);
        const current = sh.getRange(row, 1, 1, sh.getLastColumn()).getValues()[0];
        const isEnabled = parseBool_(enabled[i][0]);
        updateDeviceNameIfBlank_(sh, row, idx, current, deviceName);
        sh.getRange(row, idx.last_seen + 1).setValue(ts);
        return { enabled: isEnabled, registered: true };
      }
    }
  }
  sh.appendRow(deviceRow_(idx, device_id, deviceName, ts));
  cache.put(cacheKey, String(sh.getLastRow()), 21600);
  return { enabled: false, registered: false };
}

function updateDeviceNameIfBlank_(sheet, row, idx, current, deviceName) {
  if (!deviceName || idx.name === undefined) return;
  if (String(valueByHeader_(current, idx, 'name') || '').trim()) return;
  sheet.getRange(row, idx.name + 1).setValue(deviceName);
}

function deviceRowCacheKey_(deviceId) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(deviceId || ''), Utilities.Charset.UTF_8);
  return DEVICE_ROW_CACHE_PREFIX + Utilities.base64EncodeWebSafe(digest).slice(0, 32);
}

function latestRowIndex_(sh, idx) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(LATEST_INDEX_CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (err) {}
  }

  const lastRow = sh.getLastRow();
  const index = {};
  if (lastRow <= 1) return index;

  const deviceValues = sh.getRange(2, idx.device_id + 1, lastRow - 1, 1).getValues();
  const metricValues = sh.getRange(2, idx.metric + 1, lastRow - 1, 1).getValues();
  const keyValues = idx.latest_key === undefined ? [] : sh.getRange(2, idx.latest_key + 1, lastRow - 1, 1).getValues();
  const keyUpdates = [];
  let needsKeyWrite = false;
  for (let i = 0; i < deviceValues.length; i++) {
    const deviceId = String(deviceValues[i][0] || '').trim();
    const metric = String(metricValues[i][0] || '').trim();
    const key = latestKey_(deviceId, metric);
    if (deviceId && metric) index[key] = i + 2;
    if (idx.latest_key !== undefined) {
      const existingKey = String((keyValues[i] && keyValues[i][0]) || '').trim();
      keyUpdates.push([existingKey || key]);
      if (!existingKey && key) needsKeyWrite = true;
    }
  }
  if (needsKeyWrite) {
    sh.getRange(2, idx.latest_key + 1, keyUpdates.length, 1).setValues(keyUpdates);
  }
  const json = JSON.stringify(index);
  if (json.length < 95000) cache.put(LATEST_INDEX_CACHE_KEY, json, 21600);
  return index;
}

function latestKey_(deviceId, metric) {
  return String(deviceId || '') + '\u0001' + String(metric || '');
}

function latestRow_(idx, deviceId, metric, value, ts, key) {
  const width = Math.max.apply(null, Object.keys(idx).map(function (name) { return idx[name]; })) + 1;
  const row = new Array(width).fill('');
  row[idx.device_id] = deviceId;
  row[idx.metric] = metric;
  row[idx.value] = value;
  row[idx.ts] = ts;
  if (idx.latest_key !== undefined) row[idx.latest_key] = key;
  return row;
}

function deviceRow_(idx, deviceId, deviceName, ts) {
  const width = Math.max.apply(null, Object.keys(idx).map(function (name) { return idx[name]; })) + 1;
  const row = new Array(width).fill('');
  row[idx.device_id] = deviceId;
  if (idx.name !== undefined) row[idx.name] = deviceName || '';
  if (idx.enabled !== undefined) row[idx.enabled] = false;
  if (idx.last_seen !== undefined) row[idx.last_seen] = ts;
  if (idx.first_seen !== undefined) row[idx.first_seen] = ts;
  return row;
}

function setLatestValues_(sheet, row, idx, value, ts, key) {
  if (idx.value !== undefined && idx.ts === idx.value + 1 && idx.latest_key === idx.value + 2) {
    sheet.getRange(row, idx.value + 1, 1, 3).setValues([[value, ts, key]]);
    return;
  }
  if (idx.value !== undefined) sheet.getRange(row, idx.value + 1).setValue(value);
  if (idx.ts !== undefined) sheet.getRange(row, idx.ts + 1).setValue(ts);
  if (idx.latest_key !== undefined) sheet.getRange(row, idx.latest_key + 1).setValue(key);
}

/** enabled-column convention: false / no / 0 / off => disabled; anything else => enabled. */
function parseBool_(v) {
  if (v === true) return true;
  if (v === false) return false;
  const s = String(v).trim().toLowerCase();
  return !(s === 'false' || s === 'no' || s === '0' || s === 'off');
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureIngestReady_() {
  const cache = CacheService.getScriptCache();
  if (cache.get('iot_ingest_ready_v5') === '1') return;
  ensureScriptProps_();
  ensureSheets_();
  seedConfigDefaults_();
  cache.put('iot_ingest_ready_v5', '1', 21600);
}

function testIngest() {
  ensureIngestReady_();
  const payload = {
    applicationID: 1,
    devEUI: '70B3D57ED006A1B2',
    deviceName: 'EM300-TH',
    gatewayTime: '2026-05-14T11:12:52+01:00',
    humidity: 49,
    temperature: 26.3,
    history: [{ temperature: 25.1, humidity: 48 }]
  };
  const result = handlePost_({
    parameter: {},
    postData: {
      contents: JSON.stringify(payload)
    }
  });
  Logger.log(JSON.stringify(result));
  return result;
}
