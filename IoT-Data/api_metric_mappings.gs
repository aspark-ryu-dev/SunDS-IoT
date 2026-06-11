/**
 * Raw metric -> canonical metric mapping.
 *
 * Raw keys remain the storage contract for Readings/Latest. CanonicalLatest is
 * a separate projection keyed by device_id + canonical_key so trigger and
 * interval values never overwrite each other.
 */

const METRIC_MAPPING_CACHE_KEY = 'iot_metric_mappings_v1';
const CANONICAL_LATEST_INDEX_CACHE_KEY = 'iot_canonical_latest_index_v1';
const METRIC_MAPPING_AUTO_CONFIDENCE = 0.90;
const METRIC_MAPPING_BATCH_SIZE = 20;
const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';
let METRIC_MAPPING_SUMMARY_MEMO = null;

function apiSaveMetricMapping(mapping) {
  ensureIngestReady_();
  const existing = readMetricMappings_().filter(function (row) {
    return row.mapping_id === String(mapping && mapping.mapping_id || '');
  })[0] || null;
  const normalized = normalizeMetricMappingInput_(mapping || {});
  normalized.status = normalized.status === 'disabled' ? 'disabled' : 'active';
  normalized.source = 'manual';
  normalized.confidence = 1;
  normalized.updated_at = new Date();
  saveMetricMapping_(normalized);
  if (normalized.status === 'disabled' || (existing && existing.canonical_key !== normalized.canonical_key)) {
    removeCanonicalLatestForMappingId_(normalized.mapping_id);
  }
  if (normalized.status === 'active') rebuildCanonicalLatestForMapping_(normalized);
  return getAdminSnapshot_();
}

function removeCanonicalLatestForMappingId_(mappingId) {
  const sh = getSheet_(SHEET_CANONICAL_LATEST);
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return;
  const idx = headerIndex_(sh);
  const rows = [];
  for (let r = 1; r < values.length; r++) {
    if (String(valueByHeader_(values[r], idx, 'mapping_id') || '') === mappingId) rows.push(r + 1);
  }
  rows.sort(function (a, b) { return b - a; }).forEach(function (row) {
    sh.deleteRow(row);
  });
  CacheService.getScriptCache().remove(CANONICAL_LATEST_INDEX_CACHE_KEY);
}

function apiReanalyzeMetricMapping(mappingId) {
  ensureIngestReady_();
  removeCanonicalLatestForMappingId_(String(mappingId || ''));
  updateMetricMappingStatus_(mappingId, 'pending', '', 0, 'manual-retry');
  return getAdminSnapshot_();
}

function apiProcessPendingMetricMappings() {
  ensureIngestReady_();
  const result = processPendingMetricMappings();
  return {
    result: result,
    snapshot: getAdminSnapshot_()
  };
}

function processPendingMetricMappings() {
  const apiKey = String(PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || '').trim();
  if (!apiKey) {
    return { ok: false, skipped: true, reason: 'GEMINI_API_KEY is not configured' };
  }

  const pending = readMetricMappings_().filter(function (row) {
    return row.status === 'pending';
  }).slice(0, METRIC_MAPPING_BATCH_SIZE);
  if (!pending.length) return { ok: true, processed: 0, active: 0, review: 0 };

  let generated;
  try {
    generated = requestGeminiMetricMappings_(pending, apiKey);
  } catch (err) {
    logError_('processPendingMetricMappings', err);
    return { ok: false, processed: 0, error: String(err && err.message || err) };
  }

  const byId = {};
  (generated || []).forEach(function (item) {
    byId[String(item.mapping_id || '')] = item;
  });

  let active = 0;
  let review = 0;
  pending.forEach(function (row) {
    const candidate = byId[row.mapping_id];
    if (!candidate) {
      updateMetricMappingStatus_(row.mapping_id, 'review', 'AI response did not contain this mapping', 0, 'gemini');
      review++;
      return;
    }
    const canonical = normalizeCanonicalKey_(candidate.canonical_key);
    const scope = normalizeMappingScope_(candidate.scope || canonical.split('.')[0]);
    const confidence = clampConfidence_(candidate.confidence);
    const valid = isValidCanonicalKey_(canonical) && canonical.indexOf(scope + '.') === 0;
    const status = valid && confidence >= METRIC_MAPPING_AUTO_CONFIDENCE ? 'active' : 'review';
    const next = {
      mapping_id: row.mapping_id,
      device_model: row.device_model,
      event: row.event,
      report_type: row.report_type,
      raw_key: row.raw_key,
      canonical_key: valid ? canonical : '',
      label_ja: String(candidate.label_ja || '').trim(),
      data_type: normalizeMappingDataType_(candidate.data_type),
      unit: String(candidate.unit || '').trim(),
      scope: scope,
      sample_value: row.sample_value,
      confidence: confidence,
      status: status,
      source: 'gemini',
      reason: String(candidate.reason || '').trim(),
      updated_at: new Date()
    };
    saveMetricMapping_(next);
    if (status === 'active') {
      rebuildCanonicalLatestForMapping_(next);
      active++;
    } else {
      review++;
    }
  });
  return { ok: true, processed: pending.length, active: active, review: review };
}

function ensureMetricMappingTrigger_() {
  const handler = 'processPendingMetricMappings';
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === handler) ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger(handler).timeBased().everyMinutes(5).create();
}

function seedKnownMetricMappingsFromLatest_() {
  const sh = getSheet_(SHEET_LATEST);
  const values = sh.getDataRange().getValues();
  if (values.length <= 1) return { mappings: 0, values: 0 };
  const idx = headerIndex_(sh);
  const mappings = {};
  const byDevice = {};
  for (let r = 1; r < values.length; r++) {
    const deviceId = String(valueByHeader_(values[r], idx, 'device_id') || '').trim();
    const rawKey = String(valueByHeader_(values[r], idx, 'metric') || '').trim();
    if (!deviceId || !rawKey) continue;
    const value = valueByHeader_(values[r], idx, 'value');
    const mapping = compileKnownMetricMapping_(rawKey, value, {});
    if (!mapping) continue;
    mappings[mapping.mapping_id] = mapping;
    if (!byDevice[deviceId]) byDevice[deviceId] = [];
    byDevice[deviceId].push({
      metric: rawKey,
      value: value,
      mapping: mapping,
      ts: toDate_(valueByHeader_(values[r], idx, 'ts')) || new Date()
    });
  }
  const mappingRows = Object.keys(mappings).map(function (id) { return mappings[id]; });
  appendMetricMappings_(mappingRows);
  upsertCanonicalLatestBatch_(byDevice);
  return { mappings: mappingRows.length, values: Object.keys(byDevice).length };
}

function compileIngestMetrics_(parsed, ts) {
  const context = parsed.context || {};
  const index = loadMetricMappingIndex_();
  const rowsToAdd = [];
  const compiled = [];

  (parsed.metrics || []).forEach(function (metric) {
    const local = compileKnownMetricMapping_(metric.metric, metric.value, context);
    let mapping = local;
    if (!mapping) {
      mapping = findMetricMapping_(index, context, metric.metric);
    }
    if (!mapping) {
      mapping = createPendingMetricMapping_(context, metric.metric, metric.value, ts);
      rowsToAdd.push(mapping);
      index[mappingLookupKey_(mapping.device_model, mapping.event, mapping.report_type, mapping.raw_key)] = mapping;
    } else if (local && !findMetricMapping_(index, context, metric.metric)) {
      rowsToAdd.push(local);
      index[mappingLookupKey_(local.device_model, local.event, local.report_type, local.raw_key)] = local;
    }
    compiled.push({
      metric: metric.metric,
      value: metric.value,
      mapping: mapping && mapping.status === 'active' ? mapping : null
    });
  });

  if (rowsToAdd.length) appendMetricMappings_(rowsToAdd);
  return compiled;
}

function compileKnownMetricMapping_(rawKey, sampleValue, context) {
  const raw = normalizeMetricPathForPattern_(rawKey);
  const reportType = normalizeReportType_(context.report_type);
  const event = normalizeMappingText_(context.event);
  const model = normalizeMappingText_(context.device_model);
  let canonical = '';
  let label = '';
  let unit = '';
  let scope = '';

  const stateDirect = {
    current_total: ['state.people.current.total', '現在人数', '人'],
    people_count_all: ['state.people.current.total', '現在人数', '人'],
    occupancy: ['state.occupancy', '在室状態', ''],
    temperature: ['state.environment.temperature', '温度', '°C'],
    humidity: ['state.environment.humidity', '湿度', '%'],
    co2: ['state.environment.co2', 'CO2', 'ppm'],
    illumination: ['state.environment.illumination', '照度', 'lx'],
    light_level: ['state.environment.illumination', '照度', 'lx'],
    daylight: ['state.environment.illumination', '照度', 'lx'],
    battery: ['state.power.battery', 'バッテリー', '%']
  };
  if (stateDirect[raw]) {
    canonical = stateDirect[raw][0];
    label = stateDirect[raw][1];
    unit = stateDirect[raw][2];
  }

  let match;
  if (!canonical && (match = raw.match(/^(?:current_counted|occupancy)_(\d+)$/))) {
    canonical = match[0].indexOf('occupancy') === 0
      ? 'state.area.' + match[1] + '.occupancy'
      : 'state.area.' + match[1] + '.people.total';
    label = 'エリア' + match[1] + (match[0].indexOf('occupancy') === 0 ? ' 在室状態' : ' 現在人数');
    unit = match[0].indexOf('occupancy') === 0 ? '' : '人';
  }
  if (!canonical && (match = raw.match(/^region_(?:data|trigger_data)_region_count_data_(\d+)_total_current_(female|male|total)$/))) {
    canonical = 'state.area.' + match[1] + '.people.' + (match[2] === 'total' ? 'total' : match[2]);
    label = 'エリア' + match[1] + ' 現在' + (match[2] === 'female' ? '女性人数' : match[2] === 'male' ? '男性人数' : '人数');
    unit = '人';
  }
  if (!canonical && (match = raw.match(/^region_trigger_data_region_count_data_(\d+)_total_current_(female|male|total)$/))) {
    canonical = 'state.area.' + match[1] + '.people.' + (match[2] === 'total' ? 'total' : match[2]);
    label = 'エリア' + match[1] + ' 現在' + (match[2] === 'female' ? '女性人数' : match[2] === 'male' ? '男性人数' : '人数');
    unit = '人';
  }
  if (!canonical && (match = raw.match(/^line_(trigger|periodic)_data_(\d+)_(children|group|staff|total)_(female_in|female_out|male_in|male_out|in|out)$/))) {
    scope = match[1] === 'periodic' ? 'interval' : 'trigger';
    canonical = scope + '.line.' + match[2] + '.' + match[3] + '.' + match[4].replace(/_/g, '.');
    label = 'ライン' + match[2] + ' ' + metricLabelJa_(rawKey);
    unit = '人';
  }
  if (!canonical && (match = raw.match(/^line_trigger_data_(\d+)_(children|group|staff|total)_(female_in|female_out|male_in|male_out|in|out)$/))) {
    canonical = 'trigger.line.' + match[1] + '.' + match[2] + '.' + match[3].replace(/_/g, '.');
    label = 'ライン' + match[1] + ' ' + metricLabelJa_(rawKey);
    unit = '人';
  }
  if (!canonical && (match = raw.match(/^line_total_data_(\d+)_(children|group|staff|total)_(.+_counted)$/))) {
    canonical = 'cumulative.line.' + match[1] + '.' + match[2] + '.' + match[3].replace(/_counted$/, '').replace(/_/g, '.');
    label = 'ライン' + match[1] + ' 累計 ' + metricLabelJa_(rawKey);
    unit = '人';
  }
  if (!canonical && (match = raw.match(/^(?:region_data_)?dwell_time_data_(\d+)_(max_dwell_time|avg_dwell_time|duration|people_id|region)$/))) {
    scope = reportType === 'trigger' || match[2] === 'duration' || match[2] === 'people_id' ? 'trigger' : 'interval';
    canonical = scope + '.area.' + match[1] + '.dwell.' + ({
      max_dwell_time: 'maximum',
      avg_dwell_time: 'average',
      duration: 'duration',
      people_id: 'people.id',
      region: 'number'
    }[match[2]]);
    label = 'エリア' + match[1] + ' ' + metricLabelJa_(rawKey);
    unit = match[2] === 'duration' ? 'ms' : /dwell_time/.test(match[2]) ? 's' : '';
  }
  if (!canonical && (match = raw.match(/^region_trigger_data_dwell_time_data_(\d+)_(duration|people_id|region)$/))) {
    canonical = 'trigger.area.' + match[1] + '.dwell.' + ({ duration: 'duration', people_id: 'people.id', region: 'number' }[match[2]]);
    label = 'エリア' + match[1] + ' ' + metricLabelJa_(rawKey);
    unit = match[2] === 'duration' ? 'ms' : '';
  }
  if (!canonical && /^(in_counted|out_counted|capacity_counted)$/.test(raw)) {
    canonical = 'interval.line.total.' + raw.replace('_counted', '').replace('capacity', 'capacity');
    label = '周期 ' + metricLabelJa_(rawKey);
    unit = '人';
  }
  if (!canonical && (match = raw.match(/^total_data_(in|out|capacity)_cumulative_counted$/))) {
    canonical = 'cumulative.line.total.' + match[1];
    label = '累計 ' + metricLabelJa_(rawKey);
    unit = '人';
  }
  if (!canonical && (match = raw.match(/^line_trigger_data_(in|out)$/))) {
    canonical = 'trigger.line.total.' + match[1];
    label = (match[1] === 'in' ? '入場' : '退場') + 'トリガー';
    unit = '人';
  }
  if (!canonical && (match = raw.match(/^device_info_cpu_(cpu_temperature|cpu_usage)$/))) {
    canonical = 'system.cpu.' + (match[1] === 'cpu_temperature' ? 'temperature' : 'usage');
    label = match[1] === 'cpu_temperature' ? 'CPU温度' : 'CPU使用率';
    unit = match[1] === 'cpu_temperature' ? '°C' : '%';
  }
  if (!canonical && raw === 'device_info_running_time') {
    canonical = 'system.running.time';
    label = '稼働時間';
    unit = 's';
  }

  if (!canonical && isKnownDeviceExampleMetric_(rawKey)) {
    scope = inferScopeFromRawKey_(rawKey, reportType);
    canonical = scope + '.metric.' + canonicalPathFromRaw_(rawKey);
    label = metricLabelJa_(rawKey);
    unit = metricUnitForKey_(rawKey);
  }
  if (!canonical) return null;

  scope = normalizeMappingScope_(scope || canonical.split('.')[0]);
  return {
    mapping_id: makeMetricMappingId_(model, event, reportType, rawKey),
    device_model: model,
    event: event,
    report_type: reportType,
    raw_key: String(rawKey || '').trim(),
    canonical_key: canonical,
    label_ja: label || metricLabelJa_(rawKey),
    data_type: inferMappingDataTypeFromValue_(sampleValue, rawKey),
    unit: unit,
    scope: scope,
    sample_value: sampleValueForSheet_(sampleValue),
    confidence: 1,
    status: 'active',
    source: 'rule',
    reason: '既知のMilesightキーをローカルルールで変換',
    updated_at: new Date()
  };
}

function createPendingMetricMapping_(context, rawKey, sampleValue, ts) {
  const model = normalizeMappingText_(context.device_model);
  const event = normalizeMappingText_(context.event);
  const reportType = normalizeReportType_(context.report_type);
  return {
    mapping_id: makeMetricMappingId_(model, event, reportType, rawKey),
    device_model: model,
    event: event,
    report_type: reportType,
    raw_key: String(rawKey || '').trim(),
    canonical_key: '',
    label_ja: metricLabelJa_(rawKey),
    data_type: inferMappingDataTypeFromValue_(sampleValue, rawKey),
    unit: metricUnitForKey_(rawKey),
    scope: inferScopeFromRawKey_(rawKey, reportType),
    sample_value: sampleValueForSheet_(sampleValue),
    confidence: 0,
    status: 'pending',
    source: 'ingest',
    reason: '',
    updated_at: ts || new Date()
  };
}

function appendMetricMappings_(mappings) {
  if (!mappings.length) return;
  const sh = getSheet_(SHEET_METRIC_MAPPINGS);
  const idx = headerIndex_(sh);
  const existing = loadMetricMappingIndex_();
  const rows = [];
  const addedMappings = [];
  mappings.forEach(function (mapping) {
    const key = mappingLookupKey_(mapping.device_model, mapping.event, mapping.report_type, mapping.raw_key);
    if (existing[key] && existing[key].mapping_id !== mapping.mapping_id) return;
    if (existing[key]) return;
    rows.push(metricMappingToRow_(mapping, idx));
    addedMappings.push(mapping);
    existing[key] = mapping;
  });
  if (rows.length) {
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, sh.getLastColumn()).setValues(rows);
    clearMetricMappingCache_();
    syncMappingsToKeyCatalog_(addedMappings);
  }
}

function saveMetricMapping_(mapping) {
  const sh = getSheet_(SHEET_METRIC_MAPPINGS);
  ensureHeaders_(sh, HEADERS.MetricMappings);
  const idx = headerIndex_(sh);
  const values = sh.getDataRange().getValues();
  let rowNumber = 0;
  for (let r = 1; r < values.length; r++) {
    if (String(valueByHeader_(values[r], idx, 'mapping_id') || '') === mapping.mapping_id) {
      rowNumber = r + 1;
      break;
    }
  }
  const row = metricMappingToRow_(mapping, idx);
  if (rowNumber) sh.getRange(rowNumber, 1, 1, row.length).setValues([row]);
  else sh.getRange(sh.getLastRow() + 1, 1, 1, row.length).setValues([row]);
  clearMetricMappingCache_();
  syncMappingToKeyCatalog_(mapping);
}

function updateMetricMappingStatus_(mappingId, status, reason, confidence, source) {
  const rows = readMetricMappings_();
  const row = rows.filter(function (item) { return item.mapping_id === String(mappingId || ''); })[0];
  if (!row) throw new Error('Mapping not found: ' + mappingId);
  row.status = status;
  row.reason = reason || row.reason;
  row.confidence = clampConfidence_(confidence);
  row.source = source || row.source;
  row.updated_at = new Date();
  saveMetricMapping_(row);
}

function readMetricMappings_() {
  const sh = getSheet_(SHEET_METRIC_MAPPINGS);
  ensureHeaders_(sh, HEADERS.MetricMappings);
  const values = sh.getDataRange().getValues();
  const idx = headerIndex_(sh);
  const out = [];
  for (let r = 1; r < values.length; r++) {
    const rawKey = String(valueByHeader_(values[r], idx, 'raw_key') || '').trim();
    if (!rawKey) continue;
    out.push({
      mapping_id: String(valueByHeader_(values[r], idx, 'mapping_id') || ''),
      device_model: String(valueByHeader_(values[r], idx, 'device_model') || ''),
      event: String(valueByHeader_(values[r], idx, 'event') || ''),
      report_type: String(valueByHeader_(values[r], idx, 'report_type') || ''),
      raw_key: rawKey,
      canonical_key: String(valueByHeader_(values[r], idx, 'canonical_key') || ''),
      label_ja: String(valueByHeader_(values[r], idx, 'label_ja') || ''),
      data_type: String(valueByHeader_(values[r], idx, 'data_type') || 'number'),
      unit: String(valueByHeader_(values[r], idx, 'unit') || ''),
      scope: String(valueByHeader_(values[r], idx, 'scope') || ''),
      sample_value: valueByHeader_(values[r], idx, 'sample_value'),
      confidence: Number(valueByHeader_(values[r], idx, 'confidence') || 0),
      status: String(valueByHeader_(values[r], idx, 'status') || 'pending'),
      source: String(valueByHeader_(values[r], idx, 'source') || ''),
      reason: String(valueByHeader_(values[r], idx, 'reason') || ''),
      updated_at: dateOut_(valueByHeader_(values[r], idx, 'updated_at'))
    });
  }
  return out.sort(function (a, b) {
    return String(b.updated_at || '').localeCompare(String(a.updated_at || ''));
  });
}

function loadMetricMappingIndex_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(METRIC_MAPPING_CACHE_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch (err) {}
  }
  const index = {};
  readMetricMappings_().forEach(function (mapping) {
    index[mappingLookupKey_(mapping.device_model, mapping.event, mapping.report_type, mapping.raw_key)] = mapping;
  });
  const json = JSON.stringify(index);
  if (json.length < 95000) cache.put(METRIC_MAPPING_CACHE_KEY, json, 21600);
  return index;
}

function findMetricMapping_(index, context, rawKey) {
  const model = normalizeMappingText_(context.device_model);
  const event = normalizeMappingText_(context.event);
  const reportType = normalizeReportType_(context.report_type);
  const candidates = [
    mappingLookupKey_(model, event, reportType, rawKey),
    mappingLookupKey_('', event, reportType, rawKey),
    mappingLookupKey_(model, '', reportType, rawKey),
    mappingLookupKey_('', '', reportType, rawKey),
    mappingLookupKey_('', '', '', rawKey)
  ];
  for (let i = 0; i < candidates.length; i++) {
    if (index[candidates[i]]) return index[candidates[i]];
  }
  return null;
}

function metricMappingToRow_(mapping, idx) {
  const width = Math.max.apply(null, Object.keys(idx).map(function (name) { return idx[name]; })) + 1;
  const row = new Array(width).fill('');
  Object.keys(mapping).forEach(function (key) {
    setByHeader_(row, idx, key, mapping[key]);
  });
  return row;
}

function normalizeMetricMappingInput_(mapping) {
  const rawKey = String(mapping.raw_key || '').trim();
  if (!rawKey) throw new Error('raw_key is required');
  const requestedStatus = String(mapping.status || 'active');
  const canonical = normalizeCanonicalKey_(mapping.canonical_key);
  if (requestedStatus !== 'disabled' && !isValidCanonicalKey_(canonical)) throw new Error('canonical_key must contain lowercase letters, numbers and dots only');
  const scope = normalizeMappingScope_(mapping.scope || (canonical ? canonical.split('.')[0] : 'state'));
  if (canonical && canonical.indexOf(scope + '.') !== 0) throw new Error('canonical_key must start with scope');
  const model = normalizeMappingText_(mapping.device_model);
  const event = normalizeMappingText_(mapping.event);
  const reportType = normalizeReportType_(mapping.report_type);
  return {
    mapping_id: String(mapping.mapping_id || makeMetricMappingId_(model, event, reportType, rawKey)),
    device_model: model,
    event: event,
    report_type: reportType,
    raw_key: rawKey,
    canonical_key: canonical,
    label_ja: String(mapping.label_ja || metricLabelJa_(rawKey)).trim(),
    data_type: normalizeMappingDataType_(mapping.data_type),
    unit: String(mapping.unit || '').trim(),
    scope: scope,
    sample_value: sampleValueForSheet_(mapping.sample_value),
    confidence: clampConfidence_(mapping.confidence || 1),
    status: requestedStatus,
    source: String(mapping.source || 'manual'),
    reason: String(mapping.reason || '').trim(),
    updated_at: new Date()
  };
}

function requestGeminiMetricMappings_(rows, apiKey) {
  const props = PropertiesService.getScriptProperties();
  const model = String(props.getProperty('GEMINI_MODEL') || DEFAULT_GEMINI_MODEL).trim();
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent';
  const requestRows = rows.map(function (row) {
    return {
      mapping_id: row.mapping_id,
      device_model: row.device_model,
      event: row.event,
      report_type: row.report_type,
      raw_key: row.raw_key,
      sample_value: row.sample_value
    };
  });
  const prompt = [
    'You map IoT sensor metric keys to stable semantic canonical keys.',
    'Return Japanese labels that are short and understandable to office users.',
    'Canonical keys must use lowercase letters, numbers and dots only.',
    'Allowed scopes: state, trigger, interval, cumulative, system.',
    'Keep array indexes as area.N or line.N when the raw key contains an index.',
    'Current people/occupancy/environment values use state even when delivered in an interval report.',
    'Do not invent units. Use an empty unit when uncertain and lower confidence.',
    JSON.stringify(requestRows)
  ].join('\n');
  const schema = {
    type: 'OBJECT',
    properties: {
      mappings: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            mapping_id: { type: 'STRING' },
            canonical_key: { type: 'STRING' },
            label_ja: { type: 'STRING' },
            data_type: { type: 'STRING', enum: ['number', 'boolean', 'string'] },
            unit: { type: 'STRING' },
            scope: { type: 'STRING', enum: ['state', 'trigger', 'interval', 'cumulative', 'system'] },
            confidence: { type: 'NUMBER' },
            reason: { type: 'STRING' }
          },
          required: ['mapping_id', 'canonical_key', 'label_ja', 'data_type', 'unit', 'scope', 'confidence', 'reason']
        }
      }
    },
    required: ['mappings']
  };
  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-goog-api-key': apiKey },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    })
  });
  const code = response.getResponseCode();
  const body = response.getContentText();
  if (code < 200 || code >= 300) throw new Error('Gemini API failed (' + code + '): ' + body.slice(0, 500));
  const envelope = JSON.parse(body);
  const text = envelope && envelope.candidates && envelope.candidates[0] &&
    envelope.candidates[0].content && envelope.candidates[0].content.parts &&
    envelope.candidates[0].content.parts[0] && envelope.candidates[0].content.parts[0].text;
  if (!text) throw new Error('Gemini API returned no structured output');
  const parsed = JSON.parse(text);
  return parsed.mappings || [];
}

function upsertCanonicalLatest_(deviceId, compiled, context, ts) {
  const active = (compiled || []).filter(function (item) {
    return item.mapping && item.mapping.status === 'active' && item.mapping.canonical_key;
  });
  if (!active.length) return;
  const sh = getSheet_(SHEET_CANONICAL_LATEST);
  const idx = headerIndex_(sh);
  const index = canonicalLatestRowIndex_(sh, idx);
  const updates = [];
  const appends = [];
  active.forEach(function (item) {
    const canonical = item.mapping.canonical_key;
    const latestKey = latestKey_(deviceId, canonical);
    const rowNumber = index[latestKey];
    const row = canonicalLatestRow_(idx, deviceId, canonical, item.value, item.ts || ts, item.metric, context, item.mapping.mapping_id, latestKey);
    if (rowNumber) updates.push({ row: rowNumber, values: row });
    else appends.push(row);
  });
  updates.forEach(function (update) {
    sh.getRange(update.row, 1, 1, update.values.length).setValues([update.values]);
  });
  if (appends.length) {
    sh.getRange(sh.getLastRow() + 1, 1, appends.length, appends[0].length).setValues(appends);
  }
  CacheService.getScriptCache().remove(CANONICAL_LATEST_INDEX_CACHE_KEY);
}

function upsertCanonicalLatestBatch_(byDevice) {
  const sh = getSheet_(SHEET_CANONICAL_LATEST);
  const idx = headerIndex_(sh);
  const width = sh.getLastColumn();
  const values = sh.getDataRange().getValues();
  const rows = values.slice(1);
  const rowIndex = {};

  rows.forEach(function (row, i) {
    const deviceId = String(valueByHeader_(row, idx, 'device_id') || '').trim();
    const canonical = String(valueByHeader_(row, idx, 'canonical_key') || '').trim();
    if (deviceId && canonical) rowIndex[latestKey_(deviceId, canonical)] = i;
  });

  Object.keys(byDevice || {}).forEach(function (deviceId) {
    const newest = {};
    (byDevice[deviceId] || []).forEach(function (item) {
      if (!item.mapping || item.mapping.status !== 'active' || !item.mapping.canonical_key) return;
      const canonical = item.mapping.canonical_key;
      if (!newest[canonical] || item.ts.getTime() >= newest[canonical].ts.getTime()) {
        newest[canonical] = item;
      }
    });
    Object.keys(newest).forEach(function (canonical) {
      const item = newest[canonical];
      const latestKey = latestKey_(deviceId, canonical);
      const row = canonicalLatestRow_(
        idx,
        deviceId,
        canonical,
        item.value,
        item.ts,
        item.metric,
        {},
        item.mapping.mapping_id,
        latestKey
      );
      while (row.length < width) row.push('');
      if (rowIndex[latestKey] !== undefined) {
        rows[rowIndex[latestKey]] = row;
      } else {
        rowIndex[latestKey] = rows.length;
        rows.push(row);
      }
    });
  });

  if (rows.length) sh.getRange(2, 1, rows.length, width).setValues(rows);
  CacheService.getScriptCache().remove(CANONICAL_LATEST_INDEX_CACHE_KEY);
}

function canonicalLatestRowIndex_(sh, idx) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CANONICAL_LATEST_INDEX_CACHE_KEY);
  if (cached) {
    try { return JSON.parse(cached); } catch (err) {}
  }
  const values = sh.getDataRange().getValues();
  const out = {};
  for (let r = 1; r < values.length; r++) {
    const deviceId = String(valueByHeader_(values[r], idx, 'device_id') || '').trim();
    const canonical = String(valueByHeader_(values[r], idx, 'canonical_key') || '').trim();
    if (deviceId && canonical) out[latestKey_(deviceId, canonical)] = r + 1;
  }
  const json = JSON.stringify(out);
  if (json.length < 95000) cache.put(CANONICAL_LATEST_INDEX_CACHE_KEY, json, 21600);
  return out;
}

function canonicalLatestRow_(idx, deviceId, canonical, value, ts, rawKey, context, mappingId, latestKey) {
  const width = Math.max.apply(null, Object.keys(idx).map(function (name) { return idx[name]; })) + 1;
  const row = new Array(width).fill('');
  setByHeader_(row, idx, 'device_id', deviceId);
  setByHeader_(row, idx, 'canonical_key', canonical);
  setByHeader_(row, idx, 'value', value);
  setByHeader_(row, idx, 'ts', ts);
  setByHeader_(row, idx, 'raw_key', rawKey);
  setByHeader_(row, idx, 'event', context.event || '');
  setByHeader_(row, idx, 'report_type', context.report_type || '');
  setByHeader_(row, idx, 'mapping_id', mappingId);
  setByHeader_(row, idx, 'latest_key', latestKey);
  return row;
}

function rebuildCanonicalLatestForMapping_(mapping) {
  if (!mapping || mapping.status !== 'active' || !mapping.canonical_key) return;
  const latest = getSheet_(SHEET_LATEST).getDataRange().getValues();
  if (latest.length <= 1) return;
  const idx = headerIndex_(getSheet_(SHEET_LATEST));
  for (let r = 1; r < latest.length; r++) {
    const raw = String(valueByHeader_(latest[r], idx, 'metric') || '').trim();
    if (raw !== mapping.raw_key) continue;
    const deviceId = String(valueByHeader_(latest[r], idx, 'device_id') || '').trim();
    if (!deviceId) continue;
    upsertCanonicalLatest_(deviceId, [{
      metric: raw,
      value: valueByHeader_(latest[r], idx, 'value'),
      mapping: mapping
    }], {
      event: mapping.event,
      report_type: mapping.report_type
    }, toDate_(valueByHeader_(latest[r], idx, 'ts')) || new Date());
  }
}

function syncMappingToKeyCatalog_(mapping) {
  if (!mapping || !mapping.raw_key) return;
  const sh = getSheet_(SHEET_KEY_CATALOG);
  ensureHeaders_(sh, HEADERS.KeyCatalog);
  const idx = headerIndex_(sh);
  const values = sh.getDataRange().getValues();
  for (let r = 1; r < values.length; r++) {
    if (String(valueByHeader_(values[r], idx, 'key') || '').trim() !== mapping.raw_key) continue;
    const currentCanonical = String(valueByHeader_(values[r], idx, 'canonical_key') || '').trim();
    setCellByHeader_(sh, r + 1, idx, 'canonical_key', currentCanonical && currentCanonical !== mapping.canonical_key ? 'multiple' : mapping.canonical_key);
    setCellByHeader_(sh, r + 1, idx, 'scope', currentCanonical && currentCanonical !== mapping.canonical_key ? 'mixed' : mapping.scope);
    setCellByHeader_(sh, r + 1, idx, 'mapping_status', mapping.status);
    return;
  }
}

function syncMappingsToKeyCatalog_(mappings) {
  if (!mappings || !mappings.length) return;
  const byRawKey = {};
  mappings.forEach(function (mapping) {
    if (mapping && mapping.raw_key) byRawKey[mapping.raw_key] = mapping;
  });
  const sh = getSheet_(SHEET_KEY_CATALOG);
  ensureHeaders_(sh, HEADERS.KeyCatalog);
  const idx = headerIndex_(sh);
  const values = sh.getDataRange().getValues();
  let changed = false;
  for (let r = 1; r < values.length; r++) {
    const rawKey = String(valueByHeader_(values[r], idx, 'key') || '').trim();
    const mapping = byRawKey[rawKey];
    if (!mapping) continue;
    const currentCanonical = String(valueByHeader_(values[r], idx, 'canonical_key') || '').trim();
    setByHeader_(values[r], idx, 'canonical_key',
      currentCanonical && currentCanonical !== mapping.canonical_key ? 'multiple' : mapping.canonical_key);
    setByHeader_(values[r], idx, 'scope',
      currentCanonical && currentCanonical !== mapping.canonical_key ? 'mixed' : mapping.scope);
    setByHeader_(values[r], idx, 'mapping_status', mapping.status);
    changed = true;
  }
  if (changed) sh.getRange(1, 1, values.length, values[0].length).setValues(values);
}

function setCellByHeader_(sheet, row, idx, header, value) {
  if (idx[header] !== undefined) sheet.getRange(row, idx[header] + 1).setValue(value);
}

function clearMetricMappingCache_() {
  CacheService.getScriptCache().remove(METRIC_MAPPING_CACHE_KEY);
  METRIC_MAPPING_SUMMARY_MEMO = null;
}

function metricMappingSummaryForRawKey_(rawKey) {
  if (!METRIC_MAPPING_SUMMARY_MEMO) {
    METRIC_MAPPING_SUMMARY_MEMO = {};
    readMetricMappings_().forEach(function (mapping) {
      if (!mapping.raw_key) return;
      const current = METRIC_MAPPING_SUMMARY_MEMO[mapping.raw_key];
      if (!current) {
        METRIC_MAPPING_SUMMARY_MEMO[mapping.raw_key] = {
          canonical_key: mapping.canonical_key,
          scope: mapping.scope,
          mapping_status: mapping.status
        };
        return;
      }
      if (current.canonical_key !== mapping.canonical_key) {
        current.canonical_key = 'multiple';
        current.scope = 'mixed';
      }
      if (mapping.status === 'review' || mapping.status === 'pending') current.mapping_status = mapping.status;
    });
  }
  return METRIC_MAPPING_SUMMARY_MEMO[String(rawKey || '').trim()] || {};
}

function mappingLookupKey_(model, event, reportType, rawKey) {
  return [normalizeMappingText_(model), normalizeMappingText_(event), normalizeReportType_(reportType), String(rawKey || '').trim()].join('\u0001');
}

function makeMetricMappingId_(model, event, reportType, rawKey) {
  const source = mappingLookupKey_(model, event, reportType, rawKey);
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, source, Utilities.Charset.UTF_8);
  return 'map_' + Utilities.base64EncodeWebSafe(digest).replace(/=+$/, '').slice(0, 22);
}

function normalizeMappingText_(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeReportType_(value) {
  const raw = normalizeMappingText_(value);
  if (raw === 'periodic') return 'interval';
  return raw === 'trigger' || raw === 'interval' ? raw : '';
}

function normalizeCanonicalKey_(value) {
  return String(value || '').trim().toLowerCase()
    .replace(/[^a-z0-9.]+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

function isValidCanonicalKey_(value) {
  return /^(state|trigger|interval|cumulative|system)(?:\.[a-z0-9]+)+$/.test(String(value || ''));
}

function normalizeMappingScope_(value) {
  const scope = normalizeMappingText_(value);
  return /^(state|trigger|interval|cumulative|system)$/.test(scope) ? scope : 'state';
}

function normalizeMappingDataType_(value) {
  const type = normalizeMappingText_(value);
  return type === 'boolean' || type === 'string' ? type : 'number';
}

function clampConfidence_(value) {
  const n = Number(value);
  if (!isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function sampleValueForSheet_(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 300);
  return String(value).slice(0, 300);
}

function inferMappingDataTypeFromValue_(value, rawKey) {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (value !== null && value !== undefined && String(value).trim() !== '' && isFinite(Number(value))) return 'number';
  return inferKeyDataType_(rawKey);
}

function inferScopeFromRawKey_(rawKey, reportType) {
  const raw = normalizeMetricPathForPattern_(rawKey);
  if (/^(device_info|network_info)_/.test(raw)) return 'system';
  if (/cumulative|line_total_data|total_counter/.test(raw)) return 'cumulative';
  if (/trigger/.test(raw)) return 'trigger';
  if (/periodic|avg_|max_|period_/.test(raw)) return 'interval';
  if (reportType === 'trigger') return 'trigger';
  if (reportType === 'interval') return 'interval';
  return 'state';
}

function canonicalPathFromRaw_(rawKey) {
  return String(rawKey || '').trim().toLowerCase()
    .replace(/\[\]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.+|\.+$/g, '') || 'value';
}

function isKnownDeviceExampleMetric_(rawKey) {
  const target = normalizeMetricPathForPattern_(rawKey);
  const models = Object.keys(DEVICE_EXAMPLE_KEYS || {});
  for (let i = 0; i < models.length; i++) {
    const keys = DEVICE_EXAMPLE_KEYS[models[i]] || [];
    for (let j = 0; j < keys.length; j++) {
      if (normalizeMetricPathForPattern_(keys[j]) === target) return true;
    }
  }
  return false;
}
