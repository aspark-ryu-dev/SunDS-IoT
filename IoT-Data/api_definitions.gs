/**
 * AUTO-MIGRATED from defs.gs — see README.
 * Edits here are fine; this file is hand-maintained from now on.
 */
const DEF_TYPES = { metric: true, expr: true, expression: true, formula: true };

const DEF_TYPES_EXPR = { expr: true, expression: true, formula: true };
const DEFINITIONS_CACHE_KEY = 'iot_definitions_v1';

/**

 * Save a metric definition (type='metric' to override label/unit; type='expr' for derived).

 * @param {{id:string, type?:('metric'|'expr'), name?:string, unit?:string, source?:string, expression?:string, params?:string, enabled?:boolean}} definition

 * @returns {object} updated admin snapshot

 */

function apiSaveDefinition(definition) {
  ensureIngestReady_();
  const clean = normalizeDefinitionInput_(definition);
  if (!clean.id) throw new Error('id is required');
  if (isSystemMetadataKey_(clean.id)) throw new Error('system metadata key cannot be added as a definition');
  if (!DEF_TYPES[clean.type]) throw new Error('type must be metric or expr');
  if (DEF_TYPES_EXPR[clean.type] && !clean.expression) throw new Error('expression is required');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = getSheet_(SHEET_DEFINITIONS);
    const values = sh.getDataRange().getValues();
    for (let r = 1; r < values.length; r++) {
      if (String(values[r][0]) === clean.id) {
        sh.getRange(r + 1, 1, 1, 8).setValues([definitionToRow_(clean)]);
        clearDefinitionsCache_();
        return getAdminSnapshot_();
      }
    }
    sh.appendRow(definitionToRow_(clean));
    clearDefinitionsCache_();
    return getAdminSnapshot_();
  } finally {
    lock.releaseLock();
  }
}

/**

 * Delete a definition by id.

 * @param {string} id

 * @returns {object} updated admin snapshot

 */

function apiDeleteDefinition(id) {
  ensureIngestReady_();
  const target = String(id || '').trim();
  if (!target) throw new Error('id is required');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = getSheet_(SHEET_DEFINITIONS);
    const values = sh.getDataRange().getValues();
    for (let r = values.length - 1; r >= 1; r--) {
      if (String(values[r][0]) === target) sh.deleteRow(r + 1);
    }
    clearDefinitionsCache_();
    return getAdminSnapshot_();
  } finally {
    lock.releaseLock();
  }
}

function apiSeedKnownMetricDefinitions() {
  ensureIngestReady_();
  seedKeyCatalog_();
  seedKnownMetricDefinitions_();
  return getAdminSnapshot_();
}

/**

 * Evaluate an expression against a JSON scope. Safe-fails: returns {ok:false,error}.

 * @param {string} expression

 * @param {string} scopeJson  JSON-encoded object passed as the expression's scope.

 * @returns {{ok:true,value:any} | {ok:false,error:string}}

 */

function apiTestExpression(expression, scopeJson) {
  let scope = {};
  if (String(scopeJson || '').trim()) {
    scope = JSON.parse(scopeJson);
  }
  return evalExpression_(expression, scope);
}

function seedKnownMetricDefinitions_() {
  const sh = getSheet_(SHEET_DEFINITIONS);
  const values = sh.getDataRange().getValues();
  const exists = {};
  let changed = false;
  for (let r = 1; r < values.length; r++) {
    const id = String(values[r][0] || '').trim();
    if (id) exists[id] = true;
    if (String(values[r][1] || '').trim().toLowerCase() === 'raw') {
      values[r][1] = 'metric';
      changed = true;
    }
    if (isTemperatureMetricKey_(id) && String(values[r][3] || '').trim() === 'C') {
      values[r][3] = '°C';
      changed = true;
    }
  }

  const rows = knownMetricKeys_().filter(function (key) {
    return !exists[key];
  }).map(function (key) {
    const meta = metricMetaForKey_(key);
    return [key, 'metric', meta.label, meta.unit, 'device-examples', '', '{"origin":"device-examples"}', true];
  });

  if (changed) {
    sh.getRange(1, 1, values.length, values[0].length).setValues(values);
  }
  if (rows.length) {
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, 8).setValues(rows);
  }
  if (changed || rows.length) clearDefinitionsCache_();
  return { added: rows.length };
}

function normalizeDefinitionInput_(definition) {
  definition = definition || {};
  let type = String(definition.type || 'metric').trim().toLowerCase();
  if (type === 'raw') type = 'metric';
  return {
    id: String(definition.id || '').trim(),
    type: type,
    name: String(definition.name || '').trim(),
    unit: String(definition.unit || '').trim(),
    source: String(definition.source || '*').trim() || '*',
    expression: String(definition.expression || '').trim(),
    params: String(definition.params || '').trim(),
    enabled: parseBool_(definition.enabled)
  };
}

function definitionToRow_(d) {
  return [d.id, d.type, d.name, d.unit, d.source, d.expression, d.params, d.enabled];
}

function readDefinitions_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(DEFINITIONS_CACHE_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch (err) {}
  }
  const sh = getSheet_(SHEET_DEFINITIONS);
  const values = sh.getDataRange().getValues();
  const out = [];
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][0]).trim() === '') continue;
    if (isSystemMetadataKey_(values[r][0])) continue;
    out.push({
      id: String(values[r][0]),
      type: String(values[r][1] || 'expr').toLowerCase(),
      name: String(values[r][2] || ''),
      unit: String(values[r][3] || ''),
      source: String(values[r][4] || '*'),
      expression: String(values[r][5] || ''),
      params: String(values[r][6] || ''),
      enabled: parseBool_(values[r][7])
    });
  }
  try { cache.put(DEFINITIONS_CACHE_KEY, JSON.stringify(out), 21600); } catch (err) {}
  return out;
}

function latestScopeForDevice_(device_id) {
  const cache = CacheService.getScriptCache();
  const cacheKey = latestScopeCacheKey_(device_id);
  const cached = cache.get(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch (err) {}
  }
  const sh = getSheet_(SHEET_LATEST);
  const values = sh.getDataRange().getValues();
  const scope = {};
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][0]) !== device_id) continue;
    const metric = String(values[r][1] || '').trim();
    const value = Number(values[r][2]);
    if (metric && isFinite(value)) scope[metric] = value;
  }
  try { cache.put(cacheKey, JSON.stringify(scope), 21600); } catch (err) {}
  return scope;
}

function clearDefinitionsCache_() {
  CacheService.getScriptCache().remove(DEFINITIONS_CACHE_KEY);
}

function applyDefinitionsForDevice_(device_id, ts) {
  const defs = readDefinitions_();
  if (!defs.length) return [];

  const scope = latestScopeForDevice_(device_id);
  const derived = [];
  defs.forEach(function (d) {
    if (!d.enabled || !DEF_TYPES_EXPR[d.type]) return;
    if (!(d.source === '*' || d.source === '' || d.source === device_id)) return;
    const result = evalExpression_(d.expression, scope);
    if (!result.ok) {
      Logger.log('definition "' + d.id + '" failed for ' + device_id + ': ' + result.error);
      return;
    }
    scope[d.id] = result.value;
    derived.push({ metric: d.id, value: result.value });
  });

  if (derived.length) {
    upsertLatest_(device_id, derived, ts, {});
  }
  return derived;
}

function appendDerivedReadings_(device_id, metrics, ts, context) {
  if (!metrics || !metrics.length) return;
  const sh = getSheet_(SHEET_READINGS);
  const idx = headerIndex_(sh);
  const width = Math.max.apply(null, Object.keys(idx).map(function (name) { return idx[name]; })) + 1;
  const rows = metrics.map(function (m) {
    const row = new Array(width).fill('');
    setByHeader_(row, idx, 'ts', ts);
    setByHeader_(row, idx, 'device_id', device_id);
    setByHeader_(row, idx, 'metric', m.metric);
    setByHeader_(row, idx, 'value', m.value);
    setByHeader_(row, idx, 'raw_json', 'derived');
    setByHeader_(row, idx, 'event', context && context.event || '');
    setByHeader_(row, idx, 'report_type', context && context.report_type || '');
    return row;
  });
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, width).setValues(rows);
}
