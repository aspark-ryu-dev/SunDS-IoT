/**
 * AUTO-MIGRATED from defs.gs — see README.
 * Edits here are fine; this file is hand-maintained from now on.
 */
/**
 * Returns the admin snapshot: devices, layout, definitions, latest, keyCatalog, deviceExamples, config.
 * @returns {object}
 */
function apiGetAdminSnapshot() {
  ensureIngestReady_();
  return getAdminSnapshot_();
}

function apiGetIngestInfo() {
  ensureIngestReady_();
  const props = PropertiesService.getScriptProperties();
  return {
    spreadsheet_id: props.getProperty('SPREADSHEET_ID') || DEFAULT_SPREADSHEET_ID,
    endpoint_auth: 'none',
    build: BUILD_VERSION
  };
}

function apiTestIngest() {
  ensureIngestReady_();
  return testIngest();
}

/**

 * Convenience: set the dashboard background image URL + dimensions.

 * @param {string} imageUrl

 * @param {number} [width]

 * @param {number} [height]

 * @returns {object} updated admin snapshot

 */

function apiSetBackgroundUrl(imageUrl, width, height) {
  ensureIngestReady_();
  const url = normalizeImageUrl_(imageUrl);
  if (url && !/^https?:\/\/.+/i.test(url)) throw new Error('Image URL must start with http:// or https://');
  setConfig_('background_image_url', url);
  if (url) setConfig_('background_image_file_id', '');
  if (width) setConfig_('map_width', Number(width));
  if (height) setConfig_('map_height', Number(height));
  return getAdminSnapshot_();
}

/**

 * Save dashboard-level settings (background image, refresh interval, map size).

 * @param {{imageUrl?:string, width?:number, height?:number, refresh_interval_sec?:number}} settings

 * @returns {object} updated admin snapshot

 */

function apiSaveDashboardSettings(settings) {
  ensureIngestReady_();
  settings = settings || {};
  const url = normalizeImageUrl_(settings.imageUrl);
  if (url && !/^https?:\/\/.+/i.test(url)) throw new Error('Image URL must start with http:// or https://');
  setConfig_('background_image_url', url);
  if (url) setConfig_('background_image_file_id', '');
  if (settings.width) setConfig_('map_width', Number(settings.width));
  if (settings.height) setConfig_('map_height', Number(settings.height));
  const logoUrl = normalizeImageUrl_(settings.logo_url);
  if (logoUrl && !/^https?:\/\/.+/i.test(logoUrl)) throw new Error('Icon URL must start with http:// or https://');
  setConfig_('logo_url', logoUrl);
  setConfig_('refresh_interval_sec', normalizeRefreshInterval_(settings.refresh_interval_sec));
  setConfig_('offline_timeout_min', normalizeOfflineTimeout_(settings.offline_timeout_min));
  return getAdminSnapshot_();
}

function getAdminSnapshot_() {
  ensureHeaders_(getSheet_(SHEET_DEVICES), HEADERS.Devices);
  ensureHeaders_(getSheet_(SHEET_KEY_CATALOG), HEADERS.KeyCatalog);
  const devices = readDevices_();
  const latest = readLatestRows_();
  attachMetricsToDevices_(devices, latest);
  return {
    devices: devices,
    definitions: readDefinitions_(),
    keyCatalog: readKeyCatalog_(),
    latest: latest,
    dashboard: {
      config: getDashboardConfig_(),
      layout: readLayout_()
    },
    deviceExamples: getDeviceExampleModels_(),
    metricMeta: buildSnapshotMetricMeta_(latest),
    build: BUILD_VERSION
  };
}

function buildSnapshotMetricMeta_(latestRows) {
  const out = JSON.parse(JSON.stringify(METRIC_META));
  (latestRows || []).forEach(function (row) {
    const key = String((row && row.metric) || '').trim();
    if (key && !out[key] && !isSystemMetadataKey_(key)) out[key] = metricMetaForKey_(key);
  });
  return out;
}

function readLatestRows_() {
  const sh = getSheet_(SHEET_LATEST);
  const lastRow = sh.getLastRow();
  if (lastRow <= 1) return [];
  const values = sh.getRange(2, 1, lastRow - 1, 4).getValues();
  const out = [];
  for (let r = 0; r < values.length; r++) {
    if (String(values[r][0]).trim() === '' || String(values[r][1]).trim() === '') continue;
    if (isSystemMetadataKey_(values[r][1])) continue;
    out.push({
      device_id: String(values[r][0]),
      metric: String(values[r][1]),
      value: values[r][2],
      ts: dateOut_(values[r][3])
    });
  }
  return out;
}

function getDashboardConfig_() {
  const config = getConfigMap_();
  return {
    map_width: Number(config.map_width || 1200),
    map_height: Number(config.map_height || 800),
    refresh_interval_sec: normalizeRefreshInterval_(config.refresh_interval_sec),
    offline_timeout_min: normalizeOfflineTimeout_(config.offline_timeout_min),
    background_image_url: String(config.background_image_url || ''),
    background_image_file_id: String(config.background_image_file_id || ''),
    background_url: getBackgroundUrlFromConfig_(config),
    logo_url: String(config.logo_url || '')
  };
}
