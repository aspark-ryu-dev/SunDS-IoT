# SunDS IoT

Google Apps Script で運用する社内 IoT 表示システムです。

- `IoT-Data`: デバイス受信・管理画面
- `IoT-Dashboard`: 公開読み取り専用 Dashboard
- `shared`: 両 GAS プロジェクトの共有コード

## Version Management

GitHub の `master` をソースコードの正本とします。

- 通常の変更: commit → GitHub push
- GAS 開発環境へ同期: `npm.cmd run gas:push`
- 本番反映: 対象別の `npm.cmd run gas:deploy:*`
- 本番 deploy 成功後: GAS version と同じ番号の Git tag を自動作成

Tag:

```text
gas-data-v35
gas-dashboard-v27
```

各 tag は「どの Git commit が、どの GAS deployment version として公開されたか」を示します。

## Commands

```powershell
npm.cmd run gas:status
npm.cmd run gas:push
npm.cmd run gas:push:data
npm.cmd run gas:push:dashboard
npm.cmd run gas:deploy:data -- "Storage V2"
npm.cmd run gas:deploy:dashboard -- "Storage V2"
```

`deploy` は次を満たさない場合に停止します。

1. Git working tree が clean
2. 現在 branch が `master`
3. `HEAD` と `origin/master` が一致
4. 対象 project の `BUILD_VERSION` が設定済み

実行ログと npm cache は `.local/` に保存され、Git 管理対象には入りません。

## Release Flow

1. コード変更とテスト
2. `BUILD_VERSION` 更新
3. Git commit / push
4. `npm.cmd run gas:status`
5. `npm.cmd run gas:deploy:data -- "<summary>"`
6. `npm.cmd run gas:deploy:dashboard -- "<summary>"`

Data と Dashboard は独立 deployment です。片方だけ変更した場合は、その project だけ deploy します。
