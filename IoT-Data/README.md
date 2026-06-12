# IoT-Data (backend / admin)

Backend GAS project for the IoT dashboard. It owns the HTTP POST ingestion
endpoint (`doPost`) and the internal management UI for devices, definitions,
dashboard background, layout widgets, and JSON payload samples.

- scriptId: `1dSt68BEWPDP69YRiVSA4APyRF5Ppqetj57My3eiGAx8rDjKTlXFu41Xy`
- Shared Spreadsheet: `1HZwK5W8Yhd15sNypNO9Ydfx4G0NSehvEoTm8ZmKRygE`

## One-time setup

1. Set script property `SPREADSHEET_ID`.
2. Run `setup()` once from the Apps Script editor. It is idempotent.
3. Push/deploy only when intentionally syncing to Apps Script.

`setup()` creates or upgrades these sheets without destroying existing data:
`Readings`, `Latest`, `CanonicalLatest`, `Devices`, `Definitions`,
`KeyCatalog`, `MetricMappings`, `MeetingEvents`, `Config`, `Layout`.

`Latest` keeps received raw metric names plus the latest
`event/report_type/device_model` context. Dashboard compiles canonical keys and
derived definitions at read time. `CanonicalLatest` remains as a compatibility
index for administration and older deployments, but device POST does not need
to update it synchronously.

Unknown keys are discovered from `Latest` by the five-minute mapping task, so
mapping work does not block device POST. Configure `GEMINI_API_KEY` in Script
Properties to enable AI analysis. The optional `GEMINI_MODEL` property defaults
to `gemini-3.5-flash`.

The POST path owns all Spreadsheet writes: device heartbeat, raw `Latest`,
history partitions, and lightweight `MeetingSamples`. Display aggregation,
canonical mapping selection, derived expressions, Online/Offline state, and
meeting-room timelines are computed by IoT-Dashboard.

The admin UI is intentionally unauthenticated for internal use. Keep the Web App
URL private.

## Device POST contract

Devices push JSON to the Web App `/exec` URL. Token validation is intentionally
disabled for device-platform webhooks.

A device identifier is required. LoRaWAN IDs are prioritized first (`devEUI`,
`dev_eui`, `device_eui`, `eui`), normal serial identifiers come next (`SN`,
`serial`, `serial_number`), and generic fallbacks such as `device_id`, `imei`,
`mac`, and `id` are checked last.

The ingestion parser skips common platform metadata such as `applicationID`,
`deviceName`, `gatewayTime`, `fPort`, `rssi`, and `snr`. Decoded payload wrapper
keys such as `uplink_message.decoded_payload`, `decoded_payload`, `object`,
`payload_fields`, and `data` are supported.

```bash
curl -X POST "https://script.google.com/.../exec" \
     -H "Content-Type: application/json" \
     -d '{"devEUI":"24e124136d391334","deviceName":"EM300-TH","humidity":49,"temperature":26.3}'
```

## Device example library

`device-examples/milesight-lorawan/` contains per-model decoded key lists
extracted from vendor README examples. `device-examples/milesight-poe/`
contains HTTP/MQTT JSON key lists for PoE people-counting sensors such as
VS121-P and VS125-P. The admin UI uses a curated runtime map based on these
files to generate sample POST JSON.

## Files

| File | Purpose |
|---|---|
| `Code.gs` | entry point |
| `schema.gs` | sheet names, headers, non-destructive header upgrades |
| `config.gs` | `Config` sheet accessors |
| `setup.gs` | idempotent bootstrap |
| `ingest.gs` | `doPost` ingestion endpoint |
| `defs.gs` | admin RPCs, device registry, dashboard layout, examples, definitions |
| `expr.gs` | safe arithmetic expression evaluator |
| `index.html` | internal Japanese admin UI |
