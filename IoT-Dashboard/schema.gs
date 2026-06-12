/**
 * IoT-Dashboard - shared spreadsheet schema accessors.
 * This project is public read-only; IoT-Data owns sheet editing.
 */

const SHEET_DEVICES = 'Devices';
const SHEET_LATEST = 'Latest';
const SHEET_DEFINITIONS = 'Definitions';
const SHEET_KEY_CATALOG = 'KeyCatalog';
const SHEET_METRIC_MAPPINGS = 'MetricMappings';
const SHEET_CANONICAL_LATEST = 'CanonicalLatest';
const SHEET_MEETING_EVENTS = 'MeetingEvents';
const SHEET_MEETING_SAMPLES = 'MeetingSamples';
const SHEET_CONFIG = 'Config';
const SHEET_LAYOUT = 'Layout';
const DEFAULT_SPREADSHEET_ID = '1HZwK5W8Yhd15sNypNO9Ydfx4G0NSehvEoTm8ZmKRygE';
let SPREADSHEET_MEMO = null;

const LAYOUT_HEADERS = ['item_id', 'bind_type', 'bind_ref', 'x_norm', 'y_norm', 'label', 'style', 'enabled'];
const LATEST_HEADERS = ['device_id', 'metric', 'value', 'ts', 'latest_key', 'event', 'report_type', 'device_model'];
const CANONICAL_LATEST_HEADERS = ['device_id', 'canonical_key', 'value', 'ts', 'raw_key', 'event', 'report_type', 'mapping_id', 'latest_key'];
const MEETING_EVENT_HEADERS = ['ts', 'location', 'status', 'count', 'device_id'];
const MEETING_SAMPLE_HEADERS = ['ts', 'device_id', 'location', 'count', 'sample_key'];

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
  if (!sh) {
    throw new Error('Sheet not found: ' + name +
      '. Run IoT-Data setup() (and this project\'s setup()) first.');
  }
  return sh;
}

/** Read-only setup check. IoT-Data owns all shared Spreadsheet writes. */
function ensureSheets_() {
  const ss = getSpreadsheet_();
  [
    SHEET_DEVICES,
    SHEET_LATEST,
    SHEET_DEFINITIONS,
    SHEET_KEY_CATALOG,
    SHEET_METRIC_MAPPINGS,
    SHEET_CONFIG,
    SHEET_LAYOUT,
    SHEET_MEETING_SAMPLES
  ].forEach(function (name) {
    if (!ss.getSheetByName(name)) {
      throw new Error('Sheet not found: ' + name + '. Run IoT-Data setup() first.');
    }
  });
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
