/**
 * IoT-Data — Readings retention.
 *
 * Deletes history older than `retention_days` (default 7) from legacy history,
 * Storage V2 partitions, MeetingSamples, and MeetingEvents.
 *
 * Readings are appended in timestamp-ascending order, so old rows form a
 * contiguous block at the TOP of the sheet. We delete only the leading block
 * up to the first row whose ts >= cutoff, so a row newer than the cutoff is
 * never removed (safe even if order is slightly off).
 */

// Safety cap: never delete more than this many rows in a single run.
const RETENTION_MAX_DELETE_PER_RUN = 200000;

/**
 * Trigger handler AND manual entry point (no trailing underscore so triggers
 * and the editor can call it). Returns a summary and logs it.
 */
function purgeOldReadings() {
  try {
    return _purgeOldReadingsImpl_();
  } catch (err) {
    try { logError_('purgeOldReadings', err); } catch (_) {}
    throw err;
  }
}

function _purgeOldReadingsImpl_() {
  ensureIngestReady_();

  const retentionDays = Number(getConfig_('retention_days', 7));
  if (!isFinite(retentionDays) || retentionDays <= 0) {
    const skipped = { ok: true, skipped: true, reason: 'retention disabled (retention_days <= 0)' };
    Logger.log('purgeOldReadings: ' + JSON.stringify(skipped));
    return skipped;
  }

  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    const busy = { ok: false, error: 'busy' };
    Logger.log('purgeOldReadings: ' + JSON.stringify(busy));
    return busy;
  }
  try {
    const ss = getSpreadsheet_();
    const legacy = ss.getSheetByName(SHEET_READINGS);
    const legacyDeleted = legacy ? purgeSheetLeadingRows_(legacy, 'ts', cutoff) : 0;
    const partitionResult = purgeStoragePartitions_(cutoff);
    const meetingEventsDeleted = purgeNamedHistorySheet_(SHEET_MEETING_EVENTS, cutoff);
    const meetingSamplesDeleted = purgeNamedHistorySheet_(SHEET_MEETING_SAMPLES, cutoff);
    const result = {
      ok: true,
      deleted: legacyDeleted + partitionResult.deleted + meetingEventsDeleted + meetingSamplesDeleted,
      legacy_deleted: legacyDeleted,
      partition_deleted: partitionResult.deleted,
      meeting_events_deleted: meetingEventsDeleted,
      meeting_samples_deleted: meetingSamplesDeleted,
      archived_partitions: partitionResult.archived,
      cutoff: cutoff.toISOString(),
      capped: partitionResult.capped || legacyDeleted >= RETENTION_MAX_DELETE_PER_RUN
    };
    Logger.log('purgeOldReadings: ' + JSON.stringify(result));
    return result;
  } finally {
    lock.releaseLock();
  }
}

function purgeNamedHistorySheet_(sheetName, cutoff) {
  const sh = getSpreadsheet_().getSheetByName(sheetName);
  if (!sh) return 0;
  return purgeSheetLeadingRows_(sh, 'ts', cutoff);
}

function purgeSheetLeadingRows_(sh, tsHeader, cutoff) {
  const idx = headerIndex_(sh);
  const lastRow = sh.getLastRow();
  if (lastRow <= 1) return 0;
  const tsIndex = idx[String(tsHeader || 'ts').toLowerCase()];
  if (tsIndex === undefined) return 0;
  const values = sh.getRange(2, tsIndex + 1, lastRow - 1, 1).getValues();
  let count = 0;
  for (let i = 0; i < values.length; i++) {
    const date = toDate_(values[i][0]);
    if (date && date.getTime() >= cutoff.getTime()) break;
    count++;
    if (count >= RETENTION_MAX_DELETE_PER_RUN) break;
  }
  if (count) sh.deleteRows(2, count);
  return count;
}

function purgeStoragePartitions_(cutoff) {
  const catalog = getSheet_(SHEET_READING_PARTITIONS);
  const idx = headerIndex_(catalog);
  const values = catalog.getDataRange().getValues();
  const ss = getSpreadsheet_();
  let deleted = 0;
  let archived = 0;
  let capped = false;
  for (let r = 1; r < values.length; r++) {
    const sheetName = String(valueByHeader_(values[r], idx, 'sheet_name') || '');
    const physical = sheetName ? ss.getSheetByName(sheetName) : null;
    if (!physical) continue;
    const removed = purgeSheetLeadingRows_(physical, 'ts', cutoff);
    deleted += removed;
    if (removed >= RETENTION_MAX_DELETE_PER_RUN) capped = true;
    const empty = physical.getLastRow() <= 1;
    if (empty && String(valueByHeader_(values[r], idx, 'status') || '') !== 'archived') {
      if (idx.status !== undefined) catalog.getRange(r + 1, idx.status + 1).setValue('archived');
      if (idx.updated_at !== undefined) catalog.getRange(r + 1, idx.updated_at + 1).setValue(new Date());
      archived++;
    }
  }
  return { deleted: deleted, archived: archived, capped: capped };
}

/** Set the retention window (days) in Config. Run from the editor, e.g. setRetentionDays(7). */
function setRetentionDays(days) {
  const n = Number(days);
  if (!isFinite(n) || n < 0) throw new Error('days must be a number >= 0 (0 disables purge)');
  setConfig_('retention_days', n);
  Logger.log('retention_days = ' + n);
  return n;
}

/** Public wrapper to install the daily trigger from the Apps Script editor. */
function installRetentionTrigger() {
  ensureRetentionTrigger_();
  Logger.log('installRetentionTrigger: daily purgeOldReadings trigger installed.');
}

/** Idempotently (re)install a daily time-based trigger for purgeOldReadings. */
function ensureRetentionTrigger_() {
  const handler = 'purgeOldReadings';
  ScriptApp.getProjectTriggers().forEach(function (tr) {
    if (tr.getHandlerFunction() === handler) ScriptApp.deleteTrigger(tr);
  });
  // Project timeZone is Asia/Tokyo (appsscript.json) => atHour(3) is ~03:00 JST.
  ScriptApp.newTrigger(handler).timeBased().everyDays(1).atHour(3).create();
}
