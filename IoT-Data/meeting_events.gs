/**
 * Persist only meeting-room occupancy transitions.
 * AVAILABLE is derived five minutes after PENDING_EMPTY, so no minute trigger
 * is required.
 */

const MEETING_PENDING_MINUTES = 5;

function recordMeetingEventForIngest_(deviceState, compiled, ts) {
  if (!deviceState || !deviceState.enabled || !deviceState.location) return;
  const people = currentPeopleFromCompiled_(compiled);
  if (people === null) return;
  const status = people > 0 ? 'OCCUPIED' : 'PENDING_EMPTY';
  const last = lastMeetingEventForLocation_(deviceState.location);
  if (last && last.status === status) return;

  const sh = getSheet_(SHEET_MEETING_EVENTS);
  const idx = headerIndex_(sh);
  const width = Math.max.apply(null, Object.keys(idx).map(function (name) { return idx[name]; })) + 1;
  const row = new Array(width).fill('');
  setByHeader_(row, idx, 'ts', ts);
  setByHeader_(row, idx, 'location', deviceState.location);
  setByHeader_(row, idx, 'status', status);
  setByHeader_(row, idx, 'count', people);
  setByHeader_(row, idx, 'device_id', deviceState.device_id);
  sh.getRange(sh.getLastRow() + 1, 1, 1, width).setValues([row]);
  CacheService.getScriptCache().put(meetingEventCacheKey_(deviceState.location), JSON.stringify({
    status: status,
    ts: ts.toISOString(),
    count: people,
    device_id: deviceState.device_id
  }), 21600);
}

function currentPeopleFromCompiled_(compiled) {
  let direct = null;
  let areaTotal = 0;
  let hasArea = false;
  (compiled || []).forEach(function (item) {
    if (!item.mapping || item.mapping.status !== 'active') return;
    const key = item.mapping.canonical_key;
    if (key === 'state.people.current.total') {
      const value = numberOrNull_(item.value);
      if (value !== null) direct = value;
      return;
    }
    if (/^state\.area\.\d+\.people\.total$/.test(key)) {
      const value = numberOrNull_(item.value);
      if (value !== null) {
        areaTotal += value;
        hasArea = true;
      }
    }
  });
  return direct !== null ? direct : hasArea ? areaTotal : null;
}

function lastMeetingEventForLocation_(location) {
  const cache = CacheService.getScriptCache();
  const cacheKey = meetingEventCacheKey_(location);
  const cached = cache.get(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch (err) {}
  }
  const sh = getSheet_(SHEET_MEETING_EVENTS);
  const values = sh.getDataRange().getValues();
  const idx = headerIndex_(sh);
  for (let r = values.length - 1; r >= 1; r--) {
    if (String(valueByHeader_(values[r], idx, 'location') || '').trim() !== location) continue;
    const found = {
      status: String(valueByHeader_(values[r], idx, 'status') || ''),
      ts: dateOut_(valueByHeader_(values[r], idx, 'ts')),
      count: Number(valueByHeader_(values[r], idx, 'count') || 0),
      device_id: String(valueByHeader_(values[r], idx, 'device_id') || '')
    };
    cache.put(cacheKey, JSON.stringify(found), 21600);
    return found;
  }
  return null;
}

function meetingEventCacheKey_(location) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(location || ''),
    Utilities.Charset.UTF_8
  );
  return 'iot_meeting_event_' + Utilities.base64EncodeWebSafe(digest).slice(0, 28);
}

function numberOrNull_(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const number = Number(value);
  return isFinite(number) ? number : null;
}
