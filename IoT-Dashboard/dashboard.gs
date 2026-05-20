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
  voltage: { label: '電圧', unit: 'V' },
  current: { label: '電流', unit: 'A' },
  power_consumption: { label: '電力量', unit: 'kWh' },
  power_factor: { label: '力率', unit: '' }
};
const DASHBOARD_STATE_CACHE_KEY = 'iot_dashboard_state_v1';
const DASHBOARD_STATE_CACHE_SEC = 20;
const OFFLINE_INTERVAL_MULTIPLIER = 1.1;

function apiGetDashboardState() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(DASHBOARD_STATE_CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (err) {}
  }
  const config = getConfigMap_();
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
      background_url: getBackgroundUrlFromConfig_(config)
    },
    layout: readLayout_(),
    devices: readDevicesWithMetrics_(normalizeOfflineTimeout_(config.offline_timeout_min)),
    metricMeta: readMetricMeta_()
  };
  const json = JSON.stringify(state);
  if (json.length < 95000) cache.put(DASHBOARD_STATE_CACHE_KEY, json, DASHBOARD_STATE_CACHE_SEC);
  return state;
}

function readMetricMeta_() {
  const meta = JSON.parse(JSON.stringify(METRIC_META));
  try {
    const sh = getSheet_(SHEET_DEFINITIONS);
    const lastRow = sh.getLastRow();
    if (lastRow <= 1) return meta;
    const values = sh.getRange(2, 1, lastRow - 1, 4).getValues();
    for (let r = 0; r < values.length; r++) {
      const id = String(values[r][0] || '').trim();
      if (!id) continue;
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

function readDevicesWithMetrics_(offlineTimeoutMin) {
  const sh = getSheet_(SHEET_DEVICES);
  const values = sh.getDataRange().getValues();
  const idx = headerIndex_(sh);
  const latest = latestByDevice_();
  const now = new Date();
  const out = [];
  for (let r = 1; r < values.length; r++) {
    const deviceId = String(valueByHeader_(values[r], idx, 'device_id') || '').trim();
    if (!deviceId) continue;
    const metrics = latest[deviceId] || {};
    const lastSeenValue = valueByHeader_(values[r], idx, 'last_seen');
    const reportIntervalMin = normalizeReportIntervalMin_(valueByHeader_(values[r], idx, 'report_interval_min'), offlineTimeoutMin);
    const status = deviceOnlineStatus_(parseBool_(valueByHeader_(values[r], idx, 'enabled')), lastSeenValue, now, reportIntervalMin);
    out.push({
      device_id: deviceId,
      name: String(valueByHeader_(values[r], idx, 'name') || ''),
      note: String(valueByHeader_(values[r], idx, 'note') || ''),
      enabled: parseBool_(valueByHeader_(values[r], idx, 'enabled')),
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
      metricKeys: Object.keys(metrics).sort()
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
    if (!out[deviceId]) out[deviceId] = {};
    out[deviceId][metric] = {
      value: values[r][2],
      ts: dateOut_(values[r][3])
    };
  }
  return out;
}

function valueByHeader_(row, idx, key) {
  return idx[key] === undefined ? '' : row[idx[key]];
}

function parseStyleConfig_(style) {
  try {
    const obj = JSON.parse(String(style || '{}'));
    const metrics = obj && Array.isArray(obj.metrics) ? obj.metrics : [];
    const displayMode = String((obj && (obj.displayMode || obj.display_mode)) || 'card').trim().toLowerCase();
    return {
      metrics: metrics.map(function (m) { return String(m || '').trim(); }).filter(Boolean).slice(0, 3),
      displayMode: displayMode === 'popup' ? 'popup' : 'card'
    };
  } catch (err) {
    return { metrics: [], displayMode: 'card' };
  }
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
