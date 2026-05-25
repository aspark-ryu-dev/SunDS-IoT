/**
 * Centralized error log: appends one row per failure to the ErrorLog sheet.
 * Never throws; safe to call from any catch.
 *
 * Schema: ['ts', 'api', 'message', 'payload', 'stack']
 */
const SHEET_ERROR_LOG = 'ErrorLog';
const ERROR_LOG_HEADERS = ['ts', 'api', 'message', 'payload', 'stack'];

function logError_(apiName, err, payload) {
  try {
    const ss = getSpreadsheet_();
    let sh = ss.getSheetByName(SHEET_ERROR_LOG);
    if (!sh) {
      sh = ss.insertSheet(SHEET_ERROR_LOG);
      sh.getRange(1, 1, 1, ERROR_LOG_HEADERS.length).setValues([ERROR_LOG_HEADERS]);
      sh.setFrozenRows(1);
    }
    const msg = (err && err.message) ? String(err.message) : String(err);
    const stack = (err && err.stack) ? String(err.stack).slice(0, 800) : '';
    const payloadStr = payload === undefined ? '' : safeStringify_(payload).slice(0, 800);
    sh.appendRow([new Date(), String(apiName || ''), msg.slice(0, 400), payloadStr, stack]);
  } catch (loggingErr) {
    // Don't let logging itself break anything.
    Logger.log('logError_ failed: ' + loggingErr);
  }
}

function safeStringify_(v) {
  try { return JSON.stringify(v); } catch (e) { return String(v); }
}

/** Manual cleanup helper: keep only the latest N rows (default 500). */
function trimErrorLog(keep) {
  const n = Number(keep) || 500;
  const ss = getSpreadsheet_();
  const sh = ss.getSheetByName(SHEET_ERROR_LOG);
  if (!sh) return { ok: true, deleted: 0 };
  const last = sh.getLastRow();
  if (last <= n + 1) return { ok: true, deleted: 0 };
  const toDelete = last - 1 - n;
  sh.deleteRows(2, toDelete);
  return { ok: true, deleted: toDelete };
}
