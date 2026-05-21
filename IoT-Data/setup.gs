/**
 * IoT-Data one-time / idempotent setup.
 *
 * Before running: set the SPREADSHEET_ID script property if the default shared
 * spreadsheet should not be used.
 */
function setup() {
  CacheService.getScriptCache().remove('iot_ingest_ready_v3');
  CacheService.getScriptCache().remove('iot_ingest_ready_v4');
  CacheService.getScriptCache().remove('iot_ingest_ready_v5');
  CacheService.getScriptCache().remove('iot_latest_index_v2');
  ensureScriptProps_();
  ensureSheets_();
  seedConfigDefaults_();
  seedKeyCatalog_();
  seedKnownMetricDefinitions_();
  ensureRetentionTrigger_();
  Logger.log('IoT-Data setup complete.');
}

function ensureScriptProps_() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SPREADSHEET_ID')) {
    props.setProperty('SPREADSHEET_ID', DEFAULT_SPREADSHEET_ID);
  }
  Logger.log('SPREADSHEET_ID: ' + props.getProperty('SPREADSHEET_ID'));
}

function seedConfigDefaults_() {
  const logoUrl = 'https://www.dropbox.com/scl/fi/bwxb55mrt1qg4aqih5bxt/icon_dark.png?rlkey=g2mb3yooo636lr4qfa8zg8dlb&st=icn9wq0m&dl=1';
  if (getConfig_('refresh_interval_sec', null) === null) setConfig_('refresh_interval_sec', 60);
  if (getConfig_('offline_timeout_min', null) === null) setConfig_('offline_timeout_min', 15);
  if (getConfig_('retention_days', null) === null) setConfig_('retention_days', 7);
  if (getConfig_('schema_version', null) === null) setConfig_('schema_version', 1);
  if (getConfig_('background_image_url', null) === null) {
    setConfig_('background_image_url', 'https://dl.dropboxusercontent.com/scl/fi/4ymgkh5vfwol4l5yn2na5/v2.png?rlkey=xia5kn3txaz80y2blkdjzniwz&st=psc510yw&dl=1');
  }
  if (getConfig_('logo_url', null) === null) setConfig_('logo_url', logoUrl);
  if (getConfig_('map_width', null) === null) setConfig_('map_width', 1200);
  if (getConfig_('map_height', null) === null) setConfig_('map_height', 800);
}

function showSecrets() {
  const props = PropertiesService.getScriptProperties();
  Logger.log('SPREADSHEET_ID: ' + props.getProperty('SPREADSHEET_ID'));
}
