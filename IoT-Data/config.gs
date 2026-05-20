/**
 * IoT-Data — Config sheet accessors (singleton key/value store).
 * Config is the one sheet written by both projects, so writes take the script lock
 * and the caller should tolerate the rare cross-project race (low write frequency).
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

function setConfig_(key, value) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = getSheet_(SHEET_CONFIG);
    const values = sh.getDataRange().getValues();
    for (let r = 1; r < values.length; r++) {
      if (String(values[r][0]) === key) {
        sh.getRange(r + 1, 2).setValue(value);
        CacheService.getScriptCache().remove('iot_ingest_ready_v3');
        CacheService.getScriptCache().remove('iot_ingest_ready_v4');
        return;
      }
    }
    sh.appendRow([key, value]);
    CacheService.getScriptCache().remove('iot_ingest_ready_v3');
    CacheService.getScriptCache().remove('iot_ingest_ready_v4');
  } finally {
    lock.releaseLock();
  }
}
