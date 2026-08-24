# ADR-033: 単一の静的SPAをapp配下へ自己完結させる

- 状態: Accepted
- 決定日: 2026-08-24

## コンテキスト

このリポジトリは、要求、ADR、仕様書、設計書と、これから実装するTable Curling本体を同時に管理する。アプリ本体をリポジトリ直下へ置くと、ドキュメントとNode.js用の依存関係・設定・生成物が同じ階層に混在する。

一方、`apps/table-curling/`のように複数アプリを前提とした階層を作ると、単一アプリである現在の構成ではリポジトリ名とアプリ名が重複する。このゲームはバックエンド、サーバー保存、Cloudflare Workers、D1、R2、サーバーAPIを持たない完全な静的SPAとして要求が確定している。

したがって、現在必要な単一アプリの境界と、npmコマンド・公開素材・テスト設定の基準位置を明確にする必要がある。

## 決定

- 単一のTable Curlingアプリ本体を`app/`へ配置する
- リポジトリルートはIssue、ADR、仕様書、設計書などプロジェクト全体の文書を管理する
- 次を`app/`へ自己完結させる
  - `package.json`
  - `package-lock.json`
  - `.npmrc`
  - `src/`
  - `public/`
  - `.storybook/`
  - `e2e/`
  - Vite、TypeScript、ESLint、Vitest、Storybook、Playwrightの設定
- リポジトリルートに`package.json`と`package-lock.json`を置かない
- npm workspaceを使用しない
- npmコマンドは`app/`を作業ディレクトリとして実行する
- アプリの`package.json`は`name: table-curling`、`private: true`とする
- 既存の`public/audio/`を`app/public/audio/`へ移し、公開URLの`/audio/*`は維持する
- Cloudflare PagesへViteの静的成果物だけをDirect Uploadする
- Pages Functions、Cloudflare Workers、サーバーAPI、D1、R2をアプリへ追加しない
- 永続化は[ADR-010](./ADR-010-store-category-high-scores-locally.md)で確定したブラウザの`localStorage`だけを使用する
- 将来バックエンドが必要になった場合は、通常の機能追加として現在の構成へ継ぎ足さない
- 将来のバックエンド導入は、このADRと必要な関連ADRを置き換え、ディレクトリ構成、配信方式、保存方式、テスト境界を見直す大規模リファクタリングとして計画する

## 影響

- ドキュメントと実行可能なアプリの境界が明確になる
- `table-curling/apps/table-curling`という名前の重複を避けられる
- 依存関係、lockfile、テスト設定、生成物の影響範囲を`app/`に限定できる
- npmコマンドを実行するときは、先に`app/`へ移動する必要がある
- Vite buildの成果物は`app/dist/`、Storybook buildの成果物は`app/storybook-static/`に生成される
- 音声素材のリポジトリ内パスは変わるが、ブラウザから取得する`/audio/*`は変わらない
- 複数のデプロイ可能アプリやバックエンドを同じ構成へ段階的に追加する余地は設けない
- バックエンドが必要になった時点で、影響範囲を明示した置換ADRと移行計画が必要になる

## 参照

- [Issue: 今回実装しないもの](../table-curling-react-cloudflare-issue.md#今回実装しないもの)
- [Issue: Cloudflare利用範囲](../table-curling-react-cloudflare-issue.md#cloudflare利用範囲)
- [ADR-007: Cloudflare PagesへDirect Uploadする](./ADR-007-cloudflare-pages-direct-upload.md)
- [モジュール構成設計](../docs/design/module-structure.md)
