/**
 * IoT-Dashboard - shared spreadsheet schema accessors.
 * This project is public read-only; IoT-Data owns sheet editing.
 */

const SHEET_DEVICES = 'Devices';
const SHEET_LATEST = 'Latest';
const SHEET_DEFINITIONS = 'Definitions';
const SHEET_CONFIG = 'Config';
const SHEET_LAYOUT = 'Layout';
const DEFAULT_SPREADSHEET_ID = '1HZwK5W8Yhd15sNypNO9Ydfx4G0NSehvEoTm8ZmKRygE';

const LAYOUT_HEADERS = ['item_id', 'bind_type', 'bind_ref', 'x_norm', 'y_norm', 'label', 'style', 'enabled'];
const LATEST_HEADERS = ['device_id', 'metric', 'value', 'ts', 'latest_key'];

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || DEFAULT_SPREADSHEET_ID;
  if (!id) {
    throw new Error('Script Property SPREADSHEET_ID is not set. See README.md.');
  }
  return SpreadsheetApp.openById(id);
}

function getSheet_(name) {
  const sh = getSpreadsheet_().getSheetByName(name);
  if (!sh) {
    throw new Error('Sheet not found: ' + name +
      '. Run IoT-Data setup() (and this project\'s setup()) first.');
  }
  return sh;
}

/** Idempotent: create the Layout sheet if missing, ensure its header, freeze row 1. */
function ensureSheets_() {
  const ss = getSpreadsheet_();
  let sh = ss.getSheetByName(SHEET_LAYOUT);
  if (!sh) sh = ss.insertSheet(SHEET_LAYOUT);
  const firstRow = sh.getRange(1, 1, 1, LAYOUT_HEADERS.length).getValues()[0];
  const needsHeader = firstRow.join('') === '' || firstRow.some(function (cell, i) {
    return String(cell).trim().toLowerCase() !== LAYOUT_HEADERS[i];
  });
  if (needsHeader) {
    sh.getRange(1, 1, 1, LAYOUT_HEADERS.length).setValues([LAYOUT_HEADERS]);
  }
  sh.setFrozenRows(1);

  const latest = ss.getSheetByName(SHEET_LATEST);
  if (latest) ensureHeaders_(latest, LATEST_HEADERS);
}

function ensureHeaders_(sheet, requiredHeaders) {
  const lastCol = Math.max(1, sheet.getLastColumn());
  let row = sheet.getRange(1, 1, 1, Math.max(lastCol, requiredHeaders.length)).getValues()[0];
  const existing = {};
  row.forEach(function (cell) {
    const key = String(cell || '').trim().toLowerCase();
    if (key) existing[key] = true;
  });
  requiredHeaders.forEach(function (header) {
    const key = String(header).trim().toLowerCase();
    if (!existing[key]) {
      row.push(header);
      existing[key] = true;
    }
  });
  while (row.length && String(row[row.length - 1] || '').trim() === '') row.pop();
  sheet.getRange(1, 1, 1, row.length).setValues([row]);
}

/** Map a sheet's header row to { headerName: zeroBasedColumnIndex }. */
function headerIndex_(sheet) {
  const lastCol = Math.max(1, sheet.getLastColumn());
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const idx = {};
  headers.forEach(function (h, i) {
    idx[String(h).trim().toLowerCase()] = i;
  });
  return idx;
}
