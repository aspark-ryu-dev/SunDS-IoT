# SunDS IoT GAS Project Rules

## Project Boundaries

- `IoT-Data`: backend ingestion endpoint and internal management UI.
- `IoT-Dashboard`: public read-only dashboard UI.
- `Payload Codec`: vendor codec reference assets.
- `sample`: reference UI/behavior only; do not migrate its React app, login, 3D map, or iframe map.

## Spreadsheet Ownership

- Shared Spreadsheet ID is defined in each project README and script properties.
- `IoT-Data` owns bootstrap for `Readings`, `Latest`, `Devices`, `Definitions`, `Config`, and `Layout`.
- `IoT-Dashboard` reads `Devices`, `Latest`, `Config`, and `Layout`.
- Schema migrations must append missing headers only.

## UI and i18n

- Default visible UI language is Japanese.
- Use nested translation keys such as `I18N.ja.data.devices.title` and `I18N.ja.dashboard.status.noMetric`.
- Keep code identifiers practical; visible labels should go through `t(path)` where feasible.

## Dashboard

- Dashboard is public and read-only.
- Do not add edit passcodes, hidden edit buttons, drag-save behavior, or write RPCs.
- Keep the 2D floor-plan image as the main map.
- Widget metrics come from `Layout.style` JSON.

## Device Examples

- `IoT-Data/device-examples/milesight-lorawan/*.json` files are model-to-key-list references.
- Generate sample POST JSON by filling listed scalar keys with sample values.
- For array notation such as `history[].humidity`, generate one object inside the `history` array.

## Deployment

- Do not run `push.bat`, `push.ps1`, `clasp push`, or deploy commands unless the user explicitly asks.
- If push/deploy is requested, inspect the changed files first and summarize the scope in Chinese or Japanese.
