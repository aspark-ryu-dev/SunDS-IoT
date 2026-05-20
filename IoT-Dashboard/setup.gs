/**
 * IoT-Dashboard one-time / idempotent setup.
 *
 * The dashboard is public and read-only. Run IoT-Data setup() first because
 * IoT-Data owns Devices, Latest, Config, and Layout.
 */
function setup() {
  CacheService.getScriptCache().remove('iot_dashboard_state_v1');
  ensureScriptProps_();
  ensureSheets_();
  seedConfigDefaults_();
  Logger.log('IoT-Dashboard setup complete.');
}

function ensureScriptProps_() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SPREADSHEET_ID')) {
    props.setProperty('SPREADSHEET_ID', DEFAULT_SPREADSHEET_ID);
  }
  Logger.log('SPREADSHEET_ID: ' + props.getProperty('SPREADSHEET_ID'));
}

function seedConfigDefaults_() {
  if (getConfig_('background_image_url', null) === null) {
    setConfig_('background_image_url', 'https://dl.dropboxusercontent.com/scl/fi/4ymgkh5vfwol4l5yn2na5/v2.png?rlkey=xia5kn3txaz80y2blkdjzniwz&st=psc510yw&dl=1');
  }
  if (getConfig_('map_width', null) === null) setConfig_('map_width', 1200);
  if (getConfig_('map_height', null) === null) setConfig_('map_height', 800);
  if (getConfig_('refresh_interval_sec', null) === null) setConfig_('refresh_interval_sec', 60);
  if (getConfig_('offline_timeout_min', null) === null) setConfig_('offline_timeout_min', 15);
}
