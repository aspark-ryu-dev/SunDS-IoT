/**
 * IoT-Data — Readings retention.
 *
 * The Readings sheet is an append-only history (one row per metric per uplink)
 * and grows without bound. This module deletes rows older than `retention_days`
 * (Config sheet, default 30). Latest/Devices are never touched.
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

  const retentionDays = Number(getConfig_('retention_days', 30));
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
    const sh = getSheet_(SHEET_READINGS);
    const idx = headerIndex_(sh);
    const tsCol = (idx.ts === undefined ? 0 : idx.ts) + 1;
    const lastRow = sh.getLastRow();
    if (lastRow <= 1) {
      const empty = { ok: true, deleted: 0, remaining: 0, cutoff: cutoff.toISOString() };
      Logger.log('purgeOldReadings: ' + JSON.stringify(empty));
      return empty;
    }

    const total = lastRow - 1;
    const tsValues = sh.getRange(2, tsCol, total, 1).getValues();

    // Count the leading contiguous block of rows older than the cutoff.
    let deleteCount = 0;
    for (let i = 0; i < tsValues.length; i++) {
      const d = toDate_(tsValues[i][0]);
      // Unparseable ts at the top is treated as old (legacy/garbage) and removed.
      if (d && d.getTime() >= cutoff.getTime()) break;
      deleteCount++;
      if (deleteCount >= RETENTION_MAX_DELETE_PER_RUN) break;
    }

    if (deleteCount > 0) sh.deleteRows(2, deleteCount);

    const result = {
      ok: true,
      deleted: deleteCount,
      remaining: total - deleteCount,
      cutoff: cutoff.toISOString(),
      capped: deleteCount >= RETENTION_MAX_DELETE_PER_RUN
    };
    Logger.log('purgeOldReadings: ' + JSON.stringify(result));
    return result;
  } finally {
    lock.releaseLock();
  }
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
