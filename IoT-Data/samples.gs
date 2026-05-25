/**
 * AUTO-MIGRATED from defs.gs — see README.
 * Edits here are fine; this file is hand-maintained from now on.
 */
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
  "vs125-p": ["device_info.cus_device_id", "device_info.cus_site_id", "device_info.device_mac", "device_info.device_name", "device_info.device_sn", "device_info.firmware_version", "device_info.hardware_version", "device_info.ip_address", "device_info.running_time", "device_info.wlan mac", "device_info.wlan_mac", "device_info.cpu.cpu_temperature", "device_info.cpu.cpu_usage", "device_info.device_tilt_pitch_roll.pitch", "device_info.device_tilt_pitch_roll.roll", "device_info.ram.memory_usage", "device_info.ram.total_memory_mb", "device_info.ram.used_memory_mb", "device_info.storage.storage_usage", "device_info.storage.total_space_gb", "device_info.storage.used_space_gb", "network_info.network_status", "network_info.iccid", "network_info.imei", "network_info.cell_id", "network_info.lac", "line_trigger_data[].children.female_in", "line_trigger_data[].children.female_out", "line_trigger_data[].children.in", "line_trigger_data[].children.male_in", "line_trigger_data[].children.male_out", "line_trigger_data[].children.out", "line_trigger_data[].group.in", "line_trigger_data[].group.out", "line_trigger_data[].staff.female_in", "line_trigger_data[].staff.female_out", "line_trigger_data[].staff.in", "line_trigger_data[].staff.male_in", "line_trigger_data[].staff.male_out", "line_trigger_data[].staff.out", "line_trigger_data[].total.female_in", "line_trigger_data[].total.female_out", "line_trigger_data[].total.in", "line_trigger_data[].total.male_in", "line_trigger_data[].total.male_out", "line_trigger_data[].total.out", "line_trigger_data[].line", "line_trigger_data[].line_name", "line_trigger_data[].line_uuid", "region_trigger_data.region_count_data[].total.current_female", "region_trigger_data.region_count_data[].total.current_male", "region_trigger_data.region_count_data[].total.current_total", "region_trigger_data.region_count_data[].children.current_female", "region_trigger_data.region_count_data[].children.current_male", "region_trigger_data.region_count_data[].children.current_total", "region_trigger_data.region_count_data[].staff.current_female", "region_trigger_data.region_count_data[].staff.current_male", "region_trigger_data.region_count_data[].staff.current_total", "region_trigger_data.region_count_data[].region", "region_trigger_data.region_count_data[].region_name", "region_trigger_data.region_count_data[].region_uuid", "region_trigger_data.dwell_time_data[].children", "region_trigger_data.dwell_time_data[].duration", "region_trigger_data.dwell_time_data[].dwell_end_time", "region_trigger_data.dwell_time_data[].dwell_start_time", "region_trigger_data.dwell_time_data[].people_id", "region_trigger_data.dwell_time_data[].region", "region_trigger_data.dwell_time_data[].region_name", "region_trigger_data.dwell_time_data[].region_uuid", "region_trigger_data.dwell_time_data[].gender", "region_trigger_data.dwell_time_data[].staff", "attention_region_trigger_data.region_attention_time_data[].region", "attention_region_trigger_data.region_attention_time_data[].region_uuid", "attention_region_trigger_data.region_attention_time_data[].children", "attention_region_trigger_data.region_attention_time_data[].attention_time_ms", "attention_region_trigger_data.region_attention_time_data[].people_id", "attention_region_trigger_data.region_attention_time_data[].gender", "attention_region_trigger_data.region_attention_time_data[].staff", "di_trigger_data.di_trigger_count", "di_trigger_data.di_trigger_event_name", "isRetransmission", "time_info.dst_status", "time_info.enable_dst", "time_info.time", "time_info.time_zone"],
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
