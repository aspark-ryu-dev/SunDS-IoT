/**
 * IoT-Dashboard one-time / idempotent setup.
 *
 * The dashboard is public and read-only. Run IoT-Data setup() first because
 * IoT-Data owns Devices, Latest, Config, and Layout.
 */
function setup() {
  CacheService.getScriptCache().remove(DASHBOARD_STATE_CACHE_KEY);
  CacheService.getScriptCache().remove(DASHBOARD_MAPPING_CACHE_KEY);
  ensureScriptProps_();
  ensureSheets_();
  Logger.log('IoT-Dashboard read-only setup check complete.');
}

function ensureScriptProps_() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SPREADSHEET_ID')) {
    props.setProperty('SPREADSHEET_ID', DEFAULT_SPREADSHEET_ID);
  }
  Logger.log('SPREADSHEET_ID: ' + props.getProperty('SPREADSHEET_ID'));
}
