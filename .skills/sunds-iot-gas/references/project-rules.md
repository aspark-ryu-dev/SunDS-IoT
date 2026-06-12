# SunDS IoT GAS Project Rules

## Project Boundaries

- `IoT-Data`: backend ingestion endpoint and internal management UI.
- `IoT-Dashboard`: public read-only dashboard UI.
- `Payload Codec`: vendor codec reference assets.
- `sample`: reference UI/behavior only; do not migrate its React app, login, 3D map, or iframe map.

## Spreadsheet Ownership

- Shared Spreadsheet ID is defined in each project README and script properties.
- `IoT-Data` owns all runtime Spreadsheet writes and bootstrap for shared sheets.
- `IoT-Data` writes raw `Latest` values with `event/report_type/device_model`, history partitions, device heartbeats, and lightweight indexes.
- `IoT-Dashboard` is runtime read-only and reads `Devices`, `Latest`, `MetricMappings`, `Definitions`, `Config`, `Layout`, and `MeetingSamples`.
- Canonical mapping selection, derived expressions, Online/Offline state, card aggregation, and meeting timelines are Dashboard read-model responsibilities.
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
- Before every production deploy, push the affected project to GAS development and verify the real `/dev` page in a browser. Check the expected build, DOM, live data, and interaction rather than relying only on local parsing.
- Development URLs:
  - Data: `https://script.google.com/macros/s/AKfycbzUVYcbc_yx6PI5B-0jLanpukdWK2GilcjJJZsli25M/dev`
  - Dashboard: `https://script.google.com/macros/s/AKfycbyTqs5iBRp2Ri6J5X3ZMNVNnX-i4pcPKJLRqB1tQt0/dev`
- Never deploy after a failed `/dev` verification. Fix, push again, and re-check until the development page passes.
- Use project-specific `npm.cmd run gas:deploy:data -- "<summary>"` or `npm.cmd run gas:deploy:dashboard -- "<summary>"` for production.
- Production deploy requires a clean `master` with `HEAD == origin/master`.
- Successful production deploys must create and push `gas-data-v<N>` or `gas-dashboard-v<N>` tags matching the GAS deployment version.
- Runtime logs and npm cache belong under `.local/`; do not add root-level log files or duplicate PowerShell/batch wrappers.
- Follow the requested release sequence: development push, browser verification on `/dev`, then production deploy.
- Keep `BUILD_VERSION` current. Any UI/RPC/schema/Config/deploy-visible change must update the relevant `IoT-Data/Code.gs` or `IoT-Dashboard/Code.gs` version using `vYYYY-MM-DD-short-scope`.
