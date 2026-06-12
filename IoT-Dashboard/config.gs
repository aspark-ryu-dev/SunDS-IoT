/**
 * IoT-Dashboard — Config sheet accessors (singleton key/value store).
 * Config is shared with IoT-Data, which owns every shared Spreadsheet write.
 */

function getConfig_(key, defaultValue) {
  const v = getConfigMap_()[key];
  return (v === '' || v === null || v === undefined) ? defaultValue : v;
}

function getConfigMap_() {
  const sh = getSheet_(SHEET_CONFIG);
  const values = sh.getDataRange().getValues();
  const out = {};
  for (let r = 1; r < values.length; r++) {
    const key = String(values[r][0] || '').trim();
    if (key) out[key] = values[r][1];
  }
  return out;
}
