/**
 * IoT-Dashboard - public read-only dashboard state.
 */

const METRIC_META = {
  battery: { label: 'バッテリー', unit: '%' },
  temperature: { label: '温度', unit: '°C' },
  humidity: { label: '湿度', unit: '%' },
  co2: { label: 'CO2', unit: 'ppm' },
  tvoc: { label: 'TVOC', unit: 'ppb' },
  pm2_5: { label: 'PM2.5', unit: 'ug/m3' },
  pm10: { label: 'PM10', unit: 'ug/m3' },
  pressure: { label: '気圧', unit: 'hPa' },
  distance: { label: '距離', unit: 'mm' },
  occupancy: { label: '在席', unit: '' },
  people_count_all: { label: '人数', unit: '人' },
  current_total: { label: '現在人数', unit: '人' },
  max_counted: { label: '最大人数', unit: '人' },
  Max_counted: { label: '最大人数', unit: '人' },
  total_mapped_regions: { label: '設定済みエリア数', unit: '' },
  current_counted: { label: '現在人数', unit: '人' },
  in_counted: { label: '入場人数', unit: '人' },
  out_counted: { label: '退場人数', unit: '人' },
  capacity_counted: { label: '在室増減', unit: '人' },
  total_data_in_cumulative_counted: { label: '累計入場人数', unit: '人' },
  total_data_out_cumulative_counted: { label: '累計退場人数', unit: '人' },
  total_data_capacity_cumulative_counted: { label: '累計在室増減', unit: '人' },
  line_trigger_data_in: { label: '入場トリガー', unit: '人' },
  line_trigger_data_out: { label: '退場トリガー', unit: '人' },
  flow_data_A_A: { label: 'A-A 人流', unit: '人' },
  flow_data_A_B: { label: 'A-B 人流', unit: '人' },
  flow_data_A_C: { label: 'A-C 人流', unit: '人' },
  flow_data_A_D: { label: 'A-D 人流', unit: '人' },
  flow_data_B_A: { label: 'B-A 人流', unit: '人' },
  flow_data_B_B: { label: 'B-B 人流', unit: '人' },
  flow_data_B_C: { label: 'B-C 人流', unit: '人' },
  flow_data_B_D: { label: 'B-D 人流', unit: '人' },
  flow_data_C_A: { label: 'C-A 人流', unit: '人' },
  flow_data_C_B: { label: 'C-B 人流', unit: '人' },
  flow_data_C_C: { label: 'C-C 人流', unit: '人' },
  flow_data_C_D: { label: 'C-D 人流', unit: '人' },
  flow_data_D_A: { label: 'D-A 人流', unit: '人' },
  flow_data_D_B: { label: 'D-B 人流', unit: '人' },
  flow_data_D_C: { label: 'D-C 人流', unit: '人' },
  flow_data_D_D: { label: 'D-D 人流', unit: '人' },
  voltage: { label: '電圧', unit: 'V' },
  current: { label: '電流', unit: 'A' },
  power_consumption: { label: '電力量', unit: 'kWh' },
  power_factor: { label: '力率', unit: '' }
};
const DASHBOARD_STATE_CACHE_KEY = 'iot_dashboard_state_v4_read_compute';
const DASHBOARD_STATE_CACHE_SEC = 5;
const DASHBOARD_MAPPING_CACHE_KEY = 'iot_dashboard_metric_mappings_v1';
/**
 * Returns the full dashboard snapshot, or a tiny "unchanged" response when
 * the client already holds the latest version.
 *
 * @param {string} [clientVersion] - the `version` value the client last received.
 * @returns {{unchanged:true,version:string} | object} state envelope with `.version`
 */
function apiGetDashboardState(clientVersion) {
  const cache = CacheService.getScriptCache();
  let state = null;
  const cached = cache.get(DASHBOARD_STATE_CACHE_KEY);
  if (cached) {
    try { state = JSON.parse(cached); } catch (err) {}
  }
  if (!state) {
    state = buildDashboardState_();
    const json = JSON.stringify(state);
    state.version = shortHash_(json);
    if (json.length < 95000) {
      cache.put(DASHBOARD_STATE_CACHE_KEY, JSON.stringify(state), DASHBOARD_STATE_CACHE_SEC);
    }
  }
  if (clientVersion && state.version && clientVersion === state.version) {
    return { ok: true, unchanged: true, version: state.version };
  }
  return state;
}

/** Build the dashboard state (excluding `version`); cache-miss path only. */
function buildDashboardState_() {
  const config = getConfigMap_();
  const visibleMetricKeys = readVisibleMetricKeys_();
  const devices = readDevicesWithMetrics_(normalizeOfflineTimeout_(config.offline_timeout_min), visibleMetricKeys);
  const visibleDeviceIds = {};
  devices.forEach(function (device) { visibleDeviceIds[device.device_id] = true; });
  const layout = readLayout_().filter(function (item) {
    return item.enabled !== false && (!item.bind_ref || visibleDeviceIds[item.bind_ref]);
  });
  return {
    build: BUILD_VERSION,
    config: {
      map_width: Number(config.map_width || 1200),
      map_height: Number(config.map_height || 800),
      refresh_interval_sec: normalizeRefreshInterval_(config.refresh_interval_sec),
      offline_timeout_min: normalizeOfflineTimeout_(config.offline_timeout_min),
      offline_multiplier: OFFLINE_INTERVAL_MULTIPLIER,
      background_image_url: String(config.background_image_url || ''),
      background_image_file_id: String(config.background_image_file_id || ''),
      background_url: getBackgroundUrlFromConfig_(config),
      logo_url: String(config.logo_url || '')
    },
    layout: layout,
    devices: devices,
    metricMeta: readMetricMeta_(visibleMetricKeys)
  };
}

/** 24-char hex of MD5(s). Stable, content-addressable. */
function shortHash_(s) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, String(s || ''), Utilities.Charset.UTF_8);
  let hex = '';
  for (let i = 0; i < 12; i++) {
    const b = digest[i] & 0xff;
    hex += (b < 16 ? '0' : '') + b.toString(16);
  }
  return hex;
}

function readMetricMeta_(visibleMetricKeys) {
  const meta = JSON.parse(JSON.stringify(METRIC_META));
  try {
    const sh = getSheet_(SHEET_DEFINITIONS);
    const lastRow = sh.getLastRow();
    if (lastRow <= 1) return meta;
    const values = sh.getRange(2, 1, lastRow - 1, 4).getValues();
    for (let r = 0; r < values.length; r++) {
      const id = String(values[r][0] || '').trim();
      if (!id) continue;
      if (isSystemMetadataKey_(id)) continue;
      if (!isVisibleMetricKey_(id, visibleMetricKeys)) continue;
      const name = String(values[r][2] || '').trim();
      const unit = normalizeMetricUnit_(id, String(values[r][3] || '').trim());
      if (name || unit) meta[id] = { label: name || id, unit: unit };
    }
  } catch (err) {
    Logger.log('readMetricMeta_ skipped: ' + err.message);
  }
  return meta;
}

function readLayout_() {
  const sh = getSheet_(SHEET_LAYOUT);
  const lastRow = sh.getLastRow();
  if (lastRow <= 1) return [];
  const values = sh.getRange(2, 1, lastRow - 1, 8).getValues();
  const out = [];
  for (let r = 0; r < values.length; r++) {
    if (String(values[r][0]).trim() === '') continue;
    const style = String(values[r][6] || '');
    out.push({
      item_id: String(values[r][0]),
      bind_type: String(values[r][1] || 'device'),
      bind_ref: String(values[r][2] || ''),
      x_norm: clamp01_(Number(values[r][3])),
      y_norm: clamp01_(Number(values[r][4])),
      label: String(values[r][5] || ''),
      style: style,
      style_config: parseStyleConfig_(style),
      enabled: parseBool_(values[r][7])
    });
  }
  return out;
}

function readDevicesWithMetrics_(offlineTimeoutMin, visibleMetricKeys) {
  const sh = getSheet_(SHEET_DEVICES);
  const values = sh.getDataRange().getValues();
  const idx = headerIndex_(sh);
  const latest = latestByDevice_();
  const now = new Date();
  const out = [];
  const seenDeviceIds = {};
  for (let r = 1; r < values.length; r++) {
    const deviceId = String(valueByHeader_(values[r], idx, 'device_id') || '').trim();
    if (!deviceId || seenDeviceIds[deviceId]) continue;
    seenDeviceIds[deviceId] = true;
    const enabled = parseBool_(valueByHeader_(values[r], idx, 'enabled'));
    if (!enabled) continue;
    const metrics = filterDisplayMetrics_(latest[deviceId] || {}, visibleMetricKeys);
    const lastSeenValue = valueByHeader_(values[r], idx, 'last_seen');
    const reportIntervalMin = normalizeReportIntervalMin_(valueByHeader_(values[r], idx, 'report_interval_min'), offlineTimeoutMin);
    const status = deviceOnlineStatus_(enabled, lastSeenValue, now, reportIntervalMin);
    out.push({
      device_id: deviceId,
      name: String(valueByHeader_(values[r], idx, 'name') || ''),
      note: String(valueByHeader_(values[r], idx, 'note') || ''),
      enabled: enabled,
      online: status.online,
      offline_reason: status.reason,
      last_seen: dateOut_(lastSeenValue),
      first_seen: dateOut_(valueByHeader_(values[r], idx, 'first_seen')),
      area_id: String(valueByHeader_(values[r], idx, 'area_id') || ''),
      location: String(valueByHeader_(values[r], idx, 'location') || ''),
      type: String(valueByHeader_(values[r], idx, 'type') || ''),
      sensor_type: String(valueByHeader_(values[r], idx, 'sensor_type') || ''),
      power_source: String(valueByHeader_(values[r], idx, 'power_source') || ''),
      report_interval_min: reportIntervalMin,
      dashboard_order: normalizeDashboardOrder_(valueByHeader_(values[r], idx, 'dashboard_order')),
      dashboard_card_type: normalizeDashboardCardType_(valueByHeader_(values[r], idx, 'dashboard_card_type')),
      dashboard_metrics: normalizeDashboardMetrics_(valueByHeader_(values[r], idx, 'dashboard_metrics'), visibleMetricKeys),
      offline_after_min: Math.round(reportIntervalMin * OFFLINE_INTERVAL_MULTIPLIER * 100) / 100,
      metrics: metrics,
      metricKeys: Object.keys(metrics).filter(function (key) {
        return !isSystemMetadataKey_(key) && isVisibleMetricKey_(key, visibleMetricKeys);
      }).sort()
    });
  }
  return out;
}

function normalizeDashboardOrder_(value) {
  const n = Number(value);
  return isFinite(n) ? n : 999999;
}

function normalizeDashboardCardType_(value) {
  const type = String(value || 'standard').trim().toLowerCase();
  return type === 'compact' || type === 'wide' ? type : 'standard';
}

function normalizeDashboardMetrics_(value, visibleMetricKeys) {
  const raw = String(value || '').trim();
  if (!raw) return [];
  let arr;
  try {
    const parsed = JSON.parse(raw);
    arr = Array.isArray(parsed) ? parsed : raw.split(',');
  } catch (err) {
    arr = raw.split(',');
  }
  return arr.map(function (key) {
    return String(key || '').trim();
  }).filter(function (key) {
    return key && !isSystemMetadataKey_(key) && isVisibleMetricKey_(key, visibleMetricKeys) && isDashboardDisplayMetric_(key);
  }).slice(0, 12);
}

function latestByDevice_() {
  const sh = getSheet_(SHEET_LATEST);
  const lastRow = sh.getLastRow();
  if (lastRow <= 1) return {};
  const idx = headerIndex_(sh);
  const values = sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).getValues();
  const mappings = readActiveMetricMappingIndex_();
  const deviceModels = readDashboardDeviceModelIndex_();
  const out = {};
  for (let r = 0; r < values.length; r++) {
    const deviceId = String(valueByHeader_(values[r], idx, 'device_id') || '').trim();
    const metric = String(valueByHeader_(values[r], idx, 'metric') || '').trim();
    if (!deviceId || !metric) continue;
    if (isSystemMetadataKey_(metric)) continue;
    if (!out[deviceId]) out[deviceId] = {};
    const context = {
      event: String(valueByHeader_(values[r], idx, 'event') || ''),
      report_type: String(valueByHeader_(values[r], idx, 'report_type') || ''),
      device_model: String(valueByHeader_(values[r], idx, 'device_model') || deviceModels[deviceId] || '')
    };
    const mapping = findDashboardMetricMapping_(mappings, context, metric);
    out[deviceId][metric] = {
      value: valueByHeader_(values[r], idx, 'value'),
      ts: dateOut_(valueByHeader_(values[r], idx, 'ts')),
      canonical_key: mapping ? mapping.canonical_key : '',
      scope: mapping ? mapping.scope : '',
      event: context.event,
      report_type: normalizeDashboardReportType_(context.report_type)
    };
  }
  applyDashboardDefinitions_(out);
  return out;
}

function readDashboardDeviceModelIndex_() {
  const out = {};
  try {
    const sh = getSheet_(SHEET_DEVICES);
    const idx = headerIndex_(sh);
    if (idx.device_id === undefined || idx.device_model === undefined || sh.getLastRow() <= 1) return out;
    const values = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
    values.forEach(function (row) {
      const id = String(valueByHeader_(row, idx, 'device_id') || '').trim();
      if (id) out[id] = String(valueByHeader_(row, idx, 'device_model') || '').trim();
    });
  } catch (err) {}
  return out;
}

function filterDisplayMetrics_(metrics, visibleMetricKeys) {
  const out = {};
  Object.keys(metrics || {}).forEach(function (key) {
    if (!isSystemMetadataKey_(key) && isVisibleMetricKey_(key, visibleMetricKeys) && isDashboardDisplayMetric_(key)) out[key] = metrics[key];
  });
  return out;
}

function readActiveMetricMappingIndex_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(DASHBOARD_MAPPING_CACHE_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch (err) {}
  }
  try {
    const sh = getSheet_(SHEET_METRIC_MAPPINGS);
    const values = sh.getDataRange().getValues();
    if (values.length <= 1) return {};
    const idx = headerIndex_(sh);
    const out = {};
    for (let r = 1; r < values.length; r++) {
      if (String(valueByHeader_(values[r], idx, 'status') || '') !== 'active') continue;
      const rawKey = String(valueByHeader_(values[r], idx, 'raw_key') || '').trim();
      const canonical = String(valueByHeader_(values[r], idx, 'canonical_key') || '').trim();
      if (!rawKey || !canonical) continue;
      const mapping = {
        device_model: String(valueByHeader_(values[r], idx, 'device_model') || ''),
        event: String(valueByHeader_(values[r], idx, 'event') || ''),
        report_type: normalizeDashboardReportType_(valueByHeader_(values[r], idx, 'report_type')),
        raw_key: rawKey,
        canonical_key: canonical,
        scope: String(valueByHeader_(values[r], idx, 'scope') || canonical.split('.')[0])
      };
      out[dashboardMappingLookupKey_(mapping.device_model, mapping.event, mapping.report_type, rawKey)] = mapping;
    }
    const json = JSON.stringify(out);
    if (json.length < 95000) cache.put(DASHBOARD_MAPPING_CACHE_KEY, json, 60);
    return out;
  } catch (err) {
    Logger.log('readActiveMetricMappingIndex_ skipped: ' + err.message);
    return {};
  }
}

function findDashboardMetricMapping_(index, context, rawKey) {
  const model = normalizeDashboardMappingText_(context.device_model);
  const event = normalizeDashboardMappingText_(context.event);
  const reportType = normalizeDashboardReportType_(context.report_type);
  const candidates = [
    dashboardMappingLookupKey_(model, event, reportType, rawKey),
    dashboardMappingLookupKey_('', event, reportType, rawKey),
    dashboardMappingLookupKey_(model, '', reportType, rawKey),
    dashboardMappingLookupKey_('', '', reportType, rawKey),
    dashboardMappingLookupKey_('', '', '', rawKey)
  ];
  for (let i = 0; i < candidates.length; i++) {
    if (index[candidates[i]]) return index[candidates[i]];
  }
  return null;
}

function dashboardMappingLookupKey_(model, event, reportType, rawKey) {
  return [
    normalizeDashboardMappingText_(model),
    normalizeDashboardMappingText_(event),
    normalizeDashboardReportType_(reportType),
    String(rawKey || '').trim()
  ].join('\u0001');
}

function normalizeDashboardMappingText_(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeDashboardReportType_(value) {
  const raw = normalizeDashboardMappingText_(value);
  if (raw === 'periodic') return 'interval';
  return raw === 'trigger' || raw === 'interval' ? raw : '';
}

function applyDashboardDefinitions_(byDevice) {
  const definitions = readDashboardDefinitions_();
  if (!definitions.length) return;
  Object.keys(byDevice || {}).forEach(function (deviceId) {
    const metrics = byDevice[deviceId];
    const scope = {};
    Object.keys(metrics).forEach(function (key) {
      const value = Number(metrics[key].value);
      if (isFinite(value)) scope[key] = value;
    });
    definitions.forEach(function (definition) {
      if (!(definition.source === '*' || definition.source === '' || definition.source === deviceId)) return;
      const result = evalExpression_(definition.expression, scope);
      if (!result.ok) return;
      scope[definition.id] = result.value;
      metrics[definition.id] = {
        value: result.value,
        ts: newestMetricTimestamp_(metrics),
        canonical_key: '',
        scope: 'derived'
      };
    });
  });
}

function readDashboardDefinitions_() {
  try {
    const sh = getSheet_(SHEET_DEFINITIONS);
    const values = sh.getDataRange().getValues();
    if (values.length <= 1) return [];
    const idx = headerIndex_(sh);
    const out = [];
    for (let r = 1; r < values.length; r++) {
      const type = String(valueByHeader_(values[r], idx, 'type') || '').toLowerCase();
      const expression = String(valueByHeader_(values[r], idx, 'expression') || '').trim();
      if (!/^(expr|expression|formula)$/.test(type) || !expression ||
          !parseBool_(valueByHeader_(values[r], idx, 'enabled'))) continue;
      out.push({
        id: String(valueByHeader_(values[r], idx, 'id') || '').trim(),
        source: String(valueByHeader_(values[r], idx, 'source') || '*').trim(),
        expression: expression
      });
    }
    return out.filter(function (definition) { return !!definition.id; });
  } catch (err) {
    return [];
  }
}

function newestMetricTimestamp_(metrics) {
  let newest = '';
  let time = 0;
  Object.keys(metrics || {}).forEach(function (key) {
    const date = toDate_(metrics[key] && metrics[key].ts);
    if (date && date.getTime() >= time) {
      time = date.getTime();
      newest = date.toISOString();
    }
  });
  return newest;
}

function isDashboardDisplayMetric_(metric) {
  const key = normalizeSystemMetadataKey_(metric);
  if (!key) return false;
  if (/^(devicestatus|lorawanclass|firmwareversion|hardwareversion|ipsoversion|tslversion|sn|devicesn|devicedeveui|deveui|deviceeui)$/.test(key)) return false;
  if (/sensorstatus$/.test(key)) return false;
  return true;
}

function readVisibleMetricKeys_() {
  try {
    const sh = getSheet_(SHEET_KEY_CATALOG);
    const values = sh.getDataRange().getValues();
    if (values.length <= 1) return null;
    const header = values[0].map(function (v) { return String(v || '').trim().toLowerCase(); });
    const keyCol = header.indexOf('key');
    const enabledCol = header.indexOf('enabled');
    if (keyCol < 0 || enabledCol < 0) return null;
    const out = {};
    let foundEnabledRows = false;
    for (let r = 1; r < values.length; r++) {
      const key = String(values[r][keyCol] || '').trim();
      if (!key || isSystemMetadataKey_(key)) continue;
      const enabled = parseBool_(values[r][enabledCol]);
      if (enabled) {
        out[normalizeSystemMetadataKey_(key)] = true;
        foundEnabledRows = true;
      }
    }
    return foundEnabledRows ? out : null;
  } catch (err) {
    Logger.log('readVisibleMetricKeys_ skipped: ' + err.message);
    return null;
  }
}

function isVisibleMetricKey_(key, visibleMetricKeys) {
  if (!visibleMetricKeys) return true;
  return !!visibleMetricKeys[normalizeSystemMetadataKey_(key)];
}

function normalizeMetricUnit_(metric, unit) {
  if (isTemperatureMetric_(metric) && unit === 'C') return '°C';
  return unit;
}

function isTemperatureMetric_(metric) {
  return /(^|_)temperature($|_)/.test(String(metric || '').toLowerCase().replace(/[^a-z0-9]+/g, '_'));
}

