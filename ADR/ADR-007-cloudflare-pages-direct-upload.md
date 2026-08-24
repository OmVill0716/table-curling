# ADR-007: Cloudflare PagesへDirect Uploadする

- 状態: Accepted
- 決定日: 2026-08-23

## コンテキスト

このアプリはバックエンドを持たない静的SPAである。IssueではCloudflare側でビルドせず、`app/`でローカル生成した`app/dist/`を公開する方針としている。

## 決定

lockfileからローカルで依存関係を再現し、テストとVite buildが成功した`dist/`をCloudflare PagesのDirect Uploadで公開する。

```bash
cd app
npm ci
npx playwright install chromium webkit
npm run verify
npx wrangler pages deploy dist --project-name=<PROJECT_NAME>
```

上記の`dist/`は、リポジトリルートから見た`app/dist/`である。

本番デプロイ前の確認ゲート、デプロイ後検証、ロールバックは[`testing-and-deployment.md`](../docs/testing-and-deployment.md)に従う。

## 影響

- Cloudflare側のビルド環境に依存せず、検証済み成果物をそのまま公開できる
- Cloudflareアカウント、Pagesプロジェクト、production/previewの確認が運用上必要になる
- Direct UploadプロジェクトからGit Integrationへは後から切り替えられない
- 自動Gitデプロイが必要になった場合は新しいPagesプロジェクトと置換ADRが必要になる
- トップレベルの`404.html`を追加しない限り、Cloudflare Pagesの既定SPAフォールバックを利用できる

## 参照

- [Cloudflare Pages: Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Cloudflare Pages: Serving Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/)
