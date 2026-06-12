/**
 * Spreadsheet Storage V2.
 *
 * History is partitioned by device_model + event + report_type. Each uplink is
 * one row and normalized raw keys are stored as metric columns.
 */

const STORAGE_SCHEMA_VERSION = 2;
const STORAGE_MODE_LEGACY = 'legacy';
const STORAGE_MODE_DUAL = 'dual';
const STORAGE_MODE_WIDE = 'wide';
const STORAGE_PARTITION_BASE_HEADERS = ['reading_id', 'ts', 'device_id', 'empty_keys'];
const STORAGE_MAX_METRIC_COLUMNS = 512;
const STORAGE_MIGRATION_BATCH_ROWS = 1500;
const STORAGE_MIGRATION_HANDLER = 'continueStorageMigration';
const STORAGE_HEADER_CACHE_PREFIX = 'iot_partition_headers_v1:';

function storageMode_() {
  const mode = String(getConfig_('storage_mode', STORAGE_MODE_LEGACY) || '').toLowerCase();
  return mode === STORAGE_MODE_DUAL || mode === STORAGE_MODE_WIDE ? mode : STORAGE_MODE_LEGACY;
}

function resolveStorageDeviceModel_(deviceState, context, deviceId) {
  const manual = String(deviceState && deviceState.device_model || '').trim();
  if (manual) return manual;
  const detected = String(context && context.device_model || '').trim();
  if (detected) return detected;
  return 'device:' + String(deviceId || '').trim();
}

function appendWideReading_(readingId, deviceId, deviceModel, context, rawMetrics, derivedMetrics, ts) {
  const partition = ensureReadingPartition_(deviceModel, context && context.event, context && context.report_type);
  const sh = getSheet_(partition.sheet_name);
  const metrics = [];
  (rawMetrics || []).forEach(function (item) {
    if (!item || !item.metric) return;
    metrics.push({ key: String(item.metric), value: item.value });
  });
  (derivedMetrics || []).forEach(function (item) {
    if (!item || !item.metric) return;
    metrics.push({ key: 'derived__' + sanitizeMetricName_(item.metric), value: item.value });
  });

  const headerState = partitionHeaderState_(sh);
  const existingHeaders = headerState.headers;
  const headerMap = headerState.map;

  const missing = [];
  metrics.forEach(function (item) {
    if (!Object.prototype.hasOwnProperty.call(headerMap, item.key) && missing.indexOf(item.key) < 0) {
      missing.push(item.key);
    }
  });
  const currentMetricCount = Math.max(0, existingHeaders.filter(function (h) {
    return String(h || '').trim() !== '';
  }).length - STORAGE_PARTITION_BASE_HEADERS.length);
  const capacity = Math.max(0, STORAGE_MAX_METRIC_COLUMNS - currentMetricCount);
  const acceptedMissing = missing.slice(0, capacity);
  const rejected = missing.slice(capacity);
  if (acceptedMissing.length) {
    const startColumn = existingHeaders.length + 1;
    sh.getRange(1, startColumn, 1, acceptedMissing.length).setValues([acceptedMissing]);
    acceptedMissing.forEach(function (key, offset) {
      headerMap[key] = startColumn - 1 + offset;
      existingHeaders.push(key);
    });
    savePartitionHeaderState_(sh.getName(), existingHeaders);
  }

  const width = existingHeaders.length;
  const row = new Array(width).fill('');
  row[headerMap.reading_id] = readingId;
  row[headerMap.ts] = ts;
  row[headerMap.device_id] = deviceId;
  const emptyKeys = [];
  metrics.forEach(function (item) {
    if (!Object.prototype.hasOwnProperty.call(headerMap, item.key)) return;
    if (item.value === '' || item.value === null || item.value === undefined) {
      emptyKeys.push(item.key);
      row[headerMap[item.key]] = '';
    } else {
      row[headerMap[item.key]] = item.value;
    }
  });
  row[headerMap.empty_keys] = emptyKeys.length ? JSON.stringify(emptyKeys) : '';
  sh.getRange(sh.getLastRow() + 1, 1, 1, width).setValues([row]);
  if (acceptedMissing.length) {
    updatePartitionCatalog_(partition.partition_id, Math.min(STORAGE_MAX_METRIC_COLUMNS, currentMetricCount + acceptedMissing.length));
  }

  if (rejected.length) {
    logError_('appendWideReading_', new Error('Partition metric limit exceeded'), {
      partition_id: partition.partition_id,
      device_id: deviceId,
      rejected_keys: rejected
    });
  }
  return {
    partition_id: partition.partition_id,
    sheet_name: partition.sheet_name,
    rejected_keys: rejected
  };
}

function partitionHeaderState_(sheet) {
  const cache = CacheService.getScriptCache();
  const key = STORAGE_HEADER_CACHE_PREFIX + sheet.getName();
  const cached = cache.get(key);
  if (cached) {
    try {
      const headers = JSON.parse(cached);
      return { headers: headers, map: storageHeaderMap_(headers) };
    } catch (err) {}
  }
  const headers = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
  savePartitionHeaderState_(sheet.getName(), headers);
  return { headers: headers, map: storageHeaderMap_(headers) };
}

function storageHeaderMap_(headers) {
  const out = {};
  (headers || []).forEach(function (header, index) {
    const key = String(header || '').trim();
    if (key) out[key] = index;
  });
  return out;
}

function savePartitionHeaderState_(sheetName, headers) {
  try {
    CacheService.getScriptCache().put(
      STORAGE_HEADER_CACHE_PREFIX + sheetName,
      JSON.stringify(headers || []),
      21600
    );
  } catch (err) {}
}

function ensureReadingPartition_(deviceModel, eventName, reportType) {
  const model = String(deviceModel || '').trim() || 'unknown';
  const eventValue = String(eventName || '').trim();
  const reportValue = normalizeReportType_(reportType);
  const partitionId = storageHash_([model, eventValue, reportValue].join('\n'), 24);
  const cache = CacheService.getScriptCache();
  const cacheKey = 'iot_partition_v2:' + partitionId;
  const cachedSheetName = String(cache.get(cacheKey) || '');
  if (cachedSheetName && getSpreadsheet_().getSheetByName(cachedSheetName)) {
    return { partition_id: partitionId, sheet_name: cachedSheetName };
  }
  const catalog = getSheet_(SHEET_READING_PARTITIONS);
  const idx = headerIndex_(catalog);
  const values = catalog.getDataRange().getValues();
  for (let r = 1; r < values.length; r++) {
    if (String(valueByHeader_(values[r], idx, 'partition_id')) !== partitionId) continue;
    const sheetName = String(valueByHeader_(values[r], idx, 'sheet_name') || '');
    ensurePhysicalPartitionSheet_(sheetName);
    if (String(valueByHeader_(values[r], idx, 'status') || '') === 'archived') {
      if (idx.status !== undefined) catalog.getRange(r + 1, idx.status + 1).setValue('active');
      if (idx.updated_at !== undefined) catalog.getRange(r + 1, idx.updated_at + 1).setValue(new Date());
    }
    cache.put(cacheKey, sheetName, 21600);
    return { partition_id: partitionId, sheet_name: sheetName };
  }

  const sheetName = 'R_' + storageHash_(partitionId, 20);
  ensurePhysicalPartitionSheet_(sheetName);
  const now = new Date();
  const width = Math.max.apply(null, Object.keys(idx).map(function (key) { return idx[key]; })) + 1;
  const row = new Array(width).fill('');
  setByHeader_(row, idx, 'partition_id', partitionId);
  setByHeader_(row, idx, 'sheet_name', sheetName);
  setByHeader_(row, idx, 'device_model', model);
  setByHeader_(row, idx, 'event', eventValue);
  setByHeader_(row, idx, 'report_type', reportValue);
  setByHeader_(row, idx, 'status', 'active');
  setByHeader_(row, idx, 'metric_count', 0);
  setByHeader_(row, idx, 'created_at', now);
  setByHeader_(row, idx, 'updated_at', now);
  catalog.getRange(catalog.getLastRow() + 1, 1, 1, width).setValues([row]);
  cache.put(cacheKey, sheetName, 21600);
  return { partition_id: partitionId, sheet_name: sheetName };
}

function ensurePhysicalPartitionSheet_(sheetName) {
  const ss = getSpreadsheet_();
  let sh = ss.getSheetByName(sheetName);
  if (!sh) sh = ss.insertSheet(sheetName);
  ensureHeaders_(sh, STORAGE_PARTITION_BASE_HEADERS);
  if (sh.getFrozenRows() !== 1) sh.setFrozenRows(1);
  return sh;
}

function updatePartitionCatalog_(partitionId, metricCount) {
  const sh = getSheet_(SHEET_READING_PARTITIONS);
  const idx = headerIndex_(sh);
  const values = sh.getDataRange().getValues();
  for (let r = 1; r < values.length; r++) {
    if (String(valueByHeader_(values[r], idx, 'partition_id')) !== partitionId) continue;
    if (idx.metric_count !== undefined) sh.getRange(r + 1, idx.metric_count + 1).setValue(metricCount);
    if (idx.updated_at !== undefined) sh.getRange(r + 1, idx.updated_at + 1).setValue(new Date());
    return;
  }
}

function storageHash_(value, length) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value || ''),
    Utilities.Charset.UTF_8
  );
  return Utilities.base64EncodeWebSafe(digest).replace(/=+$/, '').slice(0, length || 24);
}

function apiGetStorageStatus() {
  ensureIngestReady_();
  return getStorageStatus_();
}

function getStorageStatus_() {
  const config = getConfigMap_();
  const partitions = readPartitionStatus_();
  const migration = readCurrentMigration_();
  return {
    schema_version: Number(config.storage_schema_version || STORAGE_SCHEMA_VERSION),
    mode: storageMode_(),
    retention_days: Number(config.retention_days || 30),
    migration_id: String(config.storage_migration_id || ''),
    migration: migration,
    partition_count: partitions.length,
    total_rows: partitions.reduce(function (sum, item) { return sum + item.rows; }, 0),
    total_metric_columns: partitions.reduce(function (sum, item) { return sum + item.metric_count; }, 0),
    partitions: partitions
  };
}

function readPartitionStatus_() {
  const sh = getSheet_(SHEET_READING_PARTITIONS);
  const idx = headerIndex_(sh);
  const values = sh.getDataRange().getValues();
  const ss = getSpreadsheet_();
  const out = [];
  for (let r = 1; r < values.length; r++) {
    const sheetName = String(valueByHeader_(values[r], idx, 'sheet_name') || '');
    if (!sheetName) continue;
    const physical = ss.getSheetByName(sheetName);
    out.push({
      partition_id: String(valueByHeader_(values[r], idx, 'partition_id') || ''),
      sheet_name: sheetName,
      device_model: String(valueByHeader_(values[r], idx, 'device_model') || ''),
      event: String(valueByHeader_(values[r], idx, 'event') || ''),
      report_type: String(valueByHeader_(values[r], idx, 'report_type') || ''),
      status: String(valueByHeader_(values[r], idx, 'status') || 'active'),
      metric_count: physical ? Math.max(0, physical.getLastColumn() - STORAGE_PARTITION_BASE_HEADERS.length) : 0,
      rows: physical ? Math.max(0, physical.getLastRow() - 1) : 0,
      updated_at: dateOut_(valueByHeader_(values[r], idx, 'updated_at'))
    });
  }
  return out;
}

function apiStartStorageMigration() {
  ensureIngestReady_();
  const existing = readCurrentMigration_();
  if (existing && /^(running|ready_for_validation|validated)$/.test(existing.status)) {
    return getStorageStatus_();
  }
  setConfig_('storage_schema_version', STORAGE_SCHEMA_VERSION);
  setConfig_('storage_mode', STORAGE_MODE_DUAL);
  const migrationId = 'migration_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
  setConfig_('storage_migration_id', migrationId);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const source = getSpreadsheet_().getSheetByName(SHEET_READINGS);
    const sourceRows = source ? Math.max(0, source.getLastRow() - 1) : 0;
    const firstRetained = source ? findFirstRetainedLegacyRow_(source) : 2;
    writeMigrationRow_({
      migration_id: migrationId,
      status: 'running',
      source_rows: sourceRows,
      first_retained_row: firstRetained,
      cursor_row: firstRetained,
      migrated_groups: 0,
      migrated_metrics: 0,
      started_at: new Date(),
      updated_at: new Date()
    });
  } finally {
    lock.releaseLock();
  }
  ensureStorageMigrationTrigger_();
  continueStorageMigration();
  return getStorageStatus_();
}

function continueStorageMigration() {
  ensureIngestReady_();
  const migration = readCurrentMigration_();
  if (!migration || migration.status !== 'running') {
    removeStorageMigrationTrigger_();
    return migration || { ok: true, skipped: true };
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return { ok: false, error: 'busy' };
  try {
    return continueStorageMigrationLocked_(migration);
  } catch (err) {
    updateMigrationFields_(migration.migration_id, {
      status: 'error',
      error: String(err && err.message || err),
      updated_at: new Date()
    });
    logError_('continueStorageMigration', err, migration);
    return { ok: false, error: String(err && err.message || err) };
  } finally {
    lock.releaseLock();
  }
}

function continueStorageMigrationLocked_(migration) {
  const source = getSpreadsheet_().getSheetByName(SHEET_READINGS);
  if (!source || migration.source_rows <= 0 || migration.cursor_row > migration.source_rows + 1) {
    updateMigrationFields_(migration.migration_id, {
      status: 'ready_for_validation',
      updated_at: new Date()
    });
    removeStorageMigrationTrigger_();
    return { ok: true, done: true };
  }
  const lastSourceRow = Math.min(source.getLastRow(), migration.source_rows + 1);
  let startRow = Math.max(2, migration.cursor_row || migration.first_retained_row || 2);
  if (startRow > lastSourceRow) {
    updateMigrationFields_(migration.migration_id, { status: 'ready_for_validation', updated_at: new Date() });
    removeStorageMigrationTrigger_();
    return { ok: true, done: true };
  }
  let count = Math.min(STORAGE_MIGRATION_BATCH_ROWS, lastSourceRow - startRow + 1);
  const idx = headerIndex_(source);
  const rows = source.getRange(startRow, 1, count, source.getLastColumn()).getValues();
  let processCount = rows.length;
  if (startRow + count - 1 < lastSourceRow && rows.length > 1) {
    const lastKey = legacyGroupKey_(rows[rows.length - 1], idx);
    let boundary = rows.length - 1;
    while (boundary > 0 && legacyGroupKey_(rows[boundary - 1], idx) === lastKey) boundary--;
    if (boundary > 0) processCount = boundary;
  }
  const groups = groupLegacyRows_(rows.slice(0, processCount), idx, startRow);
  const models = readDeviceModels_();
  let migratedMetrics = 0;
  groups.forEach(function (group) {
    const model = models[group.device_id] || 'device:' + group.device_id;
    if (!wideReadingExists_(group.reading_id, model, group.context)) {
      appendWideReading_(group.reading_id, group.device_id, model, group.context, group.metrics, group.derived, group.ts);
    }
    appendMeetingSampleFromLegacyGroup_(group);
    migratedMetrics += group.metrics.length + group.derived.length;
  });
  const nextRow = startRow + processCount;
  const done = nextRow > lastSourceRow;
  updateMigrationFields_(migration.migration_id, {
    status: done ? 'ready_for_validation' : 'running',
    cursor_row: nextRow,
    migrated_groups: Number(migration.migrated_groups || 0) + groups.length,
    migrated_metrics: Number(migration.migrated_metrics || 0) + migratedMetrics,
    updated_at: new Date()
  });
  if (done) removeStorageMigrationTrigger_();
  return { ok: true, done: done, groups: groups.length, next_row: nextRow };
}

function groupLegacyRows_(rows, idx, sourceStartRow) {
  const groups = [];
  const byKey = {};
  rows.forEach(function (row, offset) {
    const groupKey = legacyGroupKey_(row, idx);
    if (!groupKey) return;
    if (!byKey[groupKey]) {
      const ts = toDate_(valueByHeader_(row, idx, 'ts')) || new Date(0);
      const deviceId = String(valueByHeader_(row, idx, 'device_id') || '');
      const eventValue = String(valueByHeader_(row, idx, 'event') || '');
      const reportValue = String(valueByHeader_(row, idx, 'report_type') || '');
      const group = {
        reading_id: 'legacy_' + storageHash_([deviceId, ts.getTime(), eventValue, reportValue, sourceStartRow + offset].join('|'), 28),
        device_id: deviceId,
        ts: ts,
        context: { event: eventValue, report_type: reportValue },
        metrics: [],
        derived: [],
        canonical: []
      };
      byKey[groupKey] = group;
      groups.push(group);
    }
    const group = byKey[groupKey];
    const metric = String(valueByHeader_(row, idx, 'metric') || '').trim();
    if (!metric) return;
    const value = valueByHeader_(row, idx, 'value');
    const canonical = String(valueByHeader_(row, idx, 'canonical_key') || '').trim();
    if (String(valueByHeader_(row, idx, 'raw_json') || '') === 'derived') {
      group.derived.push({ metric: metric, value: value });
    } else {
      group.metrics.push({ metric: metric, value: value });
    }
    if (canonical) group.canonical.push({ canonical_key: canonical, value: value });
  });
  return groups;
}

function legacyGroupKey_(row, idx) {
  const deviceId = String(valueByHeader_(row, idx, 'device_id') || '').trim();
  const ts = toDate_(valueByHeader_(row, idx, 'ts'));
  if (!deviceId || !ts) return '';
  return [
    deviceId,
    ts.getTime(),
    String(valueByHeader_(row, idx, 'event') || ''),
    String(valueByHeader_(row, idx, 'report_type') || '')
  ].join('\n');
}

function wideReadingExists_(readingId, deviceModel, context) {
  const partition = ensureReadingPartition_(deviceModel, context && context.event, context && context.report_type);
  const sh = getSheet_(partition.sheet_name);
  if (sh.getLastRow() <= 1) return false;
  return !!sh.getRange(2, 1, sh.getLastRow() - 1, 1)
    .createTextFinder(readingId)
    .matchEntireCell(true)
    .findNext();
}

function readDeviceModels_() {
  const sh = getSheet_(SHEET_DEVICES);
  const idx = headerIndex_(sh);
  const values = sh.getDataRange().getValues();
  const out = {};
  for (let r = 1; r < values.length; r++) {
    const id = String(valueByHeader_(values[r], idx, 'device_id') || '').trim();
    if (!id) continue;
    out[id] = String(valueByHeader_(values[r], idx, 'device_model') || '').trim();
  }
  return out;
}

function findFirstRetainedLegacyRow_(sheet) {
  const retentionDays = Number(getConfig_('retention_days', 30));
  if (!isFinite(retentionDays) || retentionDays <= 0 || sheet.getLastRow() <= 1) return 2;
  const cutoff = Date.now() - retentionDays * 86400000;
  const idx = headerIndex_(sheet);
  const values = sheet.getRange(2, idx.ts + 1, sheet.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    const ts = toDate_(values[i][0]);
    if (ts && ts.getTime() >= cutoff) return i + 2;
  }
  return sheet.getLastRow() + 1;
}

function apiValidateStorageMigration() {
  ensureIngestReady_();
  const migration = readCurrentMigration_();
  if (!migration || migration.status !== 'ready_for_validation') {
    throw new Error('Validation requires ready_for_validation status.');
  }
  const result = validateStorageMigration_(migration);
  updateMigrationFields_(migration.migration_id, {
    status: result.ok ? 'validated' : 'validation_failed',
    validation_json: JSON.stringify(result),
    updated_at: new Date(),
    error: result.ok ? '' : 'Migration validation failed'
  });
  return getStorageStatus_();
}

function validateStorageMigration_(migration) {
  const legacy = validateLegacyMigrationSource_(migration);
  const expected = legacy.groups;
  const partitions = readPartitionStatus_();
  const wideRows = partitions.reduce(function (sum, item) { return sum + item.rows; }, 0);
  const result = {
    ok: expected === Number(migration.migrated_groups || 0) &&
      legacy.metrics === Number(migration.migrated_metrics || 0) &&
      legacy.missing_samples.length === 0,
    expected_groups: expected,
    migrated_groups: Number(migration.migrated_groups || 0),
    expected_metrics: legacy.metrics,
    migrated_metrics: Number(migration.migrated_metrics || 0),
    wide_rows: wideRows,
    partition_count: partitions.length,
    sampled_groups: legacy.sampled,
    missing_samples: legacy.missing_samples,
    checked_at: new Date().toISOString()
  };
  return result;
}

function validateLegacyMigrationSource_(migration) {
  const sh = getSpreadsheet_().getSheetByName(SHEET_READINGS);
  if (!sh || migration.source_rows <= 0) {
    return { groups: 0, metrics: 0, sampled: 0, missing_samples: [] };
  }
  const idx = headerIndex_(sh);
  const models = readDeviceModels_();
  const lastRow = Math.min(sh.getLastRow(), migration.source_rows + 1);
  let cursor = Math.max(2, migration.first_retained_row || 2);
  let previousKey = '';
  let groups = 0;
  let metrics = 0;
  const samples = [];
  while (cursor <= lastRow) {
    const count = Math.min(2000, lastRow - cursor + 1);
    const rows = sh.getRange(cursor, 1, count, sh.getLastColumn()).getValues();
    rows.forEach(function (row, offset) {
      const key = legacyGroupKey_(row, idx);
      if (!key) return;
      metrics++;
      if (key === previousKey) return;
      previousKey = key;
      groups++;
      if (samples.length >= 20) return;
      const ts = toDate_(valueByHeader_(row, idx, 'ts')) || new Date(0);
      const deviceId = String(valueByHeader_(row, idx, 'device_id') || '');
      const context = {
        event: String(valueByHeader_(row, idx, 'event') || ''),
        report_type: String(valueByHeader_(row, idx, 'report_type') || '')
      };
      samples.push({
        reading_id: 'legacy_' + storageHash_([
          deviceId,
          ts.getTime(),
          context.event,
          context.report_type,
          cursor + offset
        ].join('|'), 28),
        device_id: deviceId,
        model: models[deviceId] || 'device:' + deviceId,
        context: context
      });
    });
    cursor += count;
  }
  const missing = samples.filter(function (sample) {
    return !wideReadingExists_(sample.reading_id, sample.model, sample.context);
  }).map(function (sample) { return sample.reading_id; });
  return {
    groups: groups,
    metrics: metrics,
    sampled: samples.length,
    missing_samples: missing
  };
}

function apiFinalizeStorageMigration() {
  ensureIngestReady_();
  const migration = readCurrentMigration_();
  if (!migration || migration.status !== 'validated') {
    throw new Error('Finalize requires validated status.');
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const source = getSpreadsheet_().getSheetByName(SHEET_READINGS);
    let archiveId = '';
    let archiveSheetName = '';
    if (source) {
      const archive = SpreadsheetApp.create('SunDS IoT Legacy Archive ' +
        Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmm'));
      const copied = source.copyTo(archive);
      archiveSheetName = 'Readings';
      copied.setName(archiveSheetName);
      const blank = archive.getSheetByName('Sheet1');
      if (blank && archive.getSheets().length > 1) archive.deleteSheet(blank);
      if (copied.getLastRow() !== source.getLastRow()) {
        throw new Error('Archive row count mismatch. Legacy Readings was not removed.');
      }
      archiveId = archive.getId();
    }
    setConfigValueLocked_('storage_mode', STORAGE_MODE_WIDE);
    if (source) getSpreadsheet_().deleteSheet(source);
    updateMigrationFields_(migration.migration_id, {
      status: 'finalized',
      completed_at: new Date(),
      updated_at: new Date(),
      archive_spreadsheet_id: archiveId,
      archive_sheet_name: archiveSheetName,
      error: ''
    });
  } finally {
    lock.releaseLock();
  }
  return getStorageStatus_();
}

function setConfigValueLocked_(key, value) {
  const sh = getSheet_(SHEET_CONFIG);
  const values = sh.getDataRange().getValues();
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][0] || '') !== key) continue;
    sh.getRange(r + 1, 2).setValue(value);
    CacheService.getScriptCache().remove('iot_ingest_ready_v7');
    CacheService.getScriptCache().remove(INGEST_READY_CACHE_KEY);
    CacheService.getScriptCache().remove(CONFIG_CACHE_KEY);
    return;
  }
  sh.appendRow([key, value]);
  CacheService.getScriptCache().remove('iot_ingest_ready_v7');
  CacheService.getScriptCache().remove(INGEST_READY_CACHE_KEY);
  CacheService.getScriptCache().remove(CONFIG_CACHE_KEY);
}

function apiRetryStorageMigration() {
  ensureIngestReady_();
  const migration = readCurrentMigration_();
  if (!migration) return apiStartStorageMigration();
  if (!/^(error|validation_failed)$/.test(migration.status)) return getStorageStatus_();
  updateMigrationFields_(migration.migration_id, {
    status: 'running',
    error: '',
    updated_at: new Date()
  });
  ensureStorageMigrationTrigger_();
  continueStorageMigration();
  return getStorageStatus_();
}

function apiRunStorageMaintenance() {
  return _purgeOldReadingsImpl_();
}

function readCurrentMigration_() {
  const id = String(getConfig_('storage_migration_id', '') || '');
  if (!id) return null;
  const sh = getSheet_(SHEET_STORAGE_MIGRATIONS);
  const idx = headerIndex_(sh);
  const values = sh.getDataRange().getValues();
  for (let r = values.length - 1; r >= 1; r--) {
    if (String(valueByHeader_(values[r], idx, 'migration_id') || '') !== id) continue;
    const out = {};
    Object.keys(idx).forEach(function (key) {
      const value = valueByHeader_(values[r], idx, key);
      out[key] = /_at$/.test(key) ? dateOut_(value) : value;
    });
    ['source_rows', 'first_retained_row', 'cursor_row', 'migrated_groups', 'migrated_metrics'].forEach(function (key) {
      out[key] = Number(out[key] || 0);
    });
    return out;
  }
  return null;
}

function writeMigrationRow_(data) {
  const sh = getSheet_(SHEET_STORAGE_MIGRATIONS);
  const idx = headerIndex_(sh);
  const width = Math.max.apply(null, Object.keys(idx).map(function (key) { return idx[key]; })) + 1;
  const row = new Array(width).fill('');
  Object.keys(data || {}).forEach(function (key) {
    setByHeader_(row, idx, key, data[key]);
  });
  sh.getRange(sh.getLastRow() + 1, 1, 1, width).setValues([row]);
}

function updateMigrationFields_(migrationId, fields) {
  const sh = getSheet_(SHEET_STORAGE_MIGRATIONS);
  const idx = headerIndex_(sh);
  const values = sh.getDataRange().getValues();
  for (let r = values.length - 1; r >= 1; r--) {
    if (String(valueByHeader_(values[r], idx, 'migration_id') || '') !== migrationId) continue;
    const row = values[r].slice();
    Object.keys(fields || {}).forEach(function (key) {
      setByHeader_(row, idx, key, fields[key]);
    });
    sh.getRange(r + 1, 1, 1, row.length).setValues([row]);
    return;
  }
  throw new Error('Migration not found: ' + migrationId);
}

function ensureStorageMigrationTrigger_() {
  const exists = ScriptApp.getProjectTriggers().some(function (trigger) {
    return trigger.getHandlerFunction() === STORAGE_MIGRATION_HANDLER;
  });
  if (!exists) ScriptApp.newTrigger(STORAGE_MIGRATION_HANDLER).timeBased().everyMinutes(5).create();
}

function removeStorageMigrationTrigger_() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === STORAGE_MIGRATION_HANDLER) ScriptApp.deleteTrigger(trigger);
  });
}
