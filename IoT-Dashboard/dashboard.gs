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
  total_mapped_regions: { label: 'マップ済みリージョン数', unit: '' },
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
const DASHBOARD_STATE_CACHE_KEY = 'iot_dashboard_state_v3';
const DASHBOARD_STATE_CACHE_SEC = 20;
const OFFLINE_INTERVAL_MULTIPLIER = 1.1;
const SYSTEM_METADATA_KEYS = [
  'applicationID', 'applicationName', 'application_id', 'application_name',
  'adr', 'confirmed', 'dataRate', 'data_rate', 'devAddr', 'devaddr',
  'deviceAddress', 'device_address', 'deviceName', 'device_name', 'devName',
  'dev_name', 'name', 'model', 'device_model', 'gatewayID', 'gateway_id', 'gatewayTime', 'gateway_time',
  'fCnt', 'fcnt', 'fPort', 'fport', 'frequency', 'rssi', 'snr', 'token',
  'ts', 'timestamp', 'time', 'datetime', 'date', 'event', 'report_type',
  'snapshot', 'isRetransmission', 'device_info.device', 'device_info.device_sn',
  'device_info.device_mac', 'device_info.device_name', 'device_info.ip_address',
  'device_info.cus_device_id', 'device_info.cus_site_id', 'device_info.firmware_version',
  'device_info.hardware_version', 'device_info.wlan mac', 'device_info.wlan_mac',
  'network_info.network_status', 'network_info.iccid', 'network_info.imei',
  'network_info.cell_id', 'network_info.lac', 'time_info.time',
  'time_info.timezone', 'time_info.dst_status', 'time_info.start_time',
  'time_info.end_time', 'time_info.enable_dst', 'time_info.time_zone',
  'regions_name[]', 'dwell_time_data[].dwell_start_time',
  'dwell_time_data[].dwell_end_time', 'line_trigger_data[].line_name',
  'line_trigger_data[].line_uuid', 'region_trigger_data.region_count_data[].region_name',
  'region_trigger_data.region_count_data[].region_uuid',
  'region_trigger_data.dwell_time_data[].dwell_start_time',
  'region_trigger_data.dwell_time_data[].dwell_end_time',
  'region_trigger_data.dwell_time_data[].region_name',
  'region_trigger_data.dwell_time_data[].region_uuid',
  'attention_region_trigger_data.region_attention_time_data[].region_uuid',
  'di_trigger_data.di_trigger_event_name'
];

function apiGetDashboardState() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(DASHBOARD_STATE_CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (err) {}
  }
  const config = getConfigMap_();
  const visibleMetricKeys = readVisibleMetricKeys_();
  const devices = readDevicesWithMetrics_(normalizeOfflineTimeout_(config.offline_timeout_min), visibleMetricKeys);
  const visibleDeviceIds = {};
  devices.forEach(function (device) { visibleDeviceIds[device.device_id] = true; });
  const layout = readLayout_().filter(function (item) {
    return item.enabled !== false && (!item.bind_ref || visibleDeviceIds[item.bind_ref]);
  });

  const state = {
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
  const json = JSON.stringify(state);
  if (json.length < 95000) cache.put(DASHBOARD_STATE_CACHE_KEY, json, DASHBOARD_STATE_CACHE_SEC);
  return state;
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
  for (let r = 1; r < values.length; r++) {
    const deviceId = String(valueByHeader_(values[r], idx, 'device_id') || '').trim();
    if (!deviceId) continue;
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
      offline_after_min: Math.round(reportIntervalMin * OFFLINE_INTERVAL_MULTIPLIER * 100) / 100,
      metrics: metrics,
      metricKeys: Object.keys(metrics).filter(function (key) {
        return !isSystemMetadataKey_(key) && isVisibleMetricKey_(key, visibleMetricKeys);
      }).sort()
    });
  }
  return out;
}

function latestByDevice_() {
  const sh = getSheet_(SHEET_LATEST);
  const lastRow = sh.getLastRow();
  if (lastRow <= 1) return {};
  const values = sh.getRange(2, 1, lastRow - 1, 4).getValues();
  const out = {};
  for (let r = 0; r < values.length; r++) {
    const deviceId = String(values[r][0] || '').trim();
    const metric = String(values[r][1] || '').trim();
    if (!deviceId || !metric) continue;
    if (isSystemMetadataKey_(metric)) continue;
    if (!out[deviceId]) out[deviceId] = {};
    out[deviceId][metric] = {
      value: values[r][2],
      ts: dateOut_(values[r][3])
    };
  }
  return out;
}

function filterDisplayMetrics_(metrics, visibleMetricKeys) {
  const out = {};
  Object.keys(metrics || {}).forEach(function (key) {
    if (!isSystemMetadataKey_(key) && isVisibleMetricKey_(key, visibleMetricKeys)) out[key] = metrics[key];
  });
  return out;
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

function isSystemMetadataKey_(key) {
  const normalized = normalizeSystemMetadataKey_(key);
  if (!normalized) return false;
  const keys = systemMetadataKeySet_();
  if (keys[normalized]) return true;
  if (/^(application|gateway|deviceaddress|devaddr|fcnt|fport|datarate|frequency|rssi|snr|adr|confirmed|token)$/.test(normalized)) return true;
  if (/^(ts|timestamp|time|datetime|date)$/.test(normalized)) return true;
  if (/^(event|reporttype|snapshot)$/.test(normalized)) return true;
  if (/^deviceinfo(device|devicesn|devicemac|ipaddress)$/.test(normalized)) return true;
  if (/^timeinfo(time|timezone|dststatus|starttime|endtime)$/.test(normalized)) return true;
  if (/^regionsname\d*$/.test(normalized)) return true;
  if (/^dwelltimedata\d*(dwellstarttime|dwellendtime)$/.test(normalized)) return true;
  if (/^deviceinfo(cusdeviceid|cussiteid|devicemac|devicename|devicesn|firmwareversion|hardwareversion|ipaddress|wlanmac)$/.test(normalized)) return true;
  if (/^networkinfo(networkstatus|iccid|imei|cellid|lac)$/.test(normalized)) return true;
  if (/^timeinfo(dststatus|enabledst|time|timezone|starttime|endtime)$/.test(normalized)) return true;
  if (/^linetriggerdata\d*line(name|uuid)$/.test(normalized)) return true;
  if (/^regiontriggerdata(regioncountdata|dwelltimedata)\d*region(name|uuid)$/.test(normalized)) return true;
  if (/^regiontriggerdatadwelltimedata\d*dwell(start|end)time$/.test(normalized)) return true;
  if (/^attentionregiontriggerdataregionattentiontimedata\d*regionuuid$/.test(normalized)) return true;
  if (/^ditriggerdataditriggereventname$/.test(normalized)) return true;
  if (/^isretransmission$/.test(normalized)) return true;
  return false;
}

function systemMetadataKeySet_() {
  const out = {};
  SYSTEM_METADATA_KEYS.forEach(function (key) {
    out[normalizeSystemMetadataKey_(key)] = true;
  });
  return out;
}

function normalizeSystemMetadataKey_(key) {
  return String(key || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function valueByHeader_(row, idx, key) {
  return idx[key] === undefined ? '' : row[idx[key]];
}

function parseStyleConfig_(style) {
  try {
    const obj = JSON.parse(String(style || '{}'));
    const metrics = obj && Array.isArray(obj.metrics) ? obj.metrics : [];
    const displayMode = String((obj && (obj.displayMode || obj.display_mode)) || 'card').trim().toLowerCase();
    const cardWidth = clampNumber_(Number(obj && (obj.cardWidth || obj.card_width)), 100, 360, 0);
    const cardHeight = clampNumber_(Number(obj && (obj.cardHeight || obj.card_height)), 54, 260, 0);
    return {
      metrics: metrics.map(function (m) { return String(m || '').trim(); }).filter(Boolean).slice(0, 12),
      displayMode: displayMode === 'popup' ? 'popup' : 'card',
      cardWidth: cardWidth,
      cardHeight: cardHeight
    };
  } catch (err) {
    return { metrics: [], displayMode: 'card', cardWidth: 0, cardHeight: 0 };
  }
}

function clampNumber_(value, min, max, fallback) {
  if (!isFinite(value) || value <= 0) return fallback;
  return Math.max(min, Math.min(max, value));
}

function getBackgroundUrl_() {
  return getBackgroundUrlFromConfig_(getConfigMap_());
}

function getBackgroundUrlFromConfig_(config) {
  config = config || {};
  const directUrl = normalizeImageUrl_(config.background_image_url || '');
  if (directUrl) return directUrl;
  const fileId = String(config.background_image_file_id || '').trim();
  if (!fileId) return '';
  return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(fileId) + '&sz=w2400';
}

function normalizeRefreshInterval_(value) {
  const n = Number(value);
  return n === 300 || n === 600 ? n : 60;
}

function normalizeMetricUnit_(metric, unit) {
  if (isTemperatureMetric_(metric) && unit === 'C') return '°C';
  return unit;
}

function isTemperatureMetric_(metric) {
  return /(^|_)temperature($|_)/.test(String(metric || '').toLowerCase().replace(/[^a-z0-9]+/g, '_'));
}

function normalizeOfflineTimeout_(value) {
  const n = Number(value);
  return n === 5 || n === 30 || n === 60 ? n : 15;
}

function normalizeReportIntervalMin_(value, fallbackMin) {
  const n = Number(value);
  if (isFinite(n) && n > 0) return Math.round(n * 100) / 100;
  return normalizeOfflineTimeout_(fallbackMin);
}

function deviceOnlineStatus_(enabled, lastSeen, now, reportIntervalMin) {
  if (!enabled) return { online: false, reason: 'disabled' };
  const d = toDate_(lastSeen);
  if (!d) return { online: false, reason: 'never_seen' };
  const ageMs = now.getTime() - d.getTime();
  if (!isFinite(ageMs) || ageMs < 0) return { online: true, reason: '' };
  if (ageMs > reportIntervalMin * OFFLINE_INTERVAL_MULTIPLIER * 60 * 1000) return { online: false, reason: 'stale' };
  return { online: true, reason: '' };
}

function toDate_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function normalizeImageUrl_(url) {
  let out = String(url || '').trim();
  if (!out) return '';
  if (out.indexOf('https://www.dropbox.com/') === 0) {
    out = out.replace('https://www.dropbox.com/', 'https://dl.dropboxusercontent.com/');
  }
  return out;
}

function dateOut_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
    return v.toISOString();
  }
  return String(v || '');
}

function parseBool_(v) {
  if (v === true) return true;
  if (v === false) return false;
  const s = String(v).trim().toLowerCase();
  return !(s === 'false' || s === 'no' || s === '0' || s === 'off');
}

function clamp01_(n) {
  if (!isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}
