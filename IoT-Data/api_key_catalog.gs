/**
 * AUTO-MIGRATED from defs.gs — see README.
 * Edits here are fine; this file is hand-maintained from now on.
 */
const METRIC_LABEL_OVERRIDES = {
  battery: 'バッテリー',
  temperature: '温度',
  humidity: '湿度',
  co2: 'CO2',
  tvoc: 'TVOC',
  pm2_5: 'PM2.5',
  pm10: 'PM10',
  hcho: 'ホルムアルデヒド',
  h2s: '硫化水素',
  nh3: 'アンモニア',
  pressure: '気圧',
  pressure_2: '気圧 2',
  distance: '距離',
  depth: '深さ',
  moisture: '土壌水分',
  illumination: '照度',
  light_level: '照度レベル',
  ec: '電気伝導度',
  occupancy: '在席',
  people_count_all: '総人数',
  people_count_max: '最大人数',
  people_in: '入場人数',
  people_out: '退場人数',
  periodic_counter_in: '周期入場カウント',
  periodic_counter_out: '周期退場カウント',
  total_counter_in: '累計入場カウント',
  total_counter_out: '累計退場カウント',
  total_in: '累計入場',
  total_out: '累計退場',
  period_in: '期間入場',
  period_out: '期間退場',
  voltage: '電圧',
  current: '電流',
  total_current: '累計電流',
  active_power: '有効電力',
  power_consumption: '電力量',
  power_factor: '力率',
  socket_status: 'ソケット状態',
  magnet_status: 'マグネット状態',
  tamper_status: 'タンパー状態',
  leakage_status: '漏水状態',
  liquid: '液体検知',
  liquid_alarm: '液体アラーム',
  water: '水量',
  water_alarm: '水量アラーム',
  water_conv: '換算水量',
  pluse_conv: '換算パルス',
  pulse: 'パルス',
  position: '位置',
  latitude: '緯度',
  longitude: '経度',
  wifi_scan_result: 'Wi-Fi スキャン結果',
  wind_direction: '風向',
  wind_speed: '風速',
  rainfall_total: '累計雨量',
  rainfall_counter: '雨量カウント',
  rainfall_alarm: '雨量アラーム',
  pressure_alarm: '気圧アラーム',
  wind_speed_alarm: '風速アラーム',
  temperature_alarm: '温度アラーム',
  temperature_abnormal: '温度異常',
  distance_alarm: '距離アラーム',
  calibration_result: '校正結果',
  calibration_status: '校正状態',
  firmware_version: 'ファームウェアバージョン',
  firmwareVersion: 'ファームウェアバージョン',
  hardware_version: 'ハードウェアバージョン',
  hardwareVersion: 'ハードウェアバージョン',
  protocol_version: 'プロトコルバージョン',
  protocolVersion: 'プロトコルバージョン',
  ipso_version: 'IPSO バージョン',
  tsl_version: 'TSL バージョン',
  lorawan_class: 'LoRaWAN クラス',
  sn: 'シリアル番号',
  imei: 'IMEI',
  imsi: 'IMSI',
  iccid: 'ICCID',
  csq: '信号品質',
  pir: 'PIR',
  infrared: '赤外線',
  infrared_and_visible: '赤外線と可視光',
  activity: '活動量',
  daylight: '昼光',
  press: '押下',
  remaining: '残量',
  report_status: 'レポート状態',
  report_attribute: 'レポート属性',
  reporting_interval: 'レポート間隔',
  reboot: '再起動',
  led_mode: 'LED モード',
  motion_status: 'モーション状態',
  geofence_status: 'ジオフェンス状態',
  device_info_device_sn: 'シリアル番号',
  'device_info.device_sn': 'シリアル番号',
  current_total: '現在人数',
  max_counted: '最大人数',
  Max_counted: '最大人数',
  total_mapped_regions: 'マップ済みリージョン数',
  regions_name: 'リージョン名',
  numbering_regions: 'リージョン番号',
  current_counted: '現在人数',
  max_dwell_time: '最大滞在時間',
  avg_dwell_time: '平均滞在時間',
  dwell_time_data_region: '滞在リージョン',
  'dwell_time_data[].region': '滞在リージョン',
  dwell_time_data_max_dwell_time: '最大滞在時間',
  'dwell_time_data[].max_dwell_time': '最大滞在時間',
  dwell_time_data_avg_dwell_time: '平均滞在時間',
  'dwell_time_data[].avg_dwell_time': '平均滞在時間',
  dwell_time_data_people_id: '人物ID',
  'dwell_time_data[].people_id': '人物ID',
  dwell_time_data_duration: '滞在時間',
  'dwell_time_data[].duration': '滞在時間',
  in_counted: '入場人数',
  out_counted: '退場人数',
  capacity_counted: '在室増減',
  total_data_in_cumulative_counted: '累計入場人数',
  'total_data.in_cumulative_counted': '累計入場人数',
  total_data_out_cumulative_counted: '累計退場人数',
  'total_data.out_cumulative_counted': '累計退場人数',
  total_data_capacity_cumulative_counted: '累計在室増減',
  'total_data.capacity_cumulative_counted': '累計在室増減',
  line_trigger_data_in: '入場トリガー',
  'line_trigger_data.in': '入場トリガー',
  line_trigger_data_out: '退場トリガー',
  'line_trigger_data.out': '退場トリガー',
  flow_data_A_A: 'A-A 人流',
  'flow_data.A-A': 'A-A 人流',
  flow_data_A_B: 'A-B 人流',
  'flow_data.A-B': 'A-B 人流',
  flow_data_A_C: 'A-C 人流',
  'flow_data.A-C': 'A-C 人流',
  flow_data_A_D: 'A-D 人流',
  'flow_data.A-D': 'A-D 人流',
  flow_data_B_A: 'B-A 人流',
  'flow_data.B-A': 'B-A 人流',
  flow_data_B_B: 'B-B 人流',
  'flow_data.B-B': 'B-B 人流',
  flow_data_B_C: 'B-C 人流',
  'flow_data.B-C': 'B-C 人流',
  flow_data_B_D: 'B-D 人流',
  'flow_data.B-D': 'B-D 人流',
  flow_data_C_A: 'C-A 人流',
  'flow_data.C-A': 'C-A 人流',
  flow_data_C_B: 'C-B 人流',
  'flow_data.C-B': 'C-B 人流',
  flow_data_C_C: 'C-C 人流',
  'flow_data.C-C': 'C-C 人流',
  flow_data_C_D: 'C-D 人流',
  'flow_data.C-D': 'C-D 人流',
  flow_data_D_A: 'D-A 人流',
  'flow_data.D-A': 'D-A 人流',
  flow_data_D_B: 'D-B 人流',
  'flow_data.D-B': 'D-B 人流',
  flow_data_D_C: 'D-C 人流',
  'flow_data.D-C': 'D-C 人流',
  flow_data_D_D: 'D-D 人流',
  'flow_data.D-D': 'D-D 人流',
  running_time: '稼働時間',
  cpu_temperature: 'CPU 温度',
  cpu_usage: 'CPU 使用率',
  pitch: 'ピッチ角',
  roll: 'ロール角',
  memory_usage: 'メモリ使用率',
  total_memory_mb: '総メモリ',
  used_memory_mb: '使用メモリ',
  storage_usage: 'ストレージ使用率',
  total_space_gb: '総ストレージ',
  used_space_gb: '使用ストレージ',
  female_in: '女性入場人数',
  female_out: '女性退場人数',
  male_in: '男性入場人数',
  male_out: '男性退場人数',
  current_female: '現在女性人数',
  current_male: '現在男性人数',
  gender: '性別',
  staff: 'スタッフ判定',
  children: '子供判定',
  people_id: '人物ID',
  attention_time_ms: '注視時間',
  di_trigger_count: 'DI トリガー回数',
  line: 'ライン番号',
  region: 'リージョン番号',
  'line_trigger_data[].children.in': '子供 入場人数',
  'line_trigger_data[].children.out': '子供 退場人数',
  'line_trigger_data[].staff.in': 'スタッフ 入場人数',
  'line_trigger_data[].staff.out': 'スタッフ 退場人数',
  'line_trigger_data[].total.in': '総入場人数',
  'line_trigger_data[].total.out': '総退場人数',
  'region_trigger_data.region_count_data[].total.current_total': '現在総人数',
  'region_trigger_data.dwell_time_data[].duration': '滞在時間',
  'attention_region_trigger_data.region_attention_time_data[].attention_time_ms': '注視時間'
};

const METRIC_WORDS_JA = {
  a: 'A', b: 'B', c: 'C', d: 'D',
  adc: 'ADC', adv: 'ADV', avg: '平均', max: '最大', min: '最小',
  alarm: 'アラーム', abnormal: '異常', action: 'アクション', active: '有効',
  agent: 'エージェント', all: '総数', angle: '角度', array: '配列',
  attribute: '属性', battery: 'バッテリー', bias: '補正', button: 'ボタン',
  calibration: '校正', change: '変化', chn: 'チャンネル', class: 'クラス',
  clear: 'クリア', cmd: 'コマンド', command: 'コマンド', config: '設定',
  consumption: '消費量', control: '制御', controller: 'コントローラー',
  conv: '換算', count: 'カウント', counter: 'カウンター', current: '電流',
  daylight: '昼光', d2d: 'D2D', depth: '深さ', device: 'デバイス',
  direction: '方向', distance: '距離', dwell: '滞在', dst: 'サマータイム',
  ec: '電気伝導度', enable: '有効', end: '終了', event: 'イベント',
  exception: '例外', execut: '実行', factor: '率', firmware: 'ファームウェア',
  flag: 'フラグ', friday: '金曜日', geofence: 'ジオフェンス', gpio: 'GPIO',
  group: 'グループ', hardware: 'ハードウェア', highcurrent: '大電流',
  hour: '時刻', humidity: '湿度', input: '入力', interval: '間隔',
  leakage: '漏水', length: '長さ', level: 'レベル', line: 'ライン',
  lock: 'ロック', lora: 'LoRa', lorawan: 'LoRaWAN', mac: 'MAC',
  magnet: 'マグネット', min: '分', mode: 'モード', modbus: 'Modbus',
  monday: '月曜日', month: '月', motion: 'モーション', mutation: '変動',
  number: '番号', occupancy: '在席', open: '開度', opening: '開度',
  output: '出力', overcurrent: '過電流', period: '期間', periodic: '周期',
  pluse: 'パルス', power: '電力', press: '押下', pressure: '気圧',
  protection: '保護', protocol: 'プロトコル', pulse: 'パルス',
  qrcode: 'QR コード', rainfall: '雨量', read: '読み取り', reboot: '再起動',
  region: 'エリア', release: '解除', remaining: '残量', report: 'レポート',
  reset: 'リセット', rssi: 'RSSI', saturday: '土曜日', saving: '節約',
  scan: 'スキャン', schedule: 'スケジュール', sdi12: 'SDI-12',
  sensor: 'センサー', settings: '設定', socket: 'ソケット', start: '開始',
  status: '状態', sunday: '日曜日', switch: 'スイッチ', tamper: 'タンパー',
  temperature: '温度', template: 'テンプレート', text: 'テキスト',
  threshold: 'しきい値', thursday: '木曜日', timestamp: 'タイムスタンプ',
  total: '累計', tuesday: '火曜日', type: '種別', uplink: 'アップリンク',
  use: '使用', valve: 'バルブ', version: 'バージョン', visible: '可視光',
  voltage: '電圧', water: '水量', wednesday: '水曜日', week: '週',
  wifi: 'Wi-Fi', wind: '風', x: 'X', y: 'Y', z: 'Z'
};

const METRIC_UNITS = {
  battery: '%',
  temperature: '°C',
  humidity: '%',
  co2: 'ppm',
  tvoc: 'ppb',
  pm2_5: 'ug/m3',
  pm10: 'ug/m3',
  hcho: 'mg/m3',
  h2s: 'ppm',
  nh3: 'ppm',
  pressure: 'hPa',
  distance: 'mm',
  depth: 'mm',
  illumination: 'lx',
  light_level: 'lx',
  ec: 'uS/cm',
  moisture: '%',
  people_count_all: '人',
  people_count_max: '人',
  people_in: '人',
  people_out: '人',
  voltage: 'V',
  current: 'A',
  total_current: 'Ah',
  active_power: 'W',
  power_consumption: 'kWh',
  wind_speed: 'm/s',
  wind_direction: 'deg',
  rainfall_total: 'mm',
  rainfall_counter: 'mm',
  latitude: 'deg',
  longitude: 'deg',
  angle_x: 'deg',
  angle_y: 'deg',
  angle_z: 'deg',
  current_total: '人',
  max_counted: '人',
  Max_counted: '人',
  current_counted: '人',
  in_counted: '人',
  out_counted: '人',
  capacity_counted: '人',
  total_data_in_cumulative_counted: '人',
  total_data_out_cumulative_counted: '人',
  total_data_capacity_cumulative_counted: '人',
  dwell_time_data_max_dwell_time: 's',
  'dwell_time_data[].max_dwell_time': 's',
  max_dwell_time: 's',
  dwell_time_data_avg_dwell_time: 's',
  'dwell_time_data[].avg_dwell_time': 's',
  avg_dwell_time: 's',
  dwell_time_data_duration: 'ms',
  'dwell_time_data[].duration': 'ms',
  duration: 'ms',
  line_trigger_data_in: '人',
  'line_trigger_data.in': '人',
  line_trigger_data_out: '人',
  'line_trigger_data.out': '人',
  flow_data_A_A: '人',
  'flow_data.A-A': '人',
  flow_data_A_B: '人',
  'flow_data.A-B': '人',
  flow_data_A_C: '人',
  'flow_data.A-C': '人',
  flow_data_A_D: '人',
  'flow_data.A-D': '人',
  flow_data_B_A: '人',
  'flow_data.B-A': '人',
  flow_data_B_B: '人',
  'flow_data.B-B': '人',
  flow_data_B_C: '人',
  'flow_data.B-C': '人',
  flow_data_B_D: '人',
  'flow_data.B-D': '人',
  flow_data_C_A: '人',
  'flow_data.C-A': '人',
  flow_data_C_B: '人',
  'flow_data.C-B': '人',
  flow_data_C_C: '人',
  'flow_data.C-C': '人',
  flow_data_C_D: '人',
  'flow_data.C-D': '人',
  flow_data_D_A: '人',
  'flow_data.D-A': '人',
  flow_data_D_B: '人',
  'flow_data.D-B': '人',
  flow_data_D_C: '人',
  'flow_data.D-C': '人',
  flow_data_D_D: '人',
  'flow_data.D-D': '人',
  running_time: 's',
  cpu_temperature: '°C',
  cpu_usage: '%',
  memory_usage: '%',
  total_memory_mb: 'MB',
  used_memory_mb: 'MB',
  storage_usage: '%',
  total_space_gb: 'GB',
  used_space_gb: 'GB',
  female_in: '人',
  female_out: '人',
  male_in: '人',
  male_out: '人',
  current_female: '人',
  current_male: '人',
  current_total: '人',
  attention_time_ms: 'ms',
  di_trigger_count: '回'
};

const METRIC_META = buildKnownMetricMeta_();

function apiSeedKeyCatalog() {
  ensureIngestReady_();
  seedKeyCatalog_();
  return getAdminSnapshot_();
}

function apiSaveKeyCatalogVisibility(key, enabled) {
  ensureIngestReady_();
  const target = String(key || '').trim();
  if (!target) throw new Error('key is required');
  if (isSystemMetadataKey_(target)) throw new Error('system metadata key cannot be displayed');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = getSheet_(SHEET_KEY_CATALOG);
    ensureHeaders_(sh, HEADERS.KeyCatalog);
    const idx = headerIndex_(sh);
    const values = sh.getDataRange().getValues();
    for (let r = 1; r < values.length; r++) {
      if (String(valueByHeader_(values[r], idx, 'key') || '').trim() === target) {
        if (idx.enabled !== undefined) sh.getRange(r + 1, idx.enabled + 1).setValue(parseBool_(enabled));
        return getAdminSnapshot_();
      }
    }
    const meta = keyCatalogMetaForKey_(target);
    meta.source = meta.source || 'manual';
    meta.enabled = parseBool_(enabled);
    sh.appendRow(keyCatalogToRow_(meta, idx));
    return getAdminSnapshot_();
  } finally {
    lock.releaseLock();
  }
}

function seedKeyCatalog_() {
  const sh = getSheet_(SHEET_KEY_CATALOG);
  ensureHeaders_(sh, HEADERS.KeyCatalog);
  const idx = headerIndex_(sh);
  const values = sh.getDataRange().getValues();
  const existing = {};
  for (let r = 1; r < values.length; r++) {
    const key = String(valueByHeader_(values[r], idx, 'key') || '').trim();
    if (key) existing[key] = r + 1;
    if (key && isSystemMetadataKey_(key) && idx.enabled !== undefined) {
      sh.getRange(r + 1, idx.enabled + 1).setValue(false);
    }
  }

  const rows = [];
  knownMetricKeys_().forEach(function (key) {
    const meta = keyCatalogMetaForKey_(key);
    if (existing[key]) {
      fillKeyCatalogBlanks_(sh, existing[key], idx, meta);
    } else {
      rows.push(keyCatalogToRow_(meta, idx));
    }
  });

  if (rows.length) {
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, sh.getLastColumn()).setValues(rows);
  }
  return { added: rows.length };
}

function fillKeyCatalogBlanks_(sheet, rowNumber, idx, meta) {
  const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
  ['label_ja', 'data_type', 'unit', 'source', 'models', 'enabled'].forEach(function (key) {
    if (idx[key] === undefined) return;
    if (String(row[idx[key]] || '').trim() !== '') return;
    sheet.getRange(rowNumber, idx[key] + 1).setValue(meta[key]);
  });
}

function keyCatalogToRow_(meta, idx) {
  const width = Math.max.apply(null, Object.keys(idx).map(function (name) { return idx[name]; })) + 1;
  const row = new Array(width).fill('');
  setByHeader_(row, idx, 'key', meta.key);
  setByHeader_(row, idx, 'label_ja', meta.label_ja);
  setByHeader_(row, idx, 'data_type', meta.data_type);
  setByHeader_(row, idx, 'unit', meta.unit);
  setByHeader_(row, idx, 'source', meta.source);
  setByHeader_(row, idx, 'models', meta.models);
  setByHeader_(row, idx, 'note', meta.note);
  setByHeader_(row, idx, 'enabled', meta.enabled);
  return row;
}

function keyCatalogMetaForKey_(key) {
  const meta = metricMetaForKey_(key);
  return {
    key: key,
    label_ja: meta.label,
    data_type: inferKeyDataType_(key),
    unit: meta.unit,
    source: 'device-examples',
    models: modelsForMetricKey_(key).join(','),
    note: '',
    enabled: true
  };
}

function modelsForMetricKey_(key) {
  const models = [];
  Object.keys(DEVICE_EXAMPLE_KEYS).forEach(function (model) {
    if ((DEVICE_EXAMPLE_KEYS[model] || []).indexOf(key) > -1) models.push(model);
  });
  return models.sort();
}

function inferKeyDataType_(key) {
  const normalized = String(key || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
  if (/(^|_)(sn|mac|imei|imsi|iccid|version|qrcode|text|class|type|id|status|gender)$/.test(normalized)) return 'string';
  if (/(^|_)(enable|enabled|alarm|lock|open|occupied|occupancy|pir|switch|leakage|magnet|tamper|children|staff|isretransmission)($|_)/.test(normalized)) return 'boolean';
  return 'number';
}

function buildKnownMetricMeta_() {
  const out = {};
  knownMetricKeys_().forEach(function (key) {
    out[key] = metricMetaForKey_(key);
  });
  return out;
}

function knownMetricKeys_() {
  const found = {};
  Object.keys(DEVICE_EXAMPLE_KEYS).forEach(function (model) {
    (DEVICE_EXAMPLE_KEYS[model] || []).forEach(function (key) {
      if (isSystemMetadataKey_(key)) return;
      found[key] = true;
    });
  });
  return Object.keys(found).sort();
}

function metricMetaForKey_(key) {
  const vs125 = vs125MetricMetaForKey_(key);
  if (vs125) return vs125;
  return {
    label: metricLabelJa_(key),
    unit: metricUnitForKey_(key)
  };
}

function vs125MetricMetaForKey_(key) {
  const raw = normalizeMetricPathForPattern_(key);
  let m = raw.match(/^line_trigger_data(?:_(\d+))?_(children|group|staff|total)_(female_in|female_out|male_in|male_out|in|out)$/);
  if (m) {
    return { label: prefixNumberedLabel_('ライン', m[1], vs125GroupLabel_(m[2]) + ' ' + vs125LineCountLabel_(m[3])), unit: '人' };
  }
  m = raw.match(/^region_trigger_data_region_count_data(?:_(\d+))?_(total|children|staff)_(current_female|current_male|current_total)$/);
  if (m) {
    return { label: prefixNumberedLabel_('リージョン', m[1], vs125GroupLabel_(m[2]) + ' ' + vs125RegionCountLabel_(m[3])), unit: '人' };
  }
  m = raw.match(/^region_trigger_data_dwell_time_data(?:_(\d+))?_(children|duration|people_id|region|gender|staff)$/);
  if (m) {
    return { label: prefixNumberedLabel_('滞在', m[1], vs125DwellLabel_(m[2])), unit: vs125UnitForLeaf_(m[2]) };
  }
  m = raw.match(/^attention_region_trigger_data_region_attention_time_data(?:_(\d+))?_(region|children|attention_time_ms|people_id|gender|staff)$/);
  if (m) {
    return { label: prefixNumberedLabel_('注視', m[1], vs125DwellLabel_(m[2])), unit: vs125UnitForLeaf_(m[2]) };
  }
  const direct = {
    device_info_running_time: { label: '稼働時間', unit: 's' },
    device_info_cpu_cpu_temperature: { label: 'CPU温度', unit: '°C' },
    device_info_cpu_cpu_usage: { label: 'CPU使用率', unit: '%' },
    device_info_device_tilt_pitch_roll_pitch: { label: '傾き Pitch', unit: '°' },
    device_info_device_tilt_pitch_roll_roll: { label: '傾き Roll', unit: '°' },
    device_info_ram_memory_usage: { label: 'メモリ使用率', unit: '%' },
    device_info_ram_total_memory_mb: { label: 'メモリ総量', unit: 'MB' },
    device_info_ram_used_memory_mb: { label: 'メモリ使用量', unit: 'MB' },
    device_info_storage_storage_usage: { label: 'ストレージ使用率', unit: '%' },
    device_info_storage_total_space_gb: { label: 'ストレージ総量', unit: 'GB' },
    device_info_storage_used_space_gb: { label: 'ストレージ使用量', unit: 'GB' },
    di_trigger_data_di_trigger_count: { label: 'DIトリガー回数', unit: '回' }
  };
  return direct[raw] || null;
}

function normalizeMetricPathForPattern_(key) {
  return String(key || '').trim().replace(/\[\]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
}

function prefixNumberedLabel_(prefix, index, label) {
  if (index === undefined || index === '') return label;
  return prefix + (Number(index) + 1) + ' ' + label;
}

function vs125GroupLabel_(key) {
  return { children: '子供', group: 'グループ', staff: 'スタッフ', total: '総計' }[key] || key;
}

function vs125LineCountLabel_(key) {
  return {
    female_in: '女性入場人数',
    female_out: '女性退場人数',
    male_in: '男性入場人数',
    male_out: '男性退場人数',
    in: '入場人数',
    out: '退場人数'
  }[key] || key;
}

function vs125RegionCountLabel_(key) {
  return {
    current_female: '現在女性人数',
    current_male: '現在男性人数',
    current_total: '現在総人数'
  }[key] || key;
}

function vs125DwellLabel_(key) {
  return {
    children: '子供判定',
    duration: '滞在時間',
    attention_time_ms: '注視時間',
    people_id: '人物ID',
    region: 'リージョン番号',
    gender: '性別',
    staff: 'スタッフ判定'
  }[key] || key;
}

function vs125UnitForLeaf_(key) {
  if (key === 'duration' || key === 'attention_time_ms') return 'ms';
  return '';
}

function metricLabelJa_(key) {
  key = String(key || '').trim();
  if (METRIC_LABEL_OVERRIDES[key]) return METRIC_LABEL_OVERRIDES[key];
  const last = key.split('.').pop().replace('[]', '');
  if (METRIC_LABEL_OVERRIDES[last]) return METRIC_LABEL_OVERRIDES[last];
  return key.split('.').map(function (part) {
    return translateMetricPart_(part.replace('[]', '')) + (part.indexOf('[]') > -1 ? ' 配列' : '');
  }).join(' / ');
}

function translateMetricPart_(part) {
  const tokens = String(part || '').split('_').filter(Boolean);
  if (!tokens.length) return part;
  return tokens.map(function (token) {
    if (/^\d+$/.test(token)) return token;
    return METRIC_WORDS_JA[token] || token.toUpperCase();
  }).join(' ');
}

function metricUnitForKey_(key) {
  key = String(key || '').trim();
  if (METRIC_UNITS[key]) return METRIC_UNITS[key];
  const last = key.split('.').pop().replace('[]', '');
  if (isTemperatureMetricKey_(last)) return '°C';
  return METRIC_UNITS[last] || '';
}

function isTemperatureMetricKey_(key) {
  return /(^|_)temperature($|_)/.test(String(key || '').toLowerCase().replace(/[^a-z0-9]+/g, '_'));
}

function readKeyCatalog_() {
  const sh = getSheet_(SHEET_KEY_CATALOG);
  ensureHeaders_(sh, HEADERS.KeyCatalog);
  const values = sh.getDataRange().getValues();
  const idx = headerIndex_(sh);
  const out = [];
  for (let r = 1; r < values.length; r++) {
    const key = String(valueByHeader_(values[r], idx, 'key') || '').trim();
    if (!key) continue;
    if (isSystemMetadataKey_(key)) continue;
    out.push({
      key: key,
      label_ja: String(valueByHeader_(values[r], idx, 'label_ja') || ''),
      data_type: String(valueByHeader_(values[r], idx, 'data_type') || 'number'),
      unit: String(valueByHeader_(values[r], idx, 'unit') || ''),
      source: String(valueByHeader_(values[r], idx, 'source') || ''),
      models: String(valueByHeader_(values[r], idx, 'models') || ''),
      note: String(valueByHeader_(values[r], idx, 'note') || ''),
      enabled: parseBool_(valueByHeader_(values[r], idx, 'enabled'))
    });
  }
  return out.sort(function (a, b) { return a.key.localeCompare(b.key); });
}
