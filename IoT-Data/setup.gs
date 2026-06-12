/**
 * IoT-Data one-time / idempotent setup.
 *
 * Before running: set the SPREADSHEET_ID script property if the default shared
 * spreadsheet should not be used.
 */
function setup() {
  PropertiesService.getScriptProperties().deleteProperty('RUNTIME_SCHEMA_VERSION');
  CacheService.getScriptCache().remove('iot_ingest_ready_v3');
  CacheService.getScriptCache().remove('iot_ingest_ready_v4');
  CacheService.getScriptCache().remove('iot_ingest_ready_v5');
  CacheService.getScriptCache().remove('iot_ingest_ready_v6');
  CacheService.getScriptCache().remove('iot_ingest_ready_v7');
  CacheService.getScriptCache().remove(INGEST_READY_CACHE_KEY);
  CacheService.getScriptCache().remove('iot_latest_index_v2');
  CacheService.getScriptCache().remove('iot_metric_mappings_v1');
  CacheService.getScriptCache().remove('iot_canonical_latest_index_v1');
  ensureScriptProps_();
  ensureSheets_();
  Logger.log('setup: sheets ready');
  seedConfigDefaults_();
  upgradeRetentionDefault_();
  Logger.log('setup: config ready');
  seedKeyCatalog_();
  Logger.log('setup: key catalog ready');
  seedKnownMetricDefinitions_();
  Logger.log('setup: definitions ready');
  seedKnownMetricMappingsFromLatest_();
  Logger.log('setup: canonical latest ready');
  ensureRetentionTrigger_();
  ensureMetricMappingTrigger_();
  PropertiesService.getScriptProperties().setProperty('RUNTIME_SCHEMA_VERSION', 'storage-v4-latest-context');
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
  const defaults = {
    refresh_interval_sec: 60,
    offline_timeout_min: 15,
    retention_days: 30,
    schema_version: 1,
    storage_schema_version: 2,
    storage_mode: 'legacy',
    storage_migration_id: '',
    background_image_url: 'https://dl.dropboxusercontent.com/scl/fi/4ymgkh5vfwol4l5yn2na5/v2.png?rlkey=xia5kn3txaz80y2blkdjzniwz&st=psc510yw&dl=1',
    logo_url: logoUrl,
    map_width: 1200,
    map_height: 800
  };
  const sh = getSheet_(SHEET_CONFIG);
  const existing = getConfigMap_();
  const rows = Object.keys(defaults).filter(function (key) {
    return !Object.prototype.hasOwnProperty.call(existing, key);
  }).map(function (key) {
    return [key, defaults[key]];
  });
  if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, 2).setValues(rows);
  CacheService.getScriptCache().remove(CONFIG_CACHE_KEY);
}

function upgradeRetentionDefault_() {
  const sh = getSheet_(SHEET_CONFIG);
  const values = sh.getDataRange().getValues();
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][0] || '') !== 'retention_days') continue;
    const current = Number(values[r][1]);
    if (!isFinite(current) || current === 7) sh.getRange(r + 1, 2).setValue(30);
    CacheService.getScriptCache().remove(CONFIG_CACHE_KEY);
    return;
  }
  sh.appendRow(['retention_days', 30]);
  CacheService.getScriptCache().remove(CONFIG_CACHE_KEY);
}

function showSecrets() {
  const props = PropertiesService.getScriptProperties();
  Logger.log('SPREADSHEET_ID: ' + props.getProperty('SPREADSHEET_ID'));
}
