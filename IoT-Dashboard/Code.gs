/**
 * IoT-Dashboard Apps Script entry point.
 * Public read-only dashboard for the shared IoT spreadsheet.
 */

const BUILD_VERSION = 'v2026-06-12-offline-x2-1';

function doGet(e) {
  const tpl = HtmlService.createTemplateFromFile('index');
  tpl.BUILD_VERSION = BUILD_VERSION;
  return tpl.evaluate()
    .setTitle('SunDS シナプス')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}
