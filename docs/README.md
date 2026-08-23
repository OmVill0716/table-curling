# Table Curling ドキュメント

- 状態: Accepted（MVP仕様確定）

## 文書の位置づけ

- [`table-curling-react-cloudflare-issue.md`](../table-curling-react-cloudflare-issue.md): 要求の原典。目的、スコープ、受け入れ条件を管理する
- [`game-specification.md`](./game-specification.md): 実装時に曖昧さが出ないゲーム仕様
- [`architecture.md`](./architecture.md): React、Zustand、Physics、Rendererの責務とデータフロー
- [`testing-and-deployment.md`](./testing-and-deployment.md): 検証方法、Cloudflare Pagesへの公開手順、ロールバック
- [`ADR/`](../ADR/README.md): 重要な技術判断と、その理由・影響

要求を変更するときはIssueを先に更新する。実装上の数値や動作を変更するときはゲーム仕様を更新し、重要な設計判断を変更するときは既存ADRを書き換えず、新しいADRで置き換える。

## 確定したMVPの概要

- 600 × 1500のPhysics Worldを、通常600 × 1000相当のHTML Canvas表示窓へ描画する
- 投射方向はターゲット中心へ固定し、長押し中に往復するPowerを離すタイミングで強度を決める
- 1ゲーム5投とし、各投射後はボタン操作で次の投射またはResultへ進む
- 物理演算は1/120秒の固定タイムステップで更新する
- Surface差はMatter.jsの`frictionAir`で表現し、プレイテストで調整する
- 反射壁は設けず、四辺のいずれかから出たストーンは0点とする
- 全5投終了時のストーン中心座標で最終得点を計算する
- 投射、衝突、停止、コースアウトに効果音を付け、TOPからON/OFFを選べるようにする
- 効果音には選定済みのKenney CC0素材をOgg Vorbisのまま同梱する
- ページが一時的に非表示の間はゲームを停止し、再表示時に安全に再開する
- Game Screenは縦画面で上下配置、横画面・広い画面で左右配置とし、Canvasの`3:5`を維持する
- Canvasの描画倍率は`devicePixelRatio`を反映しつつ最大2に制限する
- Animation Frameは`charging`と`moving`だけ継続し、静止状態では必要時に1回だけ描画する
- Pointerとキーボードで同じ操作を提供し、動きを減らす設定では装飾的なアニメーションだけを抑制する
- 遊び方はTOPから任意に開く静的画面とし、強制チュートリアルや既読保存を設けない
- PCのChrome・Edge・Safariと、Android版Chrome・iOS版Safariの現行安定版を正式サポートする
- Physicsパラメータはproductionアプリへ調整画面を設けず、StorybookのCalibration Storyで比較・調整する
- ビルド済みの`dist/`をCloudflare PagesへDirect Uploadする

## ADR一覧

| ADR | 状態 | 判断 |
| --- | --- | --- |
| [ADR-001](../ADR/ADR-001-use-html-canvas.md) | Accepted | 盤面描画にHTML Canvasを使う |
| [ADR-002](../ADR/ADR-002-fixed-timestep-physics.md) | Accepted | Physicsを固定タイムステップで更新する |
| [ADR-003](../ADR/ADR-003-use-round-hold-shot-button.md) | Superseded | 円形の投射ボタンを長押ししてPowerを決める |
| [ADR-004](../ADR/ADR-004-board-boundaries.md) | Superseded | 左右は反射し、ターゲット奥側と投射側は盤外とする |
| [ADR-005](../ADR/ADR-005-score-by-stone-center.md) | Superseded | ストーンの中心座標で採点する |
| [ADR-006](../ADR/ADR-006-runtime-state-ownership.md) | Accepted | 高頻度状態をPhysics Runtimeが所有する |
| [ADR-007](../ADR/ADR-007-cloudflare-pages-direct-upload.md) | Accepted | Cloudflare PagesへDirect Uploadする |
| [ADR-008](../ADR/ADR-008-use-matter-js.md) | Accepted | Physics EngineにMatter.jsを使う |
| [ADR-009](../ADR/ADR-009-use-state-based-screen-flow.md) | Superseded | URL Routingを使わず状態で画面を切り替える |
| [ADR-010](../ADR/ADR-010-store-category-high-scores-locally.md) | Accepted | カテゴリー別ハイスコアをlocalStorageへ保存する |
| [ADR-011](../ADR/ADR-011-use-vitest-storybook-and-playwright.md) | Accepted | Vitest、Storybook、Playwrightでテストを分担する |
| [ADR-012](../ADR/ADR-012-do-not-add-ci.md) | Accepted | CIを導入せずローカルで検証する |
| [ADR-013](../ADR/ADR-013-use-oscillating-power-gauge.md) | Accepted | Powerを最小値と最大値の間で往復させる |
| [ADR-014](../ADR/ADR-014-use-out-of-bounds-on-all-edges.md) | Accepted | 反射壁を設けず四辺を盤外とする |
| [ADR-015](../ADR/ADR-015-separate-physics-world-and-viewport.md) | Accepted | Physics Worldと表示窓を分離する |
| [ADR-016](../ADR/ADR-016-require-manual-advance-after-each-shot.md) | Accepted | 各投射後の進行をボタン操作にする |
| [ADR-017](../ADR/ADR-017-use-top-and-retire-flow.md) | Superseded | TOPを入口とし未完了ゲームにリタイアを設ける |
| [ADR-018](../ADR/ADR-018-show-score-numbers-only-in-result.md) | Superseded | プレイ中は得点色だけを変え数値はResultで表示する |
| [ADR-019](../ADR/ADR-019-separate-menu-screens-and-game-phase.md) | Accepted | メニュー画面を分割しScreenとGamePhaseを分離する |
| [ADR-020](../ADR/ADR-020-add-sound-effects-with-user-setting.md) | Accepted | 効果音とON/OFF設定をMVPへ追加する |
| [ADR-021](../ADR/ADR-021-pause-while-page-is-hidden.md) | Accepted | ページ非表示中はゲームを自動停止する |
| [ADR-022](../ADR/ADR-022-use-responsive-game-layout.md) | Accepted | Game Screenを縦配置と横配置へレスポンシブに切り替える |
| [ADR-023](../ADR/ADR-023-show-colored-score-labels-on-target.md) | Accepted | ターゲットに得点色付きの固定配点を表示する |
| [ADR-024](../ADR/ADR-024-calibrate-physics-in-storybook.md) | Accepted | PhysicsパラメータをStorybookで調整する |
| [ADR-025](../ADR/ADR-025-bundle-selected-kenney-sound-effects.md) | Accepted | 選定したKenney効果音をOggで同梱する |
| [ADR-026](../ADR/ADR-026-limit-stone-collision-bell-playback.md) | Accepted | ストーン衝突の鐘を間引いて再生する |
| [ADR-027](../ADR/ADR-027-preload-audio-without-blocking-gameplay.md) | Accepted | 効果音を事前読み込みしゲーム進行を待たせない |
| [ADR-028](../ADR/ADR-028-support-current-major-browsers.md) | Accepted | 現行安定版の主要ブラウザを正式サポートする |
| [ADR-029](../ADR/ADR-029-cap-canvas-pixel-ratio-at-two.md) | Accepted | Canvasの描画倍率を最大2に制限する |
| [ADR-030](../ADR/ADR-030-run-animation-frames-only-while-active.md) | Accepted | 動的なGamePhaseだけAnimation Frameを継続する |
| [ADR-031](../ADR/ADR-031-support-pointer-keyboard-and-reduced-motion.md) | Accepted | Pointerとキーボード操作を提供し装飾的な動きを抑制する |
| [ADR-032](../ADR/ADR-032-use-optional-static-how-to-play-screen.md) | Accepted | 任意に開く静的な遊び方画面を設ける |
