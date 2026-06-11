/**
 * 会議室Now read model.
 * Rooms are derived from enabled devices sharing the same Devices.location.
 */

const MEETING_STATE_CACHE_KEY = 'iot_meeting_state_v1';
const MEETING_STATE_CACHE_SEC = 10;
const MEETING_PENDING_MINUTES = 5;
const MEETING_AREA_ID = '会議室';
const MEETING_READING_SCAN_CHUNK = 2000;
const MEETING_EVENT_HISTORY_DAYS = 8;

function apiGetMeetingRoomState(clientVersion) {
  const cache = CacheService.getScriptCache();
  let state = null;
  const cached = cache.get(MEETING_STATE_CACHE_KEY);
  if (cached) {
    try { state = JSON.parse(cached); } catch (err) {}
  }
  if (!state) {
    state = buildMeetingRoomState_();
    state.version = shortHash_(JSON.stringify(state));
    const json = JSON.stringify(state);
    if (json.length < 95000) cache.put(MEETING_STATE_CACHE_KEY, json, MEETING_STATE_CACHE_SEC);
  }
  if (clientVersion && clientVersion === state.version) {
    return { ok: true, unchanged: true, version: state.version };
  }
  return state;
}

function buildMeetingRoomState_() {
  const config = getConfigMap_();
  const offlineFallback = normalizeOfflineTimeout_(config.offline_timeout_min);
  const devices = readMeetingDevices_(offlineFallback);
  const canonical = readCanonicalLatestForMeeting_();
  const events = readMeetingEvents_();
  const peopleSeries = readTodayPeopleSeries_();
  const grouped = {};

  devices.forEach(function (device) {
    if (!device.location) return;
    if (!grouped[device.location]) grouped[device.location] = [];
    grouped[device.location].push(device);
  });

  const rooms = [];
  Object.keys(grouped).forEach(function (location) {
    const roomDevices = grouped[location];
    const peopleCandidates = [];
    roomDevices.forEach(function (device) {
      const people = currentPeopleForDevice_(canonical[device.device_id] || {});
      if (people) peopleCandidates.push({ device: device, metric: people });
    });
    if (!peopleCandidates.length) return;

    peopleCandidates.sort(function (a, b) {
      if (a.device.online !== b.device.online) return a.device.online ? -1 : 1;
      return metricTime_(b.metric) - metricTime_(a.metric);
    });
    const selected = peopleCandidates[0];
    const lastEvent = lastRoomEvent_(events[location] || []);
    const count = metricNumber_(selected.metric);
    const status = meetingStatus_(selected.device.online, count, lastEvent);
    rooms.push({
      location: location,
      status: status,
      count: count,
      people_device_id: selected.device.device_id,
      people_updated_at: selected.metric.ts,
      order: selected.device.dashboard_order,
      light: roomEnvironmentMetric_(roomDevices, canonical, ['state.environment.illumination']),
      temperature: roomEnvironmentMetric_(roomDevices, canonical, ['state.environment.temperature']),
      humidity: roomEnvironmentMetric_(roomDevices, canonical, ['state.environment.humidity']),
      co2: roomEnvironmentMetric_(roomDevices, canonical, ['state.environment.co2']),
      timeline: buildMeetingTimeline_(events[location] || []),
      series: peopleSeries[selected.device.device_id] || []
    });
  });

  rooms.sort(function (a, b) {
    return a.order - b.order || a.location.localeCompare(b.location, 'ja');
  });
  const summary = { total: rooms.length, occupied: 0, pending: 0, available: 0, offline: 0 };
  rooms.forEach(function (room) {
    if (room.status === 'OCCUPIED') summary.occupied++;
    else if (room.status === 'PENDING_EMPTY') summary.pending++;
    else if (room.status === 'AVAILABLE') summary.available++;
    else summary.offline++;
  });
  return {
    ok: true,
    build: BUILD_VERSION,
    generated_at: new Date().toISOString(),
    pending_minutes: MEETING_PENDING_MINUTES,
    timeline: { start_hour: 8, end_hour: 22 },
    summary: summary,
    rooms: rooms,
    heatmap: buildMeetingHeatmap_(events, rooms.map(function (room) { return room.location; }), new Date())
  };
}

/**
 * Occupied intervals ([startMs, endMs] pairs) replayed from the event log,
 * clipped to [startMs, endMs]. Same state machine as buildMeetingTimeline_
 * but over an arbitrary range.
 */
function occupiedIntervalsForRange_(events, startMs, endMs) {
  const out = [];
  let state = 'AVAILABLE';
  let occupiedStart = null;
  let pendingEnd = null;
  (events || []).forEach(function (event) {
    const time = toDate_(event.ts);
    if (!time || time.getTime() > endMs) return;
    const tms = time.getTime();
    if (pendingEnd !== null && pendingEnd <= tms) {
      if (occupiedStart !== null) out.push([occupiedStart, pendingEnd]);
      occupiedStart = null;
      pendingEnd = null;
      state = 'AVAILABLE';
    }
    if (event.status === 'OCCUPIED') {
      if (state === 'AVAILABLE') occupiedStart = tms;
      pendingEnd = null;
      state = 'OCCUPIED';
    } else if (event.status === 'PENDING_EMPTY' && state === 'OCCUPIED') {
      pendingEnd = tms + MEETING_PENDING_MINUTES * 60000;
      state = 'PENDING_EMPTY';
    }
  });
  if (occupiedStart !== null) {
    out.push([occupiedStart, pendingEnd !== null && pendingEnd < endMs ? pendingEnd : endMs]);
  }
  return out
    .map(function (iv) { return [Math.max(startMs, iv[0]), Math.min(endMs, iv[1])]; })
    .filter(function (iv) { return iv[1] > iv[0]; });
}

/**
 * Per-room hourly occupancy ratios (0..1) for the last `days` days,
 * business hours only. { days, start_hour, end_hour, rooms: { location: [ratio per hour slot] } }
 */
function buildMeetingHeatmap_(eventsByLocation, locations, now) {
  const days = 7;
  const startHour = 8;
  const endHour = 22;
  const slotsCount = endHour - startHour;
  const rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1), 0, 0, 0, 0).getTime();
  const rangeEnd = now.getTime();
  const rooms = {};
  locations.forEach(function (location) {
    const minutes = new Array(slotsCount).fill(0);
    occupiedIntervalsForRange_(eventsByLocation[location] || [], rangeStart, rangeEnd).forEach(function (iv) {
      let t = iv[0];
      while (t < iv[1]) {
        const d = new Date(t);
        const hourEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() + 1, 0, 0, 0).getTime();
        const segEnd = Math.min(hourEnd, iv[1]);
        const hour = d.getHours();
        if (hour >= startHour && hour < endHour) minutes[hour - startHour] += (segEnd - t) / 60000;
        t = segEnd;
      }
    });
    rooms[location] = minutes.map(function (min) {
      return Math.round(min / (days * 60) * 1000) / 1000;
    });
  });
  return { days: days, start_hour: startHour, end_hour: endHour, rooms: rooms };
}

function readMeetingDevices_(offlineFallback) {
  const sh = getSheet_(SHEET_DEVICES);
  const values = sh.getDataRange().getValues();
  const idx = headerIndex_(sh);
  const now = new Date();
  const out = [];
  for (let r = 1; r < values.length; r++) {
    const deviceId = String(valueByHeader_(values[r], idx, 'device_id') || '').trim();
    const enabled = parseBool_(valueByHeader_(values[r], idx, 'enabled'));
    if (!deviceId || !enabled) continue;
    if (String(valueByHeader_(values[r], idx, 'area_id') || '').trim() !== MEETING_AREA_ID) continue;
    const interval = normalizeReportIntervalMin_(valueByHeader_(values[r], idx, 'report_interval_min'), offlineFallback);
    const online = deviceOnlineStatus_(enabled, valueByHeader_(values[r], idx, 'last_seen'), now, interval);
    out.push({
      device_id: deviceId,
      location: String(valueByHeader_(values[r], idx, 'location') || '').trim(),
      online: online.online,
      dashboard_order: normalizeDashboardOrder_(valueByHeader_(values[r], idx, 'dashboard_order'))
    });
  }
  return out;
}

function readCanonicalLatestForMeeting_() {
  const sh = getSheet_(SHEET_CANONICAL_LATEST);
  const values = sh.getDataRange().getValues();
  const idx = headerIndex_(sh);
  const out = {};
  for (let r = 1; r < values.length; r++) {
    const deviceId = String(valueByHeader_(values[r], idx, 'device_id') || '').trim();
    const canonical = String(valueByHeader_(values[r], idx, 'canonical_key') || '').trim();
    if (!deviceId || !canonical || canonical.indexOf('state.') !== 0) continue;
    if (!out[deviceId]) out[deviceId] = {};
    out[deviceId][canonical] = {
      value: valueByHeader_(values[r], idx, 'value'),
      ts: dateOut_(valueByHeader_(values[r], idx, 'ts')),
      raw_key: String(valueByHeader_(values[r], idx, 'raw_key') || '')
    };
  }
  return out;
}

function currentPeopleForDevice_(metrics) {
  const direct = metrics['state.people.current.total'];
  if (hasMeetingMetricValue_(direct)) return direct;
  const areaKeys = Object.keys(metrics).filter(function (key) {
    return /^state\.area\.\d+\.people\.total$/.test(key) && hasMeetingMetricValue_(metrics[key]);
  });
  if (!areaKeys.length) return null;
  let total = 0;
  let latestTs = '';
  areaKeys.forEach(function (key) {
    total += Number(metrics[key].value) || 0;
    if (metricTime_(metrics[key]) >= metricTime_({ ts: latestTs })) latestTs = metrics[key].ts;
  });
  return { value: total, ts: latestTs, raw_key: areaKeys.join(',') };
}

function roomEnvironmentMetric_(devices, canonical, keys) {
  const candidates = [];
  devices.forEach(function (device) {
    if (!device.online) return;
    const metrics = canonical[device.device_id] || {};
    keys.forEach(function (key) {
      if (hasMeetingMetricValue_(metrics[key])) candidates.push(metrics[key]);
    });
  });
  candidates.sort(function (a, b) { return metricTime_(b) - metricTime_(a); });
  return candidates[0] || null;
}

function meetingStatus_(online, count, lastEvent) {
  if (!online) return 'OFFLINE';
  if (count > 0) return 'OCCUPIED';
  if (lastEvent && lastEvent.status === 'PENDING_EMPTY') {
    const time = toDate_(lastEvent.ts);
    if (time && Date.now() < time.getTime() + MEETING_PENDING_MINUTES * 60000) return 'PENDING_EMPTY';
  }
  return 'AVAILABLE';
}

function readMeetingEvents_() {
  const sh = getSheet_(SHEET_MEETING_EVENTS);
  const lastRow = sh.getLastRow();
  if (lastRow <= 1) return {};
  const idx = headerIndex_(sh);
  if (idx.ts === undefined) return {};
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - MEETING_EVENT_HISTORY_DAYS, 0, 0, 0, 0).getTime();
  const firstRow = findFirstReadingRowAtOrAfter_(sh, idx.ts + 1, lastRow, cutoff);
  if (!firstRow) return {};
  const values = sh.getRange(firstRow, 1, lastRow - firstRow + 1, sh.getLastColumn()).getValues();
  const out = {};
  for (let r = 0; r < values.length; r++) {
    const location = String(valueByHeader_(values[r], idx, 'location') || '').trim();
    const ts = dateOut_(valueByHeader_(values[r], idx, 'ts'));
    if (!location || !ts) continue;
    if (!out[location]) out[location] = [];
    out[location].push({
      ts: ts,
      status: String(valueByHeader_(values[r], idx, 'status') || ''),
      count: Number(valueByHeader_(values[r], idx, 'count') || 0),
      device_id: String(valueByHeader_(values[r], idx, 'device_id') || '')
    });
  }
  Object.keys(out).forEach(function (location) {
    out[location].sort(function (a, b) { return metricTime_(a) - metricTime_(b); });
  });
  return out;
}

function buildMeetingTimeline_(events) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 0, 0, 0);
  const limit = new Date(Math.min(end.getTime(), now.getTime()));
  let state = 'AVAILABLE';
  let occupiedStart = null;
  let pendingEnd = null;
  const records = [];

  (events || []).forEach(function (event) {
    const time = toDate_(event.ts);
    if (!time || time.getTime() > end.getTime()) return;
    if (pendingEnd && pendingEnd.getTime() <= time.getTime()) {
      if (occupiedStart) records.push({ start: occupiedStart, end: pendingEnd });
      occupiedStart = null;
      pendingEnd = null;
      state = 'AVAILABLE';
    }
    if (event.status === 'OCCUPIED') {
      if (state === 'AVAILABLE') occupiedStart = time;
      pendingEnd = null;
      state = 'OCCUPIED';
    } else if (event.status === 'PENDING_EMPTY' && state === 'OCCUPIED') {
      pendingEnd = new Date(time.getTime() + MEETING_PENDING_MINUTES * 60000);
      state = 'PENDING_EMPTY';
    }
  });
  if (occupiedStart) {
    records.push({ start: occupiedStart, end: pendingEnd && pendingEnd < limit ? pendingEnd : limit });
  }
  return records.map(function (record) {
    const clippedStart = Math.max(start.getTime(), toDate_(record.start).getTime());
    const clippedEnd = Math.min(end.getTime(), toDate_(record.end).getTime());
    if (clippedEnd <= clippedStart) return null;
    return {
      start: new Date(clippedStart).toISOString(),
      end: new Date(clippedEnd).toISOString()
    };
  }).filter(function (record) { return !!record; });
}

/**
 * Today's people-count history per device from the lightweight MeetingSamples
 * index. This avoids scanning historical metric rows.
 */
function readTodayPeopleSeries_() {
  const sh = getSheet_(SHEET_MEETING_SAMPLES);
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return {};
  const idx = headerIndex_(sh);
  if (idx.ts === undefined || idx.device_id === undefined || idx.count === undefined) return {};
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  const firstTodayRow = findFirstReadingRowAtOrAfter_(sh, idx.ts + 1, lastRow, dayStart);
  if (!firstTodayRow) return {};
  const values = sh.getRange(firstTodayRow, 1, lastRow - firstTodayRow + 1, sh.getLastColumn()).getValues();
  const buckets = {};
  values.forEach(function (row) {
    const deviceId = String(valueByHeader_(row, idx, 'device_id') || '').trim();
    const ts = toDate_(valueByHeader_(row, idx, 'ts'));
    const value = Number(valueByHeader_(row, idx, 'count'));
    if (!deviceId || !ts || !isFinite(value)) return;
    if (!buckets[deviceId]) buckets[deviceId] = {};
    buckets[deviceId][String(ts.getTime())] = value;
  });
  const series = {};
  Object.keys(buckets).forEach(function (deviceId) {
    const points = Object.keys(buckets[deviceId]).map(function (tsKey) {
      return [Number(tsKey), buckets[deviceId][tsKey]];
    });
    points.sort(function (a, b) { return a[0] - b[0]; });
    series[deviceId] = downsampleMeetingSeries_(points, 160);
  });
  return series;
}

function findFirstReadingRowAtOrAfter_(sheet, tsColumn, lastRow, thresholdMs) {
  let cursor = lastRow;
  let candidate = 0;
  while (cursor >= 2) {
    const startRow = Math.max(2, cursor - MEETING_READING_SCAN_CHUNK + 1);
    const values = sheet.getRange(startRow, tsColumn, cursor - startRow + 1, 1).getValues();
    let firstInChunk = -1;
    for (let i = 0; i < values.length; i++) {
      const date = toDate_(values[i][0]);
      if (date && date.getTime() >= thresholdMs) {
        firstInChunk = i;
        break;
      }
    }
    if (firstInChunk > 0) return startRow + firstInChunk;
    if (firstInChunk === 0) {
      candidate = startRow;
      cursor = startRow - 1;
      continue;
    }
    const newest = toDate_(values[values.length - 1][0]);
    if (newest && newest.getTime() < thresholdMs) return candidate;
    cursor = startRow - 1;
  }
  return candidate;
}

function downsampleMeetingSeries_(points, max) {
  if (points.length <= max) return points;
  const out = [];
  const step = (points.length - 1) / (max - 1);
  for (let i = 0; i < max; i++) out.push(points[Math.round(i * step)]);
  return out;
}

function lastRoomEvent_(events) {
  return events && events.length ? events[events.length - 1] : null;
}

function metricNumber_(metric) {
  if (!hasMeetingMetricValue_(metric)) return null;
  const value = Number(metric.value);
  return isFinite(value) ? value : null;
}

function metricTime_(metric) {
  const date = toDate_(metric && metric.ts);
  return date ? date.getTime() : 0;
}

function hasMeetingMetricValue_(metric) {
  return !!metric && metric.value !== null && metric.value !== undefined && String(metric.value).trim() !== '';
}
