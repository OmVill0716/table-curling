# ADR-012: CIを導入せずローカルで検証する

- 状態: Accepted
- 決定日: 2026-08-23

## コンテキスト

GitHubをソースコード管理に利用しているため、GitHub ActionsでLint、テスト、Storybook build、Vite buildを自動実行することは可能である。一方、このプロジェクトは学習用であり、チーム開発や継続的なリリース運用を目的としていない。

CIを導入するとWorkflow、実行環境、Playwright Browser、キャッシュ、失敗通知などの設定と保守が新たに必要になる。

## 決定

- GitHub ActionsなどのCIはMVPへ導入しない
- Lint、Vitest、Storybookテスト、Playwright E2E、Vite buildはローカルで手動実行する
- Cloudflare Pagesへのデプロイも、確認ゲート通過後にローカルから手動実行する
- 検証手順はnpm scriptsへ統一し、実行結果をデプロイ前に確認する

## 影響

- 学習対象をアプリとゲーム実装へ集中できる
- pushやPull Requestだけでは品質チェックが実行されない
- デプロイ担当者が毎回ローカル検証を実行する必要がある
- 複数人開発や継続運用へ移行する場合は、CI導入を新しいADRで検討する
