/**
 * AUTO-MIGRATED from defs.gs — see README.
 * Edits here are fine; this file is hand-maintained from now on.
 */
const OFFLINE_INTERVAL_MULTIPLIER = 1.1;

function setByHeader_(row, idx, key, value) {
  if (idx[key] === undefined) return;
  row[idx[key]] = value;
}

function valueByHeader_(row, idx, key) {
  return idx[key] === undefined ? '' : row[idx[key]];
}

function clampNumber_(value, min, max, fallback) {
  if (!isFinite(value) || value <= 0) return fallback;
  return Math.max(min, Math.min(max, value));
}

function getBackgroundUrl_() {
  return getBackgroundUrlFromConfig_(getConfigMap_());
}

function getBackgroundUrlFromConfig_(config) {
  config = config || {};
  const directUrl = normalizeImageUrl_(config.background_image_url || '');
  if (directUrl) return directUrl;
  const fileId = String(config.background_image_file_id || '').trim();
  if (!fileId) return '';
  return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(fileId) + '&sz=w2400';
}

function normalizeRefreshInterval_(value) {
  const n = Number(value);
  return n === 300 || n === 600 ? n : 60;
}

function normalizeOfflineTimeout_(value) {
  const n = Number(value);
  return n === 5 || n === 30 || n === 60 ? n : 15;
}

function normalizeReportIntervalMin_(value) {
  const n = Number(value);
  if (!isFinite(n) || n <= 0) return '';
  return Math.round(n * 100) / 100;
}

function deviceOnlineStatus_(enabled, lastSeen, now, reportIntervalMin) {
  if (!enabled) return { online: false, reason: 'disabled' };
  const d = toDate_(lastSeen);
  if (!d) return { online: false, reason: 'never_seen' };
  const ageMs = now.getTime() - d.getTime();
  if (!isFinite(ageMs) || ageMs < 0) return { online: true, reason: '' };
  if (ageMs > reportIntervalMin * OFFLINE_INTERVAL_MULTIPLIER * 60 * 1000) {
    return { online: false, reason: 'stale' };
  }
  return { online: true, reason: '' };
}

function toDate_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function normalizeImageUrl_(url) {
  let out = String(url || '').trim();
  if (!out) return '';
  if (out.indexOf('https://www.dropbox.com/') === 0) {
    out = out.replace('https://www.dropbox.com/', 'https://dl.dropboxusercontent.com/');
  }
  return out;
}

function dateOut_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
    return v.toISOString();
  }
  return String(v || '');
}

function clamp01_(n) {
  if (!isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}
