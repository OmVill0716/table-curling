# ADR-011: Vitest、Storybook、Playwrightでテストを分担する

- 状態: Accepted
- 決定日: 2026-08-23

## コンテキスト

このアプリには、採点などの純粋ロジック、MUIコンポーネント、Matter.jsを含むCanvasゲーム全体という異なるテスト対象がある。1つのテスト方式だけでは、実行速度、UI状態の確認、実ブラウザでの操作を適切にカバーしにくい。

ViteベースのStorybookでは、StoryをVitest Browser Modeのコンポーネントテストへ変換する公式Vitest Addonを利用できる。

## 決定

- Vitestを単体・結合テストのTest Runnerとして使う
- Storybookは`@storybook/react-vite`で構築する
- Storybookのコンポーネントテストには`@storybook/addon-vitest`を使う
- Storyの`play`関数で表示状態とユーザー操作をテストする
- React Testing Libraryを独立した主要テスト層にはせず、Storybookのブラウザテストでユーザー操作ベースのAPIを利用する
- Playwright Testでアプリ全体のE2Eを実行する
- StorybookテストとE2Eは役割を分け、同じシナリオを全面的に重複させない
- Storybookの静的成果物`storybook-static/`はCloudflare Pagesへの公開対象に含めない

## テスト対象

| 層 | 主な対象 |
| --- | --- |
| Vitest | Scoring、High Score、Store、Matter Adapter、ゲーム固有ルール |
| Storybook + Vitest Addon | 投射ボタン、Power Gauge、ScoreBoard、Surface・距離選択、Result表示 |
| Playwright E2E | ゲーム開始、長押し、5投、Result、Retry、localStorage、レスポンシブ |

## 影響

- Viteの設定と変換処理をテストでも共有できる
- UIの状態をStoryとして一覧化し、ブラウザ上で確認・デバッグできる
- PlaywrightによりCanvas、Pointer Events、画面遷移を実ブラウザで検証できる
- Storybook Browser TestとE2Eの両方でPlaywright用ブラウザのインストールが必要になる
- テスト設定が3層になるため、ローカルで迷わず実行できるnpm scriptsを用意する必要がある

## 参照

- [Vitest: Why Vitest](https://vitest.dev/guide/why.html)
- [Storybook: Vitest Addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon/index)
- [Playwright: Browsers](https://playwright.dev/docs/browsers)
