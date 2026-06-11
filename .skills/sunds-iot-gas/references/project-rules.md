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

- After code changes are implemented and checks pass, commit and push to GitHub by default unless the user explicitly says not to.
- GitHub `master` is the source of truth. Do not leave GAS-editor-only changes.
- Use root `npm.cmd run gas:push` for development synchronization.
- Use project-specific `npm.cmd run gas:deploy:data -- "<summary>"` or `npm.cmd run gas:deploy:dashboard -- "<summary>"` for production.
- Production deploy requires a clean `master` with `HEAD == origin/master`.
- Successful production deploys must create and push `gas-data-v<N>` or `gas-dashboard-v<N>` tags matching the GAS deployment version.
- Runtime logs and npm cache belong under `.local/`; do not add root-level log files or duplicate PowerShell/batch wrappers.
- Do not run `clasp push` or production deploy commands unless the user explicitly asks.
- Keep `BUILD_VERSION` current. Any UI/RPC/schema/Config/deploy-visible change must update the relevant `IoT-Data/Code.gs` or `IoT-Dashboard/Code.gs` version using `vYYYY-MM-DD-short-scope`.
