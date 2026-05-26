/**
 * AUTO-MIGRATED from defs.gs — see README.
 * Edits here are fine; this file is hand-maintained from now on.
 */
function apiGenerateDevicePayload(model, deviceId) {
  const key = normalizeModelKey_(model);
  const payload = samplePayloadForModel_(key, deviceId || '70B3D57ED006A1B2');
  return {
    model: key,
    keys: DEVICE_EXAMPLE_KEYS[key] || [],
    payload: payload,
    json: JSON.stringify(payload, null, 2)
  };
}

function getDeviceExampleModels_() {
  return Object.keys(DEVICE_EXAMPLE_KEYS).sort().map(function (model) {
    return { model: model, keys: DEVICE_EXAMPLE_KEYS[model] };
  });
}

function samplePayloadForModel_(model, deviceId) {
  const keys = DEVICE_EXAMPLE_KEYS[model] || [];
  const payload = {
    devEUI: String(deviceId || '70B3D57ED006A1B2'),
    deviceName: model || 'sensor'
  };
  if (!keys.length) {
    payload.value = 1;
    return payload;
  }
  keys.forEach(function (path) {
    setSamplePath_(payload, path, sampleValueForMetric_(path));
  });
  return payload;
}

function setSamplePath_(root, path, value) {
  const parts = String(path || '').split('.');
  let cur = root;
  for (let i = 0; i < parts.length; i++) {
    const raw = parts[i];
    const isArray = raw.indexOf('[]') > -1;
    const key = raw.replace('[]', '');
    const last = i === parts.length - 1;
    if (isArray) {
      if (!cur[key]) cur[key] = [{}];
      if (last) {
        cur[key][0] = value;
      } else {
        if (!cur[key][0] || typeof cur[key][0] !== 'object') cur[key][0] = {};
        cur = cur[key][0];
      }
    } else if (last) {
      cur[key] = value;
    } else {
      if (!cur[key] || typeof cur[key] !== 'object') cur[key] = {};
      cur = cur[key];
    }
  }
}

function sampleValueForMetric_(path) {
  const metric = String(path || '').split('.').pop().replace('[]', '');
  const values = {
    battery: 92,
    humidity: 48.5,
    temperature: 24.6,
    timestamp: Math.floor(new Date().getTime() / 1000),
    co2: 650,
    tvoc: 120,
    pm2_5: 8,
    pm10: 12,
    pressure: 1012.4,
    distance: 1350,
    occupancy: 1,
    people_count_all: 3,
    device_sn: '6384E16179950009',
    device_name: 'People Counter',
    device_mac: '24:E1:24:FA:0C:6C',
    ip_address: '192.168.60.183',
    firmware_version: 'V_125.1.0.1',
    hardware_version: 'V1.0',
    running_time: 120,
    'wlan mac': '24:E1:24:54:23:0A',
    wlan_mac: '24:E1:24:54:23:0A',
    cpu_temperature: 50,
    cpu_usage: 62,
    pitch: 161.8,
    roll: 147.6,
    memory_usage: 52.97,
    total_memory_mb: 480.62,
    used_memory_mb: 254.56,
    storage_usage: 26.83,
    total_space_gb: 11.71,
    used_space_gb: 3.14,
    network_status: '1',
    cell_id: '340db80',
    lac: '5299',
    female_in: 8,
    female_out: 2,
    male_in: 8,
    male_out: 2,
    current_female: 0,
    current_male: 1,
    current_total: 2,
    line: 1,
    region: 1,
    line_name: 'Line1',
    line_uuid: '9a0440de-3188-4f6d-b886-bb20c97bd26b',
    region_name: 'Region1',
    region_uuid: 'bd1e6ce2-e113-4ce4-a9b6-0633f7083cac',
    children: false,
    staff: true,
    gender: 'male',
    people_id: 5,
    attention_time_ms: 96799,
    di_trigger_count: 1,
    di_trigger_event_name: 'test',
    isRetransmission: false,
    time_zone: 'UTC+8:00 China Standard Time (CT/CST)',
    voltage: 101.2,
    current: 0.42,
    power_consumption: 12.7,
    power_factor: 0.98,
    socket_status: 1,
    magnet_status: 0
  };
  return Object.prototype.hasOwnProperty.call(values, metric) ? values[metric] : 1;
}

function normalizeModelKey_(model) {
  return String(model || '').trim().toLowerCase();
}
