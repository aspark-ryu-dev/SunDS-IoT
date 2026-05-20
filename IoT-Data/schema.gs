/**
 * IoT-Data shared spreadsheet schema.
 * This project owns sheet bootstrap for data ingestion and dashboard editing.
 */

const SHEET_READINGS = 'Readings';
const SHEET_LATEST = 'Latest';
const SHEET_DEVICES = 'Devices';
const SHEET_DEFINITIONS = 'Definitions';
const SHEET_CONFIG = 'Config';
const SHEET_LAYOUT = 'Layout';
const DEFAULT_SPREADSHEET_ID = '1HZwK5W8Yhd15sNypNO9Ydfx4G0NSehvEoTm8ZmKRygE';

const HEADERS = {
  Readings: ['ts', 'device_id', 'metric', 'value', 'raw_json'],
  Latest: ['device_id', 'metric', 'value', 'ts', 'latest_key'],
  Devices: ['device_id', 'name', 'note', 'enabled', 'last_seen', 'first_seen', 'area_id', 'location', 'type', 'sensor_type', 'power_source', 'report_interval_min'],
  Definitions: ['id', 'type', 'name', 'unit', 'source', 'expression', 'params', 'enabled'],
  Config: ['key', 'value'],
  Layout: ['item_id', 'bind_type', 'bind_ref', 'x_norm', 'y_norm', 'label', 'style', 'enabled']
};

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || DEFAULT_SPREADSHEET_ID;
  if (!id) {
    throw new Error('Script Property SPREADSHEET_ID is not set. See README.md.');
  }
  return SpreadsheetApp.openById(id);
}

function getSheet_(name) {
  const sh = getSpreadsheet_().getSheetByName(name);
  if (!sh) throw new Error('Sheet not found: ' + name + '. Run setup() first.');
  return sh;
}

/** Idempotent: create missing sheets, append missing headers, freeze row 1. Never destroys data. */
function ensureSheets_() {
  const ss = getSpreadsheet_();
  Object.keys(HEADERS).forEach(function (name) {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    ensureHeaders_(sh, HEADERS[name]);
    sh.setFrozenRows(1);
  });

  const def = ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1 && def.getLastRow() === 0) {
    ss.deleteSheet(def);
  }
}

function ensureHeaders_(sheet, requiredHeaders) {
  const lastCol = Math.max(1, sheet.getLastColumn());
  let row = sheet.getRange(1, 1, 1, Math.max(lastCol, requiredHeaders.length)).getValues()[0];
  const hasAnyHeader = row.some(function (cell) {
    return String(cell || '').trim() !== '';
  });

  if (!hasAnyHeader) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    return;
  }

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
