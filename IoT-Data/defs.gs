/**
 * IoT-Data - device registry, definitions, dashboard editor, and examples.
 *
 * Internal-use admin UI is intentionally unauthenticated. Keep the Web App URL
 * private inside the company network/context.
 */

const DEF_TYPES = { metric: true, expr: true, expression: true, formula: true };
const DEF_TYPES_EXPR = { expr: true, expression: true, formula: true };
const OFFLINE_INTERVAL_MULTIPLIER = 1.1;

const DEVICE_EXAMPLE_KEYS = {
  am102: ["battery", "humidity", "temperature"],
  am102l: ["battery", "humidity", "temperature"],
  am103: ["battery", "co2", "humidity", "temperature"],
  am103l: ["battery", "co2", "humidity", "temperature"],
  am104: ["activity", "battery", "humidity", "illumination", "infrared", "infrared_and_visible", "temperature"],
  am107: ["activity", "battery", "co2", "humidity", "illumination", "infrared", "infrared_and_visible", "pressure", "temperature", "tvoc"],
  am307: ["co2", "humidity", "light_level", "pir", "pressure", "temperature", "tvoc"],
  am307l: ["co2", "humidity", "light_level", "pir", "pressure", "temperature", "tvoc"],
  am308: ["co2", "humidity", "light_level", "pir", "pm10", "pm2_5", "pressure", "temperature", "tvoc"],
  am308l: ["co2", "humidity", "light_level", "pir", "pm10", "pm2_5", "pressure", "temperature", "tvoc"],
  "am319-hcho-ir": ["co2", "hcho", "humidity", "light_level", "pir", "pm10", "pm2_5", "pressure", "temperature", "tvoc"],
  "am319-hcho-well": ["co2", "hcho", "humidity", "light_level", "pir", "pm10", "pm2_5", "pressure", "temperature", "tvoc"],
  "am319-hcho": ["co2", "hcho", "humidity", "light_level", "pir", "pm10", "pm2_5", "pressure", "temperature", "tvoc"],
  "am319-o3": ["co2", "humidity", "light_level", "pir", "pm10", "pm2_5", "pressure", "temperature", "tvoc"],
  "am319l-hcho-ir": ["co2", "hcho", "humidity", "light_level", "pir", "pm10", "pm2_5", "pressure", "temperature", "tvoc"],
  "am319l-o3": ["co2", "humidity", "light_level", "pir", "pm10", "pm2_5", "pressure", "temperature", "tvoc"],
  at101: ["battery", "geofence_status", "latitude", "longitude", "motion_status", "position", "temperature", "wifi_scan_result", "wifi[].group", "wifi[].mac", "wifi[].motion_status", "wifi[].rssi"],
  ct101: ["current", "current_alarm.current_over_range_alarm", "current_alarm.current_over_range_alarm_release", "current_alarm.current_threshold_alarm", "current_alarm.current_threshold_alarm_release", "current_max", "current_min", "current_sensor_status", "device_status", "firmware_version", "hardware_version", "ipso_version", "lorawan_class", "sn", "total_current"],
  ct103: ["current", "current_alarm.current_over_range_alarm", "current_alarm.current_over_range_alarm_release", "current_alarm.current_threshold_alarm", "current_alarm.current_threshold_alarm_release", "current_max", "current_min", "current_sensor_status", "device_status", "firmware_version", "hardware_version", "ipso_version", "lorawan_class", "sn", "total_current"],
  ct105: ["current", "current_alarm.current_over_range_alarm", "current_alarm.current_over_range_alarm_release", "current_alarm.current_threshold_alarm", "current_alarm.current_threshold_alarm_release", "current_max", "current_min", "current_sensor_status", "device_status", "firmware_version", "hardware_version", "ipso_version", "lorawan_class", "sn", "total_current"],
  ct303: ["current_chn1", "current_chn1_alarm.current_over_range_alarm", "current_chn1_alarm.current_over_range_alarm_release", "current_chn1_alarm.current_threshold_alarm", "current_chn1_alarm.current_threshold_alarm_release", "current_chn1_max", "current_chn1_min", "current_chn1_sensor_status", "current_chn1_total", "device_status", "firmware_version", "hardware_version", "ipso_version", "lorawan_class", "sn", "tsl_version"],
  ct305: ["current_chn1", "current_chn1_alarm.current_over_range_alarm", "current_chn1_alarm.current_over_range_alarm_release", "current_chn1_alarm.current_threshold_alarm", "current_chn1_alarm.current_threshold_alarm_release", "current_chn1_max", "current_chn1_min", "current_chn1_sensor_status", "current_chn1_total", "device_status", "firmware_version", "hardware_version", "ipso_version", "lorawan_class", "sn", "tsl_version"],
  ct310: ["current_chn1", "current_chn1_alarm.current_over_range_alarm", "current_chn1_alarm.current_over_range_alarm_release", "current_chn1_alarm.current_threshold_alarm", "current_chn1_alarm.current_threshold_alarm_release", "current_chn1_max", "current_chn1_min", "current_chn1_sensor_status", "current_chn1_total", "device_status", "firmware_version", "hardware_version", "ipso_version", "lorawan_class", "sn", "tsl_version"],
  ds3604: ["battery", "template_1.qrcode", "template_1.text_1"],
  "em300-cl": ["battery", "calibration_result", "liquid", "liquid_alarm"],
  "em300-di-hall": ["battery", "history[].alarm", "history[].pluse_conv", "history[].timestamp", "history[].water", "history[].water_conv", "pluse_conv", "water", "water_alarm", "water_conv"],
  "em300-di": ["battery", "history[].humidity", "history[].pulse", "history[].temperature", "history[].timestamp", "humidity", "temperature"],
  "em300-mcs": ["battery", "history[].humidity", "history[].magnet_status", "history[].temperature", "history[].timestamp", "humidity", "magnet_status", "temperature"],
  "em300-mld": ["battery", "history[].leakage_status", "history[].timestamp", "leakage_status"],
  "em300-sld": ["battery", "history[].humidity", "history[].leakage_status", "history[].temperature", "history[].timestamp", "humidity", "leakage_status", "temperature"],
  "em300-th": ["battery", "history[].humidity", "history[].temperature", "history[].timestamp", "humidity", "temperature"],
  "em300-zld": ["battery", "history[].humidity", "history[].leakage_status", "history[].temperature", "history[].timestamp", "humidity", "leakage_status", "temperature"],
  "em310-tilt": ["angle_x", "angle_y", "angle_z", "threshold_x", "threshold_y", "threshold_z"],
  "em310-udl": ["battery", "distance", "position"],
  "em320-th": ["battery", "history[].humidity", "history[].temperature", "history[].timestamp", "humidity", "temperature"],
  "em320-tilt": ["angle_x", "angle_y", "angle_z", "battery", "threshold_x", "threshold_y", "threshold_z"],
  "em400-mud": ["battery", "csq", "data_length", "data[].battery", "data[].distance", "data[].position", "data[].temperature", "distance", "distance_alarm", "firmwareVersion", "flag", "frameCnt", "hardwareVersion", "iccid", "id", "imei", "imsi", "length", "position", "protocolVersion", "sn", "startFlag", "temperature", "temperature_alarm"],
  "em400-tld": ["battery", "csq", "data_length", "data[].battery", "data[].distance", "data[].position", "data[].temperature", "distance", "distance_alarm", "firmwareVersion", "flag", "frameCnt", "hardwareVersion", "iccid", "id", "imei", "imsi", "length", "position", "protocolVersion", "sn", "startFlag", "temperature", "temperature_alarm"],
  "em400-udl": ["battery", "csq", "data_length", "data[].battery", "data[].distance", "data[].position", "data[].temperature", "distance", "distance_alarm", "firmwareVersion", "flag", "frameCnt", "hardwareVersion", "iccid", "id", "imei", "imsi", "length", "position", "protocolVersion", "sn", "startFlag", "temperature", "temperature_alarm"],
  "em500-co2": ["battery", "co2", "humidity", "pressure", "temperature"],
  "em500-lgt": ["battery", "illumination"],
  "em500-pp": ["battery", "pressure"],
  "em500-pt100": ["battery", "temperature"],
  "em500-smtc": ["battery", "ec", "moisture", "temperature"],
  "em500-swl": ["battery", "depth"],
  "em500-udl": ["battery", "distance"],
  gs301: ["battery", "h2s", "humidity", "nh3", "temperature"],
  ts101: ["battery", "temperature"],
  "ts201-v2": ["event[].humidity", "event[].humidity_alarm", "event[].humidity_mutation", "event[].temperature", "event[].temperature_alarm", "event[].temperature_mutation", "event[].temperature_sensor_status", "history[].event.event_type", "history[].event.temperature_sensor_status", "history[].sensor_type", "history[].temperature", "history[].timestamp", "humidity", "temperature"],
  ts201: ["event[].temperature", "event[].temperature_alarm", "event[].temperature_exception", "event[].temperature_mutation", "history[].event_type", "history[].read_status", "history[].temperature", "history[].timestamp", "temperature"],
  "ts301-v2": ["battery", "history[].temperature_chn1", "history[].temperature_chn2", "history[].timestamp", "magnet_chn1", "magnet_chn2", "temperature_chn1", "temperature_chn1_alarm", "temperature_chn2", "temperature_chn2_alarm", "temperature_chn2_change"],
  ts301: ["battery", "history[].temperature_chn1", "history[].temperature_chn2", "history[].timestamp", "magnet_chn1", "magnet_chn2", "temperature_chn1", "temperature_chn1_alarm", "temperature_chn2", "temperature_chn2_alarm", "temperature_chn2_change"],
  "ts302-v2": ["battery", "history[].temperature_chn1", "history[].temperature_chn2", "history[].timestamp", "magnet_chn1", "magnet_chn2", "temperature_chn1", "temperature_chn1_alarm", "temperature_chn2", "temperature_chn2_alarm", "temperature_chn2_change"],
  ts302: ["battery", "history[].temperature_chn1", "history[].temperature_chn2", "history[].timestamp", "magnet_chn1", "magnet_chn2", "temperature_chn1", "temperature_chn1_alarm", "temperature_chn2", "temperature_chn2_alarm", "temperature_chn2_change"],
  uc300: ["adc_1", "adc_1_avg", "adc_1_max", "adc_1_min", "adc_2", "adc_2_avg", "adc_2_max", "adc_2_min", "adv_1", "adv_1_avg", "adv_1_max", "adv_1_min", "adv_2", "adv_2_avg", "adv_2_max", "adv_2_min", "gpio_counter_1", "gpio_counter_2", "gpio_input_3", "gpio_input_4", "gpio_output_1", "gpio_output_2", "modbus_chn_1", "modbus_chn_10", "modbus_chn_11", "modbus_chn_12", "modbus_chn_13", "modbus_chn_14", "modbus_chn_15", "modbus_chn_16", "modbus_chn_17", "modbus_chn_18", "modbus_chn_19", "modbus_chn_2", "modbus_chn_20", "modbus_chn_21", "modbus_chn_22", "modbus_chn_23", "modbus_chn_24", "modbus_chn_25", "modbus_chn_26", "modbus_chn_27", "modbus_chn_28", "modbus_chn_29", "modbus_chn_3", "modbus_chn_30", "modbus_chn_31", "modbus_chn_32", "modbus_chn_4", "modbus_chn_5", "modbus_chn_6", "modbus_chn_7", "modbus_chn_8", "modbus_chn_9", "pt100_1", "pt100_2"],
  uc501: ["adc_1", "adc_1_avg", "adc_1_max", "adc_1_min", "battery", "gpio_1", "gpio_counter_1", "modbus_chn_1_alarm", "modbus_chn_3", "sdi12_3"],
  uc502: ["adc_1", "adc_1_avg", "adc_1_max", "adc_1_min", "battery", "gpio_1", "gpio_counter_1", "modbus_chn_1_alarm", "modbus_chn_3", "sdi12_3"],
  uc511: ["battery", "history[].gpio_2", "history[].mode", "history[].timestamp", "history[].valve_2", "valve_1", "valve_1_pulse"],
  uc512: ["battery", "history[].gpio_2", "history[].mode", "history[].timestamp", "history[].valve_2", "valve_1", "valve_1_pulse"],
  uc521: ["battery", "pressure_2", "valve_1_opening", "valve_1_type"],
  vs121: ["a_to_a", "a_to_b", "a_to_c", "a_to_d", "b_to_a", "b_to_b", "b_to_c", "b_to_d", "c_to_a", "c_to_b", "c_to_c", "c_to_d", "d_to_a", "d_to_b", "d_to_c", "d_to_d", "firmware_version", "hardware_version", "people_count_all", "people_count_max", "people_in", "people_out", "protocol_version", "region_1", "region_1_count", "region_10_count", "region_11_count", "region_12_count", "region_13_count", "region_14_count", "region_15_count", "region_16_count", "region_2", "region_2_count", "region_3", "region_3_count", "region_4", "region_4_count", "region_5", "region_5_count", "region_6", "region_6_count", "region_7", "region_7_count", "region_8", "region_8_count", "region_9_count", "region_count", "sn"],
  "vs121-p": ["event", "report_type", "device_info.device", "device_info.device_sn", "device_info.device_mac", "device_info.ip_address", "time_info.timezone", "time_info.dst_status", "time_info.start_time", "time_info.end_time", "time_info.time", "current_total", "max_counted", "Max_counted", "total_mapped_regions", "regions_name[]", "numbering_regions[]", "occupancy[]", "current_counted[]", "snapshot", "dwell_time_data[].region", "dwell_time_data[].max_dwell_time", "dwell_time_data[].avg_dwell_time", "dwell_time_data[].people_id", "dwell_time_data[].dwell_start_time", "dwell_time_data[].dwell_end_time", "dwell_time_data[].duration", "in_counted", "out_counted", "capacity_counted", "total_data.in_cumulative_counted", "total_data.out_cumulative_counted", "total_data.capacity_cumulative_counted", "line_trigger_data.in", "line_trigger_data.out", "flow_data.A-A", "flow_data.A-B", "flow_data.A-C", "flow_data.A-D", "flow_data.B-A", "flow_data.B-B", "flow_data.B-C", "flow_data.B-D", "flow_data.C-A", "flow_data.C-B", "flow_data.C-C", "flow_data.C-D", "flow_data.D-A", "flow_data.D-B", "flow_data.D-C", "flow_data.D-D"],
  vs132: ["firmware_version", "hardware_version", "periodic_counter_in", "periodic_counter_out", "protocol_version", "sn", "total_counter_in", "total_counter_out"],
  vs133: ["line_1_period_in", "line_1_period_out", "line_1_total_in", "line_1_total_out", "line_2_period_in", "line_2_period_out", "line_2_total_in", "line_2_total_out", "line_3_period_in", "line_3_period_out", "line_3_total_in", "line_3_total_out", "line_4_period_in", "line_4_period_out", "line_4_total_in", "line_4_total_out", "region_1_avg_dwell", "region_1_count", "region_1_max_dwell", "region_2_avg_dwell", "region_2_count", "region_2_max_dwell", "region_3_avg_dwell", "region_3_count", "region_3_max_dwell", "region_4_avg_dwell", "region_4_count", "region_4_max_dwell"],
  vs135: ["line_1_period_in", "line_1_period_out", "line_1_total_in", "line_1_total_out", "line_2_period_in", "line_2_period_out", "line_2_total_in", "line_2_total_out", "line_3_period_in", "line_3_period_out", "line_3_total_in", "line_3_total_out", "line_4_period_in", "line_4_period_out", "line_4_total_in", "line_4_total_out", "region_1_avg_dwell", "region_1_count", "region_1_max_dwell", "region_2_avg_dwell", "region_2_count", "region_2_max_dwell", "region_3_avg_dwell", "region_3_count", "region_3_max_dwell", "region_4_avg_dwell", "region_4_count", "region_4_max_dwell"],
  vs330: ["battery", "calibration_status", "distance", "occupancy"],
  vs340: ["battery", "occupancy"],
  vs341: ["battery", "occupancy"],
  vs350: ["battery", "history[].period_in", "history[].period_out", "history[].timestamp", "history[].total_in", "history[].total_out", "period_count_alarm", "period_in", "period_out", "temperature", "temperature_alarm", "total_count_alarm", "total_in", "total_out"],
  vs351: ["battery", "history[].period_in", "history[].period_out", "history[].timestamp", "history[].total_in", "history[].total_out", "period_count_alarm", "period_in", "period_out", "temperature", "temperature_alarm", "total_count_alarm", "total_in", "total_out"],
  ws101: ["battery", "button_event.status"],
  ws136: ["battery", "press"],
  ws156: ["battery", "press"],
  ws201: ["battery", "distance", "remaining"],
  ws202: ["battery", "daylight", "pir"],
  ws203: ["battery", "history[].humidity", "history[].occupancy", "history[].report_type", "history[].temperature", "history[].timestamp", "humidity", "occupancy", "temperature", "temperature_abnormal"],
  ws301: ["battery", "magnet_status", "tamper_status"],
  ws302: ["battery", "LAeq", "LAF", "LAFmax"],
  ws303: ["battery", "leakage_status"],
  "ws501-cn": ["switch_1", "switch_1_change", "switch_2", "switch_2_change", "switch_3", "switch_3_change"],
  "ws501-eu": ["switch_1", "switch_1_change", "switch_2", "switch_2_change"],
  "ws501-us": ["switch_1", "switch_1_change"],
  "ws501-v4": ["button_lock_config.enable", "button_reset_config", "button_status_control.button_status1", "button_status_control.button_status1_change", "d2d_agent_settings_array[].action_status.button", "d2d_agent_settings_array[].action_status.button_status", "d2d_agent_settings_array[].control_command", "d2d_agent_settings_array[].enable", "d2d_agent_settings_array[].number", "d2d_controller_settings_array[].button_id", "d2d_controller_settings_array[].contrl_cmd", "d2d_controller_settings_array[].contrl_enable", "d2d_controller_settings_array[].uplink.button_enable", "d2d_controller_settings_array[].uplink.lora_enable", "daylight_saving_time.dst_bias", "daylight_saving_time.enable", "daylight_saving_time.end_hour_min", "daylight_saving_time.end_month", "daylight_saving_time.end_week_day", "daylight_saving_time.end_week_num", "daylight_saving_time.start_hour_min", "daylight_saving_time.start_month", "daylight_saving_time.start_week_day", "daylight_saving_time.start_week_num", "get_schedule.schedule_id", "highcurrent_config", "led_mode", "overcurrent_alarm_config.enable", "overcurrent_alarm_config.threshold", "overcurrent_protection.enable", "overcurrent_protection.threshold", "power_consumption_2w.button_power1", "power_consumption_2w.enable", "power_consumption_3w", "power_consumption_clear", "reboot", "report_attribute", "report_status", "reporting_interval", "schedule_settings[].button_status1", "schedule_settings[].enable", "schedule_settings[].execut_hour", "schedule_settings[].execut_min", "schedule_settings[].friday", "schedule_settings[].lock_status", "schedule_settings[].monday", "schedule_settings[].saturday", "schedule_settings[].schedule_id", "schedule_settings[].sunday", "schedule_settings[].thursday", "schedule_settings[].tuesday", "schedule_settings[].use_config", "schedule_settings[].wednesday"],
  ws501: ["switch_1", "switch_1_change", "switch_2", "switch_2_change", "switch_3", "switch_3_change"],
  "ws502-cn": ["switch_1", "switch_1_change", "switch_2", "switch_2_change", "switch_3", "switch_3_change"],
  "ws502-eu": ["switch_1", "switch_1_change", "switch_2", "switch_2_change"],
  "ws502-v4": ["button_lock_config.enable", "button_reset_config", "button_status_control.button_status1", "button_status_control.button_status1_change", "button_status_control.button_status2", "button_status_control.button_status2_change", "d2d_agent_settings_array[].action_status.button", "d2d_agent_settings_array[].action_status.button_status", "d2d_agent_settings_array[].control_command", "d2d_agent_settings_array[].enable", "d2d_agent_settings_array[].number", "d2d_controller_settings_array[].button_id", "d2d_controller_settings_array[].contrl_cmd", "d2d_controller_settings_array[].contrl_enable", "d2d_controller_settings_array[].uplink.button_enable", "d2d_controller_settings_array[].uplink.lora_enable", "daylight_saving_time.dst_bias", "daylight_saving_time.enable", "daylight_saving_time.end_hour_min", "daylight_saving_time.end_month", "daylight_saving_time.end_week_day", "daylight_saving_time.end_week_num", "daylight_saving_time.start_hour_min", "daylight_saving_time.start_month", "daylight_saving_time.start_week_day", "daylight_saving_time.start_week_num", "get_schedule.schedule_id", "highcurrent_config", "led_mode", "overcurrent_alarm_config.enable", "overcurrent_alarm_config.threshold", "overcurrent_protection.enable", "overcurrent_protection.threshold", "power_consumption_2w.button_power1", "power_consumption_2w.button_power2", "power_consumption_2w.enable", "power_consumption_3w", "power_consumption_clear", "reboot", "report_attribute", "report_status", "reporting_interval", "schedule_settings[].button_status1", "schedule_settings[].button_status2", "schedule_settings[].enable", "schedule_settings[].execut_hour", "schedule_settings[].execut_min", "schedule_settings[].friday", "schedule_settings[].lock_status", "schedule_settings[].monday", "schedule_settings[].saturday", "schedule_settings[].schedule_id", "schedule_settings[].sunday", "schedule_settings[].thursday", "schedule_settings[].tuesday", "schedule_settings[].use_config", "schedule_settings[].wednesday"],
  ws502: ["switch_1", "switch_1_change", "switch_2", "switch_2_change", "switch_3", "switch_3_change"],
  "ws503-cn": ["switch_1", "switch_1_change", "switch_2", "switch_2_change", "switch_3", "switch_3_change"],
  "ws503-v4": ["button_lock_config.enable", "button_reset_config", "button_status_control.button_status1", "button_status_control.button_status1_change", "button_status_control.button_status2", "button_status_control.button_status2_change", "button_status_control.button_status3", "button_status_control.button_status3_change", "d2d_agent_settings_array[].action_status.button", "d2d_agent_settings_array[].action_status.button_status", "d2d_agent_settings_array[].control_command", "d2d_agent_settings_array[].enable", "d2d_agent_settings_array[].number", "d2d_controller_settings_array[].button_id", "d2d_controller_settings_array[].contrl_cmd", "d2d_controller_settings_array[].contrl_enable", "d2d_controller_settings_array[].uplink.button_enable", "d2d_controller_settings_array[].uplink.lora_enable", "daylight_saving_time.dst_bias", "daylight_saving_time.enable", "daylight_saving_time.end_hour_min", "daylight_saving_time.end_month", "daylight_saving_time.end_week_day", "daylight_saving_time.end_week_num", "daylight_saving_time.start_hour_min", "daylight_saving_time.start_month", "daylight_saving_time.start_week_day", "daylight_saving_time.start_week_num", "get_schedule.schedule_id", "highcurrent_config", "led_mode", "overcurrent_alarm_config.enable", "overcurrent_alarm_config.threshold", "overcurrent_protection.enable", "overcurrent_protection.threshold", "power_consumption_2w.button_power1", "power_consumption_2w.button_power2", "power_consumption_2w.button_power3", "power_consumption_2w.enable", "power_consumption_3w", "power_consumption_clear", "reboot", "report_attribute", "report_status", "reporting_interval", "schedule_settings[].button_status1", "schedule_settings[].button_status2", "schedule_settings[].button_status3", "schedule_settings[].enable", "schedule_settings[].execut_hour", "schedule_settings[].execut_min", "schedule_settings[].friday", "schedule_settings[].lock_status", "schedule_settings[].monday", "schedule_settings[].saturday", "schedule_settings[].schedule_id", "schedule_settings[].sunday", "schedule_settings[].thursday", "schedule_settings[].tuesday", "schedule_settings[].use_config", "schedule_settings[].wednesday"],
  ws503: ["switch_1", "switch_1_change", "switch_2", "switch_2_change", "switch_3", "switch_3_change"],
  ws513: ["active_power", "current", "power_consumption", "power_factor", "socket_status", "voltage"],
  ws515: ["active_power", "current", "power_consumption", "power_factor", "socket_status", "voltage"],
  ws523: ["active_power", "current", "power_consumption", "power_factor", "socket_status", "voltage"],
  ws525: ["active_power", "current", "power_consumption", "power_factor", "socket_status", "voltage"],
  ws558: ["active_power", "power_consumption", "power_factor", "switch_1", "switch_2", "switch_3", "switch_4", "switch_5", "switch_6", "switch_7", "switch_8", "total_current", "voltage"],
  wts506: ["battery", "history[].humidity", "history[].pressure", "history[].rainfall_total", "history[].temperature", "history[].timestamp", "history[].wind_direction", "history[].wind_speed", "humidity", "pressure", "pressure_alarm", "rainfall_alarm", "rainfall_counter", "rainfall_total", "temperature", "temperature_alarm", "wind_direction", "wind_speed", "wind_speed_alarm"]
};

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
  'flow_data.D-D': 'D-D 人流'
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
  'flow_data.D-D': '人'
};

const METRIC_META = buildKnownMetricMeta_();

function apiGetAdminSnapshot() {
  ensureIngestReady_();
  return getAdminSnapshot_();
}

function apiSaveDevice(device) {
  ensureIngestReady_();
  const clean = normalizeDeviceInput_(device);
  if (!clean.device_id) throw new Error('device_id is required');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = getSheet_(SHEET_DEVICES);
    ensureHeaders_(sh, HEADERS.Devices);
    const idx = headerIndex_(sh);
    const values = sh.getDataRange().getValues();
    for (let r = 1; r < values.length; r++) {
      if (String(values[r][idx.device_id] || '') === clean.device_id) {
        writeDeviceRow_(sh, r + 1, idx, clean, false);
        return getAdminSnapshot_();
      }
    }
    sh.appendRow(deviceToRow_(clean, idx));
    return getAdminSnapshot_();
  } finally {
    lock.releaseLock();
  }
}

function apiDeleteDevice(deviceId) {
  ensureIngestReady_();
  const target = String(deviceId || '').trim();
  if (!target) throw new Error('device_id is required');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const deviceSheet = getSheet_(SHEET_DEVICES);
    ensureHeaders_(deviceSheet, HEADERS.Devices);
    const deviceIdx = headerIndex_(deviceSheet);
    const deviceValues = deviceSheet.getDataRange().getValues();
    let deleted = false;
    for (let r = deviceValues.length - 1; r >= 1; r--) {
      if (String(valueByHeader_(deviceValues[r], deviceIdx, 'device_id') || '').trim() === target) {
        deviceSheet.deleteRow(r + 1);
        deleted = true;
      }
    }
    if (!deleted) throw new Error('Device not found: ' + target);

    const layoutSheet = getSheet_(SHEET_LAYOUT);
    ensureHeaders_(layoutSheet, HEADERS.Layout);
    const layoutIdx = headerIndex_(layoutSheet);
    const layoutValues = layoutSheet.getDataRange().getValues();
    for (let lr = layoutValues.length - 1; lr >= 1; lr--) {
      const bindType = String(valueByHeader_(layoutValues[lr], layoutIdx, 'bind_type') || 'device').trim() || 'device';
      const bindRef = String(valueByHeader_(layoutValues[lr], layoutIdx, 'bind_ref') || '').trim();
      if (bindType === 'device' && bindRef === target) {
        layoutSheet.deleteRow(lr + 1);
      }
    }

    return getAdminSnapshot_();
  } finally {
    lock.releaseLock();
  }
}

function apiSaveDefinition(definition) {
  ensureIngestReady_();
  const clean = normalizeDefinitionInput_(definition);
  if (!clean.id) throw new Error('id is required');
  if (!DEF_TYPES[clean.type]) throw new Error('type must be metric or expr');
  if (DEF_TYPES_EXPR[clean.type] && !clean.expression) throw new Error('expression is required');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = getSheet_(SHEET_DEFINITIONS);
    const values = sh.getDataRange().getValues();
    for (let r = 1; r < values.length; r++) {
      if (String(values[r][0]) === clean.id) {
        sh.getRange(r + 1, 1, 1, 8).setValues([definitionToRow_(clean)]);
        return getAdminSnapshot_();
      }
    }
    sh.appendRow(definitionToRow_(clean));
    return getAdminSnapshot_();
  } finally {
    lock.releaseLock();
  }
}

function apiDeleteDefinition(id) {
  ensureIngestReady_();
  const target = String(id || '').trim();
  if (!target) throw new Error('id is required');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = getSheet_(SHEET_DEFINITIONS);
    const values = sh.getDataRange().getValues();
    for (let r = values.length - 1; r >= 1; r--) {
      if (String(values[r][0]) === target) sh.deleteRow(r + 1);
    }
    return getAdminSnapshot_();
  } finally {
    lock.releaseLock();
  }
}

function apiSeedKnownMetricDefinitions() {
  ensureIngestReady_();
  seedKeyCatalog_();
  seedKnownMetricDefinitions_();
  return getAdminSnapshot_();
}

function apiSeedKeyCatalog() {
  ensureIngestReady_();
  seedKeyCatalog_();
  return getAdminSnapshot_();
}

function apiTestExpression(expression, scopeJson) {
  let scope = {};
  if (String(scopeJson || '').trim()) {
    scope = JSON.parse(scopeJson);
  }
  return evalExpression_(expression, scope);
}

function apiGetIngestInfo() {
  ensureIngestReady_();
  const props = PropertiesService.getScriptProperties();
  return {
    spreadsheet_id: props.getProperty('SPREADSHEET_ID') || DEFAULT_SPREADSHEET_ID,
    endpoint_auth: 'none',
    build: BUILD_VERSION
  };
}

function apiTestIngest() {
  ensureIngestReady_();
  return testIngest();
}

function apiSetBackgroundUrl(imageUrl, width, height) {
  ensureIngestReady_();
  const url = normalizeImageUrl_(imageUrl);
  if (url && !/^https?:\/\/.+/i.test(url)) throw new Error('Image URL must start with http:// or https://');
  setConfig_('background_image_url', url);
  if (url) setConfig_('background_image_file_id', '');
  if (width) setConfig_('map_width', Number(width));
  if (height) setConfig_('map_height', Number(height));
  return getAdminSnapshot_();
}

function apiSaveDashboardSettings(settings) {
  ensureIngestReady_();
  settings = settings || {};
  const url = normalizeImageUrl_(settings.imageUrl);
  if (url && !/^https?:\/\/.+/i.test(url)) throw new Error('Image URL must start with http:// or https://');
  setConfig_('background_image_url', url);
  if (url) setConfig_('background_image_file_id', '');
  if (settings.width) setConfig_('map_width', Number(settings.width));
  if (settings.height) setConfig_('map_height', Number(settings.height));
  setConfig_('refresh_interval_sec', normalizeRefreshInterval_(settings.refresh_interval_sec));
  setConfig_('offline_timeout_min', normalizeOfflineTimeout_(settings.offline_timeout_min));
  return getAdminSnapshot_();
}

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

function apiSaveDeviceLayoutSettings(deviceId, styleConfig) {
  ensureIngestReady_();
  const target = String(deviceId || '').trim();
  if (!target) throw new Error('device_id is required');
  styleConfig = styleConfig || {};
  const incomingStyle = normalizeStyleConfig_(styleConfig);
  const hasDisplayMode = Object.prototype.hasOwnProperty.call(styleConfig, 'displayMode') || Object.prototype.hasOwnProperty.call(styleConfig, 'display_mode');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = getSheet_(SHEET_LAYOUT);
    ensureHeaders_(sh, HEADERS.Layout);
    const values = sh.getDataRange().getValues();
    for (let r = 1; r < values.length; r++) {
      if (String(values[r][2] || '').trim() !== target) continue;
      const existingStyle = parseStyleConfig_(values[r][6]);
      const cleanStyle = {
        metrics: incomingStyle.metrics,
        displayMode: hasDisplayMode ? incomingStyle.displayMode : (existingStyle.displayMode || 'card'),
        cardWidth: existingStyle.cardWidth || 0,
        cardHeight: existingStyle.cardHeight || 0
      };
      const item = normalizeLayoutItem_({
        item_id: values[r][0],
        bind_type: values[r][1] || 'device',
        bind_ref: values[r][2],
        x_norm: values[r][3],
        y_norm: values[r][4],
        label: values[r][5],
        style_config: cleanStyle,
        enabled: values[r][7]
      });
      sh.getRange(r + 1, 1, 1, 8).setValues([layoutItemToRow_(item)]);
    }
    return getAdminSnapshot_();
  } finally {
    lock.releaseLock();
  }
}

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

function getAdminSnapshot_() {
  ensureHeaders_(getSheet_(SHEET_DEVICES), HEADERS.Devices);
  ensureHeaders_(getSheet_(SHEET_KEY_CATALOG), HEADERS.KeyCatalog);
  const devices = readDevices_();
  const latest = readLatestRows_();
  attachMetricsToDevices_(devices, latest);
  return {
    devices: devices,
    definitions: readDefinitions_(),
    keyCatalog: readKeyCatalog_(),
    latest: latest,
    dashboard: {
      config: getDashboardConfig_(),
      layout: readLayout_()
    },
    deviceExamples: getDeviceExampleModels_(),
    metricMeta: METRIC_META,
    build: BUILD_VERSION
  };
}

function normalizeDeviceInput_(device) {
  device = device || {};
  return {
    device_id: String(device.device_id || '').trim(),
    name: String(device.name || '').trim(),
    note: String(device.note || '').trim(),
    enabled: parseBool_(device.enabled),
    area_id: String(device.area_id || '').trim(),
    location: String(device.location || '').trim(),
    type: String(device.type || '').trim(),
    sensor_type: String(device.sensor_type || '').trim(),
    power_source: String(device.power_source || '').trim(),
    report_interval_min: normalizeReportIntervalMin_(device.report_interval_min)
  };
}

function writeDeviceRow_(sheet, rowNumber, idx, device, isNew) {
  const current = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
  setByHeader_(current, idx, 'device_id', device.device_id);
  setByHeader_(current, idx, 'name', device.name);
  setByHeader_(current, idx, 'note', device.note);
  setByHeader_(current, idx, 'enabled', device.enabled);
  setByHeader_(current, idx, 'area_id', device.area_id);
  setByHeader_(current, idx, 'location', device.location);
  setByHeader_(current, idx, 'type', device.type);
  setByHeader_(current, idx, 'sensor_type', device.sensor_type);
  setByHeader_(current, idx, 'power_source', device.power_source);
  setByHeader_(current, idx, 'report_interval_min', device.report_interval_min);
  if (isNew) setByHeader_(current, idx, 'first_seen', new Date());
  sheet.getRange(rowNumber, 1, 1, current.length).setValues([current]);
}

function deviceToRow_(device, idx) {
  const width = Math.max.apply(null, Object.keys(idx).map(function (key) { return idx[key]; })) + 1;
  const row = new Array(width).fill('');
  setByHeader_(row, idx, 'device_id', device.device_id);
  setByHeader_(row, idx, 'name', device.name);
  setByHeader_(row, idx, 'note', device.note);
  setByHeader_(row, idx, 'enabled', device.enabled);
  setByHeader_(row, idx, 'first_seen', new Date());
  setByHeader_(row, idx, 'area_id', device.area_id);
  setByHeader_(row, idx, 'location', device.location);
  setByHeader_(row, idx, 'type', device.type);
  setByHeader_(row, idx, 'sensor_type', device.sensor_type);
  setByHeader_(row, idx, 'power_source', device.power_source);
  setByHeader_(row, idx, 'report_interval_min', device.report_interval_min);
  return row;
}

function setByHeader_(row, idx, key, value) {
  if (idx[key] === undefined) return;
  row[idx[key]] = value;
}

function seedKnownMetricDefinitions_() {
  const sh = getSheet_(SHEET_DEFINITIONS);
  const values = sh.getDataRange().getValues();
  const exists = {};
  for (let r = 1; r < values.length; r++) {
    const id = String(values[r][0] || '').trim();
    if (id) exists[id] = true;
    if (String(values[r][1] || '').trim().toLowerCase() === 'raw') {
      sh.getRange(r + 1, 2).setValue('metric');
    }
    if (isTemperatureMetricKey_(id) && String(values[r][3] || '').trim() === 'C') {
      sh.getRange(r + 1, 4).setValue('°C');
    }
  }

  const rows = knownMetricKeys_().filter(function (key) {
    return !exists[key];
  }).map(function (key) {
    const meta = metricMetaForKey_(key);
    return [key, 'metric', meta.label, meta.unit, 'device-examples', '', '{"origin":"device-examples"}', true];
  });

  if (rows.length) {
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, 8).setValues(rows);
  }
  return { added: rows.length };
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
  if (/(^|_)(sn|mac|imei|imsi|iccid|version|qrcode|text|class|type|id|status)$/.test(normalized)) return 'string';
  if (/(^|_)(enable|enabled|alarm|lock|open|occupied|occupancy|pir|switch|leakage|magnet|tamper)($|_)/.test(normalized)) return 'boolean';
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
      found[key] = true;
    });
  });
  return Object.keys(found).sort();
}

function metricMetaForKey_(key) {
  return {
    label: metricLabelJa_(key),
    unit: metricUnitForKey_(key)
  };
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

function normalizeDefinitionInput_(definition) {
  definition = definition || {};
  let type = String(definition.type || 'metric').trim().toLowerCase();
  if (type === 'raw') type = 'metric';
  return {
    id: String(definition.id || '').trim(),
    type: type,
    name: String(definition.name || '').trim(),
    unit: String(definition.unit || '').trim(),
    source: String(definition.source || '*').trim() || '*',
    expression: String(definition.expression || '').trim(),
    params: String(definition.params || '').trim(),
    enabled: parseBool_(definition.enabled)
  };
}

function definitionToRow_(d) {
  return [d.id, d.type, d.name, d.unit, d.source, d.expression, d.params, d.enabled];
}

function readDevices_() {
  const sh = getSheet_(SHEET_DEVICES);
  const values = sh.getDataRange().getValues();
  const idx = headerIndex_(sh);
  const out = [];
  const config = getConfigMap_();
  const fallbackIntervalMin = normalizeOfflineTimeout_(config.offline_timeout_min);
  const now = new Date();
  for (let r = 1; r < values.length; r++) {
    if (String(valueByHeader_(values[r], idx, 'device_id')).trim() === '') continue;
    const enabled = parseBool_(valueByHeader_(values[r], idx, 'enabled'));
    const lastSeenValue = valueByHeader_(values[r], idx, 'last_seen');
    const reportIntervalMin = normalizeReportIntervalMin_(valueByHeader_(values[r], idx, 'report_interval_min')) || fallbackIntervalMin;
    const onlineStatus = deviceOnlineStatus_(enabled, lastSeenValue, now, reportIntervalMin);
    out.push({
      device_id: String(valueByHeader_(values[r], idx, 'device_id') || ''),
      name: String(valueByHeader_(values[r], idx, 'name') || ''),
      note: String(valueByHeader_(values[r], idx, 'note') || ''),
      enabled: enabled,
      online: onlineStatus.online,
      offline_reason: onlineStatus.reason,
      last_seen: dateOut_(lastSeenValue),
      first_seen: dateOut_(valueByHeader_(values[r], idx, 'first_seen')),
      area_id: String(valueByHeader_(values[r], idx, 'area_id') || ''),
      location: String(valueByHeader_(values[r], idx, 'location') || ''),
      type: String(valueByHeader_(values[r], idx, 'type') || ''),
      sensor_type: String(valueByHeader_(values[r], idx, 'sensor_type') || ''),
      power_source: String(valueByHeader_(values[r], idx, 'power_source') || ''),
      report_interval_min: reportIntervalMin,
      offline_after_min: Math.round(reportIntervalMin * OFFLINE_INTERVAL_MULTIPLIER * 100) / 100
    });
  }
  return out;
}

function valueByHeader_(row, idx, key) {
  return idx[key] === undefined ? '' : row[idx[key]];
}

function readDefinitions_() {
  const sh = getSheet_(SHEET_DEFINITIONS);
  const values = sh.getDataRange().getValues();
  const out = [];
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][0]).trim() === '') continue;
    out.push({
      id: String(values[r][0]),
      type: String(values[r][1] || 'expr').toLowerCase(),
      name: String(values[r][2] || ''),
      unit: String(values[r][3] || ''),
      source: String(values[r][4] || '*'),
      expression: String(values[r][5] || ''),
      params: String(values[r][6] || ''),
      enabled: parseBool_(values[r][7])
    });
  }
  return out;
}

function readLatestRows_() {
  const sh = getSheet_(SHEET_LATEST);
  const values = sh.getDataRange().getValues();
  const out = [];
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][0]).trim() === '' || String(values[r][1]).trim() === '') continue;
    out.push({
      device_id: String(values[r][0]),
      metric: String(values[r][1]),
      value: values[r][2],
      ts: dateOut_(values[r][3])
    });
  }
  return out;
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

function attachMetricsToDevices_(devices, latest) {
  const byDevice = {};
  latest.forEach(function (row) {
    if (!byDevice[row.device_id]) byDevice[row.device_id] = {};
    byDevice[row.device_id][row.metric] = { value: row.value, ts: row.ts };
  });
  devices.forEach(function (d) {
    d.metrics = byDevice[d.device_id] || {};
    d.metricKeys = Object.keys(d.metrics).sort();
  });
}

function getDashboardConfig_() {
  const config = getConfigMap_();
  return {
    map_width: Number(config.map_width || 1200),
    map_height: Number(config.map_height || 800),
    refresh_interval_sec: normalizeRefreshInterval_(config.refresh_interval_sec),
    offline_timeout_min: normalizeOfflineTimeout_(config.offline_timeout_min),
    background_image_url: String(config.background_image_url || ''),
    background_image_file_id: String(config.background_image_file_id || ''),
    background_url: getBackgroundUrlFromConfig_(config)
  };
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

function clampNumber_(value, min, max, fallback) {
  if (!isFinite(value) || value <= 0) return fallback;
  return Math.max(min, Math.min(max, value));
}

function parseStyleConfig_(style) {
  try {
    const obj = JSON.parse(String(style || '{}'));
    return normalizeStyleConfig_(obj);
  } catch (err) {
    return { metrics: [], displayMode: 'card', cardWidth: 0, cardHeight: 0 };
  }
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

function dateOut_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
    return v.toISOString();
  }
  return String(v || '');
}

function latestScopeForDevice_(device_id) {
  const sh = getSheet_(SHEET_LATEST);
  const values = sh.getDataRange().getValues();
  const scope = {};
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][0]) !== device_id) continue;
    const metric = String(values[r][1] || '').trim();
    const value = Number(values[r][2]);
    if (metric && isFinite(value)) scope[metric] = value;
  }
  return scope;
}

function applyDefinitionsForDevice_(device_id, ts) {
  const defs = readDefinitions_();
  if (!defs.length) return [];

  const scope = latestScopeForDevice_(device_id);
  const derived = [];
  defs.forEach(function (d) {
    if (!d.enabled || !DEF_TYPES_EXPR[d.type]) return;
    if (!(d.source === '*' || d.source === '' || d.source === device_id)) return;
    const result = evalExpression_(d.expression, scope);
    if (!result.ok) {
      Logger.log('definition "' + d.id + '" failed for ' + device_id + ': ' + result.error);
      return;
    }
    scope[d.id] = result.value;
    derived.push({ metric: d.id, value: result.value });
  });

  if (derived.length) {
    appendDerivedReadings_(device_id, derived, ts);
    upsertLatest_(device_id, derived, ts);
  }
  return derived;
}

function appendDerivedReadings_(device_id, metrics, ts) {
  const sh = getSheet_(SHEET_READINGS);
  const rows = metrics.map(function (m) {
    return [ts, device_id, m.metric, m.value, 'derived'];
  });
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, 5).setValues(rows);
}

function clamp01_(n) {
  if (!isFinite(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}
