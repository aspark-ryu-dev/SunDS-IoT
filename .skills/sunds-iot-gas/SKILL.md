---
name: sunds-iot-gas
description: SunDS IoT の Google Apps Script プロジェクト（IoT-Data、IoT-Dashboard、Payload Codec、sample）を保守・改修するときに使う。Dashboard の公開読み取り専用化、IoT-Data 管理画面、Spreadsheet schema、device-examples 由来の JSON サンプル、日語 i18n 多層 key、GAS clasp 配布前確認に関する作業で使用する。
---

# SunDS IoT GAS

## 基本方針

- ユーザーとの会話は中国語または日本語で行い、英語で返答しない。
- `IoT-Data` は内部管理用。認証を置かず、デバイス、定義、Dashboard 背景、Layout、widget 指標、JSON サンプルを管理する。
- `IoT-Dashboard` は会社内部展示用の公開読み取り専用ページ。編集 UI、passcode、ドラッグ保存、追加・削除機能を置かない。
- 2D 背景画像マップを継続使用し、`sample` の React/ログイン/3D/iframe 地図は移植しない。デバイス一覧、検索、展開、状態表示の考え方だけ参考にする。
- UI 文案は日語を既定にし、多層 key の `I18N.ja...` から `t(path)` で取得する。

## 作業前確認

- まず `IoT-Data/README.md` と `IoT-Dashboard/README.md`、対象 `.gs` / `index.html` を読む。
- スキーマ変更では既存 Sheet データを壊さない。ヘッダーは不足列だけ追加し、既存列の並び替えや上書きを避ける。
- `IoT-Data` と `IoT-Dashboard` は別 GAS プロジェクトだが同じ Spreadsheet を読む。関数名の衝突はプロジェクト単位で判断する。
- デプロイや `push.bat` / `push.ps1` 実行はユーザーが明示したときだけ行う。

## 実装ルール

- `IoT-Data` 側で `Devices`、`Definitions`、`Config`、`Layout`、`Latest` を扱う管理 RPC を持たせる。
- `IoT-Dashboard` 側は `apiGetDashboardState()` の読み取りだけを公開し、`canEdit` を返さない。
- Dashboard widget の表示指標は `Layout.style` の JSON、例 `{"metrics":["temperature","humidity","battery"]}` に保存する。壊れた JSON は空設定として扱う。
- `Devices` の追加列は `area_id/location/type/sensor_type/power_source` を使う。旧列 `device_id/name/note/enabled/last_seen/first_seen` は維持する。
- `Latest` は `devices[].metrics = { metricName: { value, ts } }` に合成して UI に渡す。
- センサー送信 JSON サンプルは `IoT-Data/device-examples/milesight-lorawan/*.json` の key リストを参照する。`history[].temperature` のような配列パスは 1 件の配列オブジェクトとして生成する。

## 参照

- 詳細な境界と確認項目は `references/project-rules.md` を必要時に読む。

## Version Control

- 変更を実装して検証が通ったら、ユーザーが明示的に止めない限り、そのターン内で commit して GitHub へ push する。

- UI、RPC、schema、Config、deploy ID、表示ロジックを変更したら、同じ変更セットで `IoT-Data/Code.gs` と `IoT-Dashboard/Code.gs` の `BUILD_VERSION` を見直す。
- `BUILD_VERSION` は `vYYYY-MM-DD-short-scope` 形式にする。例: `v2026-05-21-logo-config-visible-metrics`。
- 片方だけを変更した場合も、もう片方の古い version 名が誤解を生まないか確認する。
- version 名には削除済み機能や古い仕様名を残さない。
- skill や rules を更新した場合は、`.skills/sunds-iot-gas/SKILL.md` と必要な `references/*.md` を同じコミットに含める。
