/**
 * IoT-Data shared spreadsheet schema.
 * This project owns sheet bootstrap for data ingestion and dashboard editing.
 */

const SHEET_READINGS = 'Readings';
const SHEET_LATEST = 'Latest';
const SHEET_DEVICES = 'Devices';
const SHEET_DEFINITIONS = 'Definitions';
const SHEET_KEY_CATALOG = 'KeyCatalog';
const SHEET_METRIC_MAPPINGS = 'MetricMappings';
const SHEET_CANONICAL_LATEST = 'CanonicalLatest';
const SHEET_MEETING_EVENTS = 'MeetingEvents';
const SHEET_CONFIG = 'Config';
const SHEET_LAYOUT = 'Layout';
const DEFAULT_SPREADSHEET_ID = '1HZwK5W8Yhd15sNypNO9Ydfx4G0NSehvEoTm8ZmKRygE';
const MAX_SCHEMA_HEADER_SCAN_COLUMNS = 256;
let SPREADSHEET_MEMO = null;

const HEADERS = {
  Readings: ['ts', 'device_id', 'metric', 'value', 'raw_json', 'event', 'report_type', 'canonical_key'],
  Latest: ['device_id', 'metric', 'value', 'ts', 'latest_key'],
  Devices: ['device_id', 'name', 'note', 'enabled', 'last_seen', 'first_seen', 'area_id', 'location', 'type', 'sensor_type', 'power_source', 'report_interval_min', 'dashboard_order', 'dashboard_card_type', 'dashboard_metrics'],
  Definitions: ['id', 'type', 'name', 'unit', 'source', 'expression', 'params', 'enabled'],
  KeyCatalog: ['key', 'label_ja', 'data_type', 'unit', 'source', 'models', 'note', 'enabled', 'canonical_key', 'scope', 'mapping_status'],
  MetricMappings: ['mapping_id', 'device_model', 'event', 'report_type', 'raw_key', 'canonical_key', 'label_ja', 'data_type', 'unit', 'scope', 'sample_value', 'confidence', 'status', 'source', 'reason', 'updated_at'],
  CanonicalLatest: ['device_id', 'canonical_key', 'value', 'ts', 'raw_key', 'event', 'report_type', 'mapping_id', 'latest_key'],
  MeetingEvents: ['ts', 'location', 'status', 'count', 'device_id'],
  Config: ['key', 'value'],
  Layout: ['item_id', 'bind_type', 'bind_ref', 'x_norm', 'y_norm', 'label', 'style', 'enabled']
};

function getSpreadsheet_() {
  if (SPREADSHEET_MEMO) return SPREADSHEET_MEMO;
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || DEFAULT_SPREADSHEET_ID;
  if (!id) {
    throw new Error('Script Property SPREADSHEET_ID is not set. See README.md.');
  }
  SPREADSHEET_MEMO = SpreadsheetApp.openById(id);
  return SPREADSHEET_MEMO;
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
    if (sh.getFrozenRows() !== 1) sh.setFrozenRows(1);
  });

  const def = ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1 && def.getLastRow() === 0) {
    ss.deleteSheet(def);
  }
}

function ensureHeaders_(sheet, requiredHeaders) {
  const lastCol = Math.max(1, sheet.getLastColumn());
  const scanWidth = Math.max(
    requiredHeaders.length,
    Math.min(lastCol, MAX_SCHEMA_HEADER_SCAN_COLUMNS)
  );
  let row = sheet.getRange(1, 1, 1, scanWidth).getValues()[0];
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
