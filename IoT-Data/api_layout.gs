/**
 * AUTO-MIGRATED from defs.gs — see README.
 * Edits here are fine; this file is hand-maintained from now on.
 */
/**
 * Upsert a layout item. Empty item_id triggers auto-generation ('item_'+timestamp).
 * @param {{item_id?:string, bind_type?:'device', bind_ref:string, x_norm:number, y_norm:number, label?:string, style_config?:{metrics?:string[], displayMode?:('card'|'popup')}, enabled?:boolean}} item
 * @returns {object} updated admin snapshot
 */
function apiSaveLayoutItem(item) {
  ensureIngestReady_();
  const clean = normalizeLayoutItem_(item);
  if (!clean.item_id) clean.item_id = 'item_' + new Date().getTime();
  if (!clean.bind_ref) throw new Error('bind_ref is required');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = getSheet_(SHEET_LAYOUT);
    const values = sh.getDataRange().getValues();
    for (let r = 1; r < values.length; r++) {
      if (String(values[r][0]) === clean.item_id) {
        sh.getRange(r + 1, 1, 1, 8).setValues([layoutItemToRow_(clean)]);
        return getAdminSnapshot_();
      }
    }
    sh.appendRow(layoutItemToRow_(clean));
    return getAdminSnapshot_();
  } finally {
    lock.releaseLock();
  }
}

/**

 * Replace the entire layout in one shot: upsert `items`, then delete `deletedIds`.

 * @param {Array<object>} items

 * @param {string[]} [deletedIds]

 * @returns {object} updated admin snapshot

 */

function apiSaveMapLayout(items, deletedIds) {
  ensureIngestReady_();
  items = Array.isArray(items) ? items : [];
  deletedIds = Array.isArray(deletedIds) ? deletedIds : [];

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = getSheet_(SHEET_LAYOUT);
    ensureHeaders_(sh, HEADERS.Layout);
    const values = sh.getDataRange().getValues();
    const deleteMap = {};
    deletedIds.forEach(function (id) {
      const key = String(id || '').trim();
      if (key) deleteMap[key] = true;
    });

    const cleanItems = items.map(function (item, i) {
      const clean = normalizeLayoutItem_(item);
      if (!clean.item_id) clean.item_id = 'item_' + new Date().getTime() + '_' + i;
      if (!clean.bind_ref) throw new Error('bind_ref is required');
      return clean;
    });
    const itemMap = {};
    cleanItems.forEach(function (item) { itemMap[item.item_id] = item; });

    for (let r = values.length - 1; r >= 1; r--) {
      const itemId = String(values[r][0] || '').trim();
      if (deleteMap[itemId] || itemMap[itemId]) {
        sh.deleteRow(r + 1);
      }
    }

    cleanItems.forEach(function (item) {
      sh.appendRow(layoutItemToRow_(item));
    });
    return getAdminSnapshot_();
  } finally {
    lock.releaseLock();
  }
}

/**

 * Delete a layout item by item_id.

 * @param {string} itemId

 * @returns {object} updated admin snapshot

 */

function apiDeleteLayoutItem(itemId) {
  ensureIngestReady_();
  const target = String(itemId || '').trim();
  if (!target) throw new Error('item_id is required');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = getSheet_(SHEET_LAYOUT);
    const values = sh.getDataRange().getValues();
    for (let r = values.length - 1; r >= 1; r--) {
      if (String(values[r][0]) === target) sh.deleteRow(r + 1);
    }
    return getAdminSnapshot_();
  } finally {
    lock.releaseLock();
  }
}

function readLayout_() {
  const sh = getSheet_(SHEET_LAYOUT);
  const values = sh.getDataRange().getValues();
  const out = [];
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][0]).trim() === '') continue;
    const style = String(values[r][6] || '');
    out.push({
      item_id: String(values[r][0]),
      bind_type: String(values[r][1] || 'device'),
      bind_ref: String(values[r][2] || ''),
      x_norm: clamp01_(Number(values[r][3])),
      y_norm: clamp01_(Number(values[r][4])),
      label: String(values[r][5] || ''),
      style: style,
      style_config: parseStyleConfig_(style),
      enabled: parseBool_(values[r][7])
    });
  }
  return out;
}

function normalizeLayoutItem_(item) {
  item = item || {};
  const styleConfig = normalizeStyleConfig_(item.style_config || item.style || {});
  return {
    item_id: String(item.item_id || '').trim(),
    bind_type: String(item.bind_type || 'device').trim() || 'device',
    bind_ref: String(item.bind_ref || '').trim(),
    x_norm: clamp01_(Number(item.x_norm)),
    y_norm: clamp01_(Number(item.y_norm)),
    label: String(item.label || '').trim(),
    style: JSON.stringify(styleConfig),
    enabled: parseBool_(item.enabled)
  };
}

function layoutItemToRow_(item) {
  return [item.item_id, item.bind_type, item.bind_ref, item.x_norm, item.y_norm, item.label, item.style, item.enabled];
}

function normalizeStyleConfig_(value) {
  let obj = value;
  if (typeof value === 'string') obj = parseStyleConfig_(value);
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) obj = {};
  const metrics = Array.isArray(obj.metrics) ? obj.metrics : [];
  const displayMode = String(obj.displayMode || obj.display_mode || 'card').trim().toLowerCase();
  const cardWidth = clampNumber_(Number(obj.cardWidth || obj.card_width), 100, 360, 0);
  const cardHeight = clampNumber_(Number(obj.cardHeight || obj.card_height), 54, 260, 0);
  return {
    metrics: metrics.map(function (m) { return String(m || '').trim(); }).filter(Boolean).slice(0, 12),
    displayMode: displayMode === 'popup' ? 'popup' : 'card',
    cardWidth: cardWidth,
    cardHeight: cardHeight
  };
}

function parseStyleConfig_(style) {
  try {
    const obj = JSON.parse(String(style || '{}'));
    return normalizeStyleConfig_(obj);
  } catch (err) {
    return { metrics: [], displayMode: 'card', cardWidth: 0, cardHeight: 0 };
  }
}
