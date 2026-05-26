/**
 * SHARED utility module — single source of truth.
 * Edits go in /shared/util.gs. *-push.ps1 copies it to each project as
 * _shared_util.gs (gitignored in IoT-* folders).
 */

const OFFLINE_INTERVAL_MULTIPLIER = 1.1;

function setByHeader_(row, idx, key, value) {
  if (idx[key] === undefined) return;
  row[idx[key]] = value;
}

function valueByHeader_(row, idx, key) {
  return idx[key] === undefined ? '' : row[idx[key]];
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

function normalizeOfflineTimeout_(value) {
  const n = Number(value);
  return n === 5 || n === 30 || n === 60 ? n : 15;
}

/**
 * Normalize a "report interval (min)" cell value.
 * @param {*} value
 * @param {*} [fallbackMin]  If given, an invalid `value` falls back to normalizeOfflineTimeout_(fallbackMin).
 *                           Otherwise returns '' for invalid input.
 * @returns {number|''}
 */
function normalizeReportIntervalMin_(value, fallbackMin) {
  const n = Number(value);
  if (isFinite(n) && n > 0) return Math.round(n * 100) / 100;
  if (fallbackMin === undefined) return '';
  return normalizeOfflineTimeout_(fallbackMin);
}

/**

 * Decide whether a device counts as Online.

 * @param {boolean} enabled

 * @param {*} lastSeen   Date or ISO string of last uplink.

 * @param {Date} now

 * @param {number} reportIntervalMin

 * @returns {{online:boolean, reason:string}}

 */

function deviceOnlineStatus_(enabled, lastSeen, now, reportIntervalMin) {
  if (!enabled) return { online: false, reason: 'disabled' };
  const d = toDate_(lastSeen);
  if (!d) return { online: false, reason: 'never_seen' };
  const ageMs = now.getTime() - d.getTime();
  if (!isFinite(ageMs) || ageMs < 0) return { online: true, reason: '' };
  if (ageMs > reportIntervalMin * OFFLINE_INTERVAL_MULTIPLIER * 60 * 1000) {
    return { online: false, reason: 'stale' };
  }
  return { online: true, reason: '' };
}

/**

 * Coerce a value into a Date, or null if invalid.

 * @param {*} v

 * @returns {Date|null}

 */

function parseBool_(v) {
  if (v === true) return true;
  if (v === false) return false;
  const s = String(v).trim().toLowerCase();
  return !(s === 'false' || s === 'no' || s === '0' || s === 'off');
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

function clamp01_(n) {
  if (!isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

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

function normalizeStyleConfig_(value) {
  let obj = value;
  if (typeof value === 'string') obj = parseStyleConfig_(value);
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) obj = {};
  const metrics = Array.isArray(obj.metrics) ? obj.metrics : [];
  const displayMode = String(obj.displayMode || obj.display_mode || 'card').trim().toLowerCase();
  const cardWidth = clampNumber_(Number(obj.cardWidth || obj.card_width), 100, 360, 0);
  const cardHeight = clampNumber_(Number(obj.cardHeight || obj.card_height), 54, 260, 0);
  return {
    metrics: metrics.map(function (m) { return String(m || '').trim(); }).filter(Boolean).slice(0, 12),
    displayMode: displayMode === 'popup' ? 'popup' : 'card',
    cardWidth: cardWidth,
    cardHeight: cardHeight
  };
}

function parseStyleConfig_(style) {
  try {
    const obj = JSON.parse(String(style || '{}'));
    return normalizeStyleConfig_(obj);
  } catch (err) {
    return { metrics: [], displayMode: 'card', cardWidth: 0, cardHeight: 0 };
  }
}
