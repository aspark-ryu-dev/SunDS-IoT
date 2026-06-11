/**
 * IoT-Data Apps Script entry point.
 * Backend project: HTTP POST ingestion and internal management UI.
 */

const BUILD_VERSION = 'v2026-06-12-ai-key-mapping';

function doGet(e) {
  if (isLightweightCallback_(e)) {
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: true,
        endpoint: 'IoT-Data',
        method: 'GET',
        note: 'POST JSON to this Web App URL for ingestion.'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const tpl = HtmlService.createTemplateFromFile('index');
  tpl.BUILD_VERSION = BUILD_VERSION;
  return tpl.evaluate()
    .setTitle('IoT-Data 管理')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function isLightweightCallback_(e) {
  const path = String((e && e.pathInfo) || '').toLowerCase();
  const params = (e && e.parameter) || {};
  return path === 'callback' || params.nocache_id !== undefined || params.token !== undefined;
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

function includeBase64(name) {
  return Utilities.base64Encode(
    HtmlService.createHtmlOutputFromFile(name).getContent(),
    Utilities.Charset.UTF_8
  );
}
