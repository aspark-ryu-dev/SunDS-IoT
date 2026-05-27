/**
 * AUTO-MIGRATED from defs.gs — see README.
 * Edits here are fine; this file is hand-maintained from now on.
 */
/**
 * Upsert a device row keyed by device_id. Returns the updated admin snapshot.
 * @param {{device_id:string, name?:string, area_id?:string, location?:string, type?:string, sensor_type?:string, power_source?:string, report_interval_min?:number, enabled?:boolean, note?:string}} device
 * @returns {object}
 */
function apiSaveDevice(device) {
  ensureIngestReady_();
  const clean = normalizeDeviceInput_(device);
  if (!clean.device_id) throw new Error('device_id is required');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = getSheet_(SHEET_DEVICES);
    ensureHeaders_(sh, HEADERS.Devices);
    const idx = headerIndex_(sh);
    const values = sh.getDataRange().getValues();
    for (let r = 1; r < values.length; r++) {
      if (String(values[r][idx.device_id] || '') === clean.device_id) {
        writeDeviceRow_(sh, r + 1, idx, clean, false);
        return getAdminSnapshot_();
      }
    }
    sh.appendRow(deviceToRow_(clean, idx));
    return getAdminSnapshot_();
  } finally {
    lock.releaseLock();
  }
}

/**

 * Bulk upsert. Optional per-device dashboard layout settings keyed by device_id.

 * @param {Array<object>} devices

 * @param {Object<string,{order?:number, card_type?:string, metrics?:string}>} [dashboardSettingsByDevice]

 * @returns {object} updated admin snapshot

 */

function apiSaveDevices(devices, dashboardSettingsByDevice) {
  ensureIngestReady_();
  devices = Array.isArray(devices) ? devices : [];
  dashboardSettingsByDevice = dashboardSettingsByDevice || {};
  const cleaned = devices.map(normalizeDeviceInput_).filter(function (device) {
    return !!device.device_id;
  });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = getSheet_(SHEET_DEVICES);
    ensureHeaders_(sh, HEADERS.Devices);
    const idx = headerIndex_(sh);
    const values = sh.getDataRange().getValues();
    const rowById = {};
    for (let r = 1; r < values.length; r++) {
      const id = String(values[r][idx.device_id] || '').trim();
      if (id) rowById[id] = r + 1;
    }
    cleaned.forEach(function (device) {
      if (rowById[device.device_id]) {
        writeDeviceRow_(sh, rowById[device.device_id], idx, device, false);
      } else {
        sh.appendRow(deviceToRow_(device, idx));
        rowById[device.device_id] = sh.getLastRow();
      }
    });
    Object.keys(dashboardSettingsByDevice).forEach(function (deviceId) {
      if (!rowById[deviceId]) return;
      saveDeviceDashboardSettingsRow_(sh, rowById[deviceId], idx, dashboardSettingsByDevice[deviceId]);
    });
    return getAdminSnapshot_();
  } finally {
    lock.releaseLock();
  }
}

/**

 * Delete a device by id AND the layout entries that reference it.

 * @param {string} deviceId

 * @returns {object} updated admin snapshot

 */

function apiDeleteDevice(deviceId) {
  ensureIngestReady_();
  const target = String(deviceId || '').trim();
  if (!target) throw new Error('device_id is required');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const deviceSheet = getSheet_(SHEET_DEVICES);
    ensureHeaders_(deviceSheet, HEADERS.Devices);
    const deviceIdx = headerIndex_(deviceSheet);
    const deviceValues = deviceSheet.getDataRange().getValues();
    let deleted = false;
    for (let r = deviceValues.length - 1; r >= 1; r--) {
      if (String(valueByHeader_(deviceValues[r], deviceIdx, 'device_id') || '').trim() === target) {
        deviceSheet.deleteRow(r + 1);
        deleted = true;
      }
    }
    if (!deleted) throw new Error('Device not found: ' + target);

    const layoutSheet = getSheet_(SHEET_LAYOUT);
    ensureHeaders_(layoutSheet, HEADERS.Layout);
    const layoutIdx = headerIndex_(layoutSheet);
    const layoutValues = layoutSheet.getDataRange().getValues();
    for (let lr = layoutValues.length - 1; lr >= 1; lr--) {
      const bindType = String(valueByHeader_(layoutValues[lr], layoutIdx, 'bind_type') || 'device').trim() || 'device';
      const bindRef = String(valueByHeader_(layoutValues[lr], layoutIdx, 'bind_ref') || '').trim();
      if (bindType === 'device' && bindRef === target) {
        layoutSheet.deleteRow(lr + 1);
      }
    }

    return getAdminSnapshot_();
  } finally {
    lock.releaseLock();
  }
}

function saveDeviceLayoutSettingsRows_(deviceId, styleConfig) {
  const target = String(deviceId || '').trim();
  if (!target) throw new Error('device_id is required');
  styleConfig = styleConfig || {};
  const incomingStyle = normalizeStyleConfig_(styleConfig);
  const hasDisplayMode = Object.prototype.hasOwnProperty.call(styleConfig, 'displayMode') || Object.prototype.hasOwnProperty.call(styleConfig, 'display_mode');
  const sh = getSheet_(SHEET_LAYOUT);
  ensureHeaders_(sh, HEADERS.Layout);
  const values = sh.getDataRange().getValues();
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][2] || '').trim() !== target) continue;
    const existingStyle = parseStyleConfig_(values[r][6]);
    const cleanStyle = {
      metrics: incomingStyle.metrics,
      displayMode: hasDisplayMode ? incomingStyle.displayMode : (existingStyle.displayMode || 'card'),
      cardWidth: existingStyle.cardWidth || 0,
      cardHeight: existingStyle.cardHeight || 0
    };
    const item = normalizeLayoutItem_({
      item_id: values[r][0],
      bind_type: values[r][1] || 'device',
      bind_ref: values[r][2],
      x_norm: values[r][3],
      y_norm: values[r][4],
      label: values[r][5],
      style_config: cleanStyle,
      enabled: values[r][7]
    });
    sh.getRange(r + 1, 1, 1, 8).setValues([layoutItemToRow_(item)]);
  }
}

function apiSaveDeviceLayoutSettings(deviceId, styleConfig) {
  ensureIngestReady_();

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    saveDeviceLayoutSettingsRows_(deviceId, styleConfig);
    return getAdminSnapshot_();
  } finally {
    lock.releaseLock();
  }
}

function normalizeDeviceInput_(device) {
  device = device || {};
  return {
    device_id: String(device.device_id || '').trim(),
    name: String(device.name || '').trim(),
    note: String(device.note || '').trim(),
    enabled: parseBool_(device.enabled),
    area_id: String(device.area_id || '').trim(),
    location: String(device.location || '').trim(),
    type: String(device.type || '').trim(),
    sensor_type: String(device.sensor_type || '').trim(),
    power_source: String(device.power_source || '').trim(),
    report_interval_min: normalizeReportIntervalMin_(device.report_interval_min),
    dashboard_order: normalizeDashboardOrder_(device.dashboard_order),
    dashboard_card_type: normalizeDashboardCardType_(device.dashboard_card_type),
    dashboard_metrics: normalizeDashboardMetricsString_(device.dashboard_metrics || device.dashboardMetrics)
  };
}

function writeDeviceRow_(sheet, rowNumber, idx, device, isNew) {
  const current = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
  setByHeader_(current, idx, 'device_id', device.device_id);
  setByHeader_(current, idx, 'name', device.name);
  setByHeader_(current, idx, 'note', device.note);
  setByHeader_(current, idx, 'enabled', device.enabled);
  setByHeader_(current, idx, 'area_id', device.area_id);
  setByHeader_(current, idx, 'location', device.location);
  setByHeader_(current, idx, 'type', device.type);
  setByHeader_(current, idx, 'sensor_type', device.sensor_type);
  setByHeader_(current, idx, 'power_source', device.power_source);
  setByHeader_(current, idx, 'report_interval_min', device.report_interval_min);
  setByHeader_(current, idx, 'dashboard_order', device.dashboard_order);
  setByHeader_(current, idx, 'dashboard_card_type', device.dashboard_card_type);
  setByHeader_(current, idx, 'dashboard_metrics', device.dashboard_metrics);
  if (isNew) setByHeader_(current, idx, 'first_seen', new Date());
  sheet.getRange(rowNumber, 1, 1, current.length).setValues([current]);
}

function deviceToRow_(device, idx) {
  const width = Math.max.apply(null, Object.keys(idx).map(function (key) { return idx[key]; })) + 1;
  const row = new Array(width).fill('');
  setByHeader_(row, idx, 'device_id', device.device_id);
  setByHeader_(row, idx, 'name', device.name);
  setByHeader_(row, idx, 'note', device.note);
  setByHeader_(row, idx, 'enabled', device.enabled);
  setByHeader_(row, idx, 'first_seen', new Date());
  setByHeader_(row, idx, 'area_id', device.area_id);
  setByHeader_(row, idx, 'location', device.location);
  setByHeader_(row, idx, 'type', device.type);
  setByHeader_(row, idx, 'sensor_type', device.sensor_type);
  setByHeader_(row, idx, 'power_source', device.power_source);
  setByHeader_(row, idx, 'report_interval_min', device.report_interval_min);
  setByHeader_(row, idx, 'dashboard_order', device.dashboard_order);
  setByHeader_(row, idx, 'dashboard_card_type', device.dashboard_card_type);
  setByHeader_(row, idx, 'dashboard_metrics', device.dashboard_metrics);
  return row;
}

function saveDeviceDashboardSettingsRow_(sheet, rowNumber, idx, settings) {
  const current = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (Object.prototype.hasOwnProperty.call(settings || {}, 'dashboard_order')) {
    setByHeader_(current, idx, 'dashboard_order', normalizeDashboardOrder_(settings.dashboard_order));
  }
  if (Object.prototype.hasOwnProperty.call(settings || {}, 'dashboard_card_type')) {
    setByHeader_(current, idx, 'dashboard_card_type', normalizeDashboardCardType_(settings.dashboard_card_type));
  }
  if (Object.prototype.hasOwnProperty.call(settings || {}, 'dashboard_metrics') || Object.prototype.hasOwnProperty.call(settings || {}, 'metrics')) {
    setByHeader_(current, idx, 'dashboard_metrics', normalizeDashboardMetricsString_(settings.dashboard_metrics || settings.metrics));
  }
  sheet.getRange(rowNumber, 1, 1, current.length).setValues([current]);
}

function normalizeDashboardOrder_(value) {
  const n = Number(value);
  return isFinite(n) ? n : '';
}

function normalizeDashboardCardType_(value) {
  const type = String(value || 'standard').trim().toLowerCase();
  return type === 'compact' || type === 'wide' ? type : 'standard';
}

function normalizeDashboardMetricsString_(value) {
  let arr = [];
  if (Array.isArray(value)) {
    arr = value;
  } else if (typeof value === 'string') {
    const raw = value.trim();
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        arr = Array.isArray(parsed) ? parsed : raw.split(',');
      } catch (err) {
        arr = raw.split(',');
      }
    }
  }
  arr = arr.map(function (key) { return String(key || '').trim(); }).filter(function (key) {
    return key && isDashboardDisplayMetricForAdmin_(key);
  }).slice(0, 12);
  return JSON.stringify(arr);
}

function readDevices_() {
  const sh = getSheet_(SHEET_DEVICES);
  const values = sh.getDataRange().getValues();
  const idx = headerIndex_(sh);
  const out = [];
  const config = getConfigMap_();
  const fallbackIntervalMin = normalizeOfflineTimeout_(config.offline_timeout_min);
  const now = new Date();
  for (let r = 1; r < values.length; r++) {
    if (String(valueByHeader_(values[r], idx, 'device_id')).trim() === '') continue;
    const enabled = parseBool_(valueByHeader_(values[r], idx, 'enabled'));
    const lastSeenValue = valueByHeader_(values[r], idx, 'last_seen');
    const reportIntervalMin = normalizeReportIntervalMin_(valueByHeader_(values[r], idx, 'report_interval_min')) || fallbackIntervalMin;
    const onlineStatus = deviceOnlineStatus_(enabled, lastSeenValue, now, reportIntervalMin);
    out.push({
      device_id: String(valueByHeader_(values[r], idx, 'device_id') || ''),
      name: String(valueByHeader_(values[r], idx, 'name') || ''),
      note: String(valueByHeader_(values[r], idx, 'note') || ''),
      enabled: enabled,
      online: onlineStatus.online,
      offline_reason: onlineStatus.reason,
      last_seen: dateOut_(lastSeenValue),
      first_seen: dateOut_(valueByHeader_(values[r], idx, 'first_seen')),
      area_id: String(valueByHeader_(values[r], idx, 'area_id') || ''),
      location: String(valueByHeader_(values[r], idx, 'location') || ''),
      type: String(valueByHeader_(values[r], idx, 'type') || ''),
      sensor_type: String(valueByHeader_(values[r], idx, 'sensor_type') || ''),
      power_source: String(valueByHeader_(values[r], idx, 'power_source') || ''),
      report_interval_min: reportIntervalMin,
      dashboard_order: valueByHeader_(values[r], idx, 'dashboard_order'),
      dashboard_card_type: normalizeDashboardCardType_(valueByHeader_(values[r], idx, 'dashboard_card_type')),
      dashboard_metrics: parseDashboardMetrics_(valueByHeader_(values[r], idx, 'dashboard_metrics')),
      offline_after_min: Math.round(reportIntervalMin * OFFLINE_INTERVAL_MULTIPLIER * 100) / 100
    });
  }
  return out;
}

function parseDashboardMetrics_(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean).slice(0, 12);
  const raw = String(value || '').trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean).slice(0, 12);
  } catch (err) {}
  return raw.split(',').map(function (key) { return key.trim(); }).filter(Boolean).slice(0, 12);
}

function attachMetricsToDevices_(devices, latest) {
  const visibleMetricKeys = readVisibleMetricKeysForAdmin_();
  const byDevice = {};
  latest.forEach(function (row) {
    if (isSystemMetadataKey_(row.metric)) return;
    if (!isVisibleMetricKeyForAdmin_(row.metric, visibleMetricKeys)) return;
    if (!isDashboardDisplayMetricForAdmin_(row.metric)) return;
    if (!byDevice[row.device_id]) byDevice[row.device_id] = {};
    byDevice[row.device_id][row.metric] = { value: row.value, ts: row.ts };
  });
  devices.forEach(function (d) {
    d.metrics = byDevice[d.device_id] || {};
    d.metricKeys = Object.keys(d.metrics).filter(function (key) {
      return !isSystemMetadataKey_(key);
    }).sort();
  });
}

function isDashboardDisplayMetricForAdmin_(metric) {
  const key = normalizeSystemMetadataKey_(metric);
  if (!key) return false;
  if (/^(devicestatus|lorawanclass|firmwareversion|hardwareversion|ipsoversion|tslversion|sn|devicesn|devicedeveui|deveui|deviceeui)$/.test(key)) return false;
  if (/sensorstatus$/.test(key)) return false;
  return true;
}

function readVisibleMetricKeysForAdmin_() {
  try {
    const sh = getSheet_(SHEET_KEY_CATALOG);
    ensureHeaders_(sh, HEADERS.KeyCatalog);
    const values = sh.getDataRange().getValues();
    if (values.length <= 1) return null;
    const idx = headerIndex_(sh);
    const out = {};
    let foundEnabledRows = false;
    for (let r = 1; r < values.length; r++) {
      const key = String(valueByHeader_(values[r], idx, 'key') || '').trim();
      if (!key || isSystemMetadataKey_(key)) continue;
      if (parseBool_(valueByHeader_(values[r], idx, 'enabled'))) {
        out[normalizeSystemMetadataKey_(key)] = true;
        foundEnabledRows = true;
      }
    }
    return foundEnabledRows ? out : null;
  } catch (err) {
    Logger.log('readVisibleMetricKeysForAdmin_ skipped: ' + err.message);
    return null;
  }
}

function isVisibleMetricKeyForAdmin_(key, visibleMetricKeys) {
  if (!visibleMetricKeys) return true;
  return !!visibleMetricKeys[normalizeSystemMetadataKey_(key)];
}
