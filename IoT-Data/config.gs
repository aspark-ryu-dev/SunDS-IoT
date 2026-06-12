/**
 * IoT-Data — Config sheet accessors (singleton key/value store).
 * Config is the one sheet written by both projects, so writes take the script lock
 * and the caller should tolerate the rare cross-project race (low write frequency).
 */

function getConfig_(key, defaultValue) {
  const v = getConfigMap_()[key];
  return (v === '' || v === null || v === undefined) ? defaultValue : v;
}

const CONFIG_CACHE_KEY = 'iot_config_v1';

function getConfigMap_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CONFIG_CACHE_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch (err) {}
  }
  const sh = getSheet_(SHEET_CONFIG);
  const values = sh.getDataRange().getValues();
  const out = {};
  for (let r = 1; r < values.length; r++) {
    const key = String(values[r][0] || '').trim();
    if (key) out[key] = values[r][1];
  }
  try { cache.put(CONFIG_CACHE_KEY, JSON.stringify(out), 21600); } catch (err) {}
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
        CacheService.getScriptCache().remove('iot_ingest_ready_v7');
        CacheService.getScriptCache().remove(INGEST_READY_CACHE_KEY);
        CacheService.getScriptCache().remove(CONFIG_CACHE_KEY);
        return;
      }
    }
    sh.appendRow([key, value]);
    CacheService.getScriptCache().remove('iot_ingest_ready_v3');
    CacheService.getScriptCache().remove('iot_ingest_ready_v4');
    CacheService.getScriptCache().remove('iot_ingest_ready_v7');
    CacheService.getScriptCache().remove(INGEST_READY_CACHE_KEY);
    CacheService.getScriptCache().remove(CONFIG_CACHE_KEY);
  } finally {
    lock.releaseLock();
  }
}
