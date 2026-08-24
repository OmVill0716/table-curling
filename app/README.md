# Table Curling App

Table Curlingの静的React SPA本体。依存関係、公開素材、開発設定、テストはこのディレクトリ内で管理する。

## 前提環境

`package.json`のVolta設定により、Node.js `24.19.0`とnpm `12.0.2`を固定している。

初回セットアップでは、依存関係とPlaywrightが使うブラウザを取得する。

```bash
npm ci
npx playwright install chromium webkit
```

## 開発

```bash
npm run dev
```

Storybookでコンポーネントを確認・調整する場合は、次を実行する。

```bash
npm run storybook
```

## 検証

すべての検証をまとめて実行する。

```bash
npm run verify
```

個別に実行する場合は次のscriptsを使う。

```bash
npm run lint
npm run test:unit
npm run test:storybook
npm run build
npm run test:e2e
npm run build-storybook
```

production buildは`dist/`、Storybook buildは`storybook-static/`へ生成される。Cloudflare Pagesへ公開するのは`dist/`だけである。

Phase 3までに全画面、Zustandによる画面遷移、Game Screenのレスポンシブな外枠を実装している。Game ScreenとPhysics Runtimeの接続、投射、5投の進行、採点はPhase 4で実装する。
