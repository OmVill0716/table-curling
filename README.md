# Table Curling

React、Zustand、Matter.js、HTML Canvasで実装する、1人用のテーブルカーリング風ブラウザゲーム。

## ドキュメント

- [Issue](./table-curling-react-cloudflare-issue.md): 目的、スコープ、受け入れ条件
- [MVP仕様と設計](./docs/README.md): 確定仕様、アーキテクチャ、検証・デプロイ計画
- [ADR](./ADR/README.md): 重要な設計判断と置換履歴

## 開発開始

アプリ本体と開発環境は`app/`に自己完結している。

```bash
cd app
npm ci
npx playwright install chromium webkit
npm run dev
```

全検証は同じディレクトリで実行する。

```bash
npm run verify
```

各コマンドと成果物は[アプリREADME](./app/README.md)を参照する。

Phase 1の開発・テスト環境、Phase 2のPhysics基盤・調整、Phase 3の全画面・画面遷移まで実装済み。Physicsと画面を接続する5投のゲーム進行はPhase 4で実装する。
