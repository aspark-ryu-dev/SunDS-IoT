# IoT-Dashboard (frontend)

Public read-only GAS dashboard for the shared IoT spreadsheet. It renders the
2D floor-plan background image and device widgets configured by `IoT-Data`.

- scriptId: `1IhaA3TwU0xKA5VBKcVfPNe-nC4Nq0m___k1ewEtb5uA_W-abEbpbcydC`
- Shared Spreadsheet: `1HZwK5W8Yhd15sNypNO9Ydfx4G0NSehvEoTm8ZmKRygE`

## One-time setup

> Run **IoT-Data**'s `setup()` first because IoT-Data owns the shared sheets.

1. Set script property `SPREADSHEET_ID`.
2. Run `setup()` once from the Apps Script editor. It is idempotent.
3. Deploy as a Web App when intentionally publishing a new version.

## Runtime behavior

- No authentication.
- No edit mode.
- No write RPCs.
- `apiGetDashboardState()` reads `Config`, `Layout`, `Devices`, and `Latest`.
- `Layout.style` may contain JSON such as `{"metrics":["temperature","humidity","battery"]}`.
- Browser `localStorage` keeps a small cached dashboard state for fast initial rendering.

## Files

| File | Purpose |
|---|---|
| `Code.gs` | entry point |
| `schema.gs` | shared sheet accessors |
| `config.gs` | `Config` sheet accessors |
| `setup.gs` | idempotent bootstrap |
| `dashboard.gs` | public read-only dashboard state |
| `index.html` | Japanese read-only 2D map UI |
