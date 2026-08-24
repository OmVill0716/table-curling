# Architecture Decision Records

## 目的

ADRは、Table Curlingの重要な設計判断について、背景、決定、影響、置換履歴を記録する。

- [`table-curling-react-cloudflare-issue.md`](../table-curling-react-cloudflare-issue.md): 何を実現するかという要求の原典
- [`docs/specifications/`](../docs/specifications/README.md): MVPが満たす具体的な動作と数値の正本
- [`docs/architecture.md`](../docs/architecture.md): 現在の責務分割とデータフロー
- `ADR/`: なぜその方式を選んだかという判断の記録

実装時は、まず目的に対応するAccepted ADRを確認し、具体的な動作と数値はリンク先の仕様書を参照する。Superseded ADRは過去の経緯を確認する場合だけ使用し、現行判断として実装しない。

## 現行ADR

### ゲームルール・進行

関連仕様: [`game-rules.md`](../docs/specifications/game-rules.md)

| ADR | 判断 |
| --- | --- |
| [ADR-016](./ADR-016-require-manual-advance-after-each-shot.md) | 各投射後の進行をボタン操作にする |
| [ADR-023](./ADR-023-show-colored-score-labels-on-target.md) | ターゲットに得点色付きの固定配点を表示する |

### 座標・描画・描画性能

関連仕様: [`coordinates-and-rendering.md`](../docs/specifications/coordinates-and-rendering.md)

| ADR | 判断 |
| --- | --- |
| [ADR-001](./ADR-001-use-html-canvas.md) | 盤面描画にHTML Canvasを使う |
| [ADR-015](./ADR-015-separate-physics-world-and-viewport.md) | Physics Worldと表示窓を分離する |
| [ADR-022](./ADR-022-use-responsive-game-layout.md) | Game Screenを縦配置と横配置へレスポンシブに切り替える |
| [ADR-029](./ADR-029-cap-canvas-pixel-ratio-at-two.md) | Canvasの描画倍率を最大2に制限する |
| [ADR-030](./ADR-030-run-animation-frames-only-while-active.md) | 動的なGamePhaseだけAnimation Frameを継続する |

### 物理演算・調整

関連仕様: [`physics.md`](../docs/specifications/physics.md)

| ADR | 判断 |
| --- | --- |
| [ADR-002](./ADR-002-fixed-timestep-physics.md) | Physicsを固定タイムステップで更新する |
| [ADR-008](./ADR-008-use-matter-js.md) | Physics EngineにMatter.jsを使う |
| [ADR-014](./ADR-014-use-out-of-bounds-on-all-edges.md) | 反射壁を設けず四辺を盤外とする |
| [ADR-024](./ADR-024-calibrate-physics-in-storybook.md) | PhysicsパラメータをStorybookで調整する |

### 画面遷移・入力・アクセシビリティ

関連仕様: [`screen-flow-and-input.md`](../docs/specifications/screen-flow-and-input.md)

| ADR | 判断 |
| --- | --- |
| [ADR-013](./ADR-013-use-oscillating-power-gauge.md) | Powerを最小値と最大値の間で往復させる |
| [ADR-019](./ADR-019-separate-menu-screens-and-game-phase.md) | メニュー画面を分割しScreenとGamePhaseを分離する |
| [ADR-021](./ADR-021-pause-while-page-is-hidden.md) | ページ非表示中はゲームを自動停止する |
| [ADR-031](./ADR-031-support-pointer-keyboard-and-reduced-motion.md) | Pointerとキーボード操作を提供し装飾的な動きを抑制する |
| [ADR-032](./ADR-032-use-optional-static-how-to-play-screen.md) | 任意に開く静的な遊び方画面を設ける |

### 状態管理・データ保存

関連仕様: [`persistence.md`](../docs/specifications/persistence.md)、[`architecture.md`](../docs/architecture.md)

| ADR | 判断 |
| --- | --- |
| [ADR-006](./ADR-006-runtime-state-ownership.md) | 高頻度状態をPhysics Runtimeが所有する |
| [ADR-010](./ADR-010-store-category-high-scores-locally.md) | カテゴリー別ハイスコアをlocalStorageへ保存する |

### 音声

関連仕様: [`audio.md`](../docs/specifications/audio.md)

| ADR | 判断 |
| --- | --- |
| [ADR-020](./ADR-020-add-sound-effects-with-user-setting.md) | 効果音とON/OFF設定をMVPへ追加する |
| [ADR-025](./ADR-025-bundle-selected-kenney-sound-effects.md) | 選定したKenney効果音をOggで同梱する |
| [ADR-026](./ADR-026-limit-stone-collision-bell-playback.md) | ストーン衝突の鐘を間引いて再生する |
| [ADR-027](./ADR-027-preload-audio-without-blocking-gameplay.md) | 効果音を事前読み込みしゲーム進行を待たせない |

### テスト・配信・対応環境

関連文書: [`testing-and-deployment.md`](../docs/testing-and-deployment.md)

| ADR | 判断 |
| --- | --- |
| [ADR-007](./ADR-007-cloudflare-pages-direct-upload.md) | Cloudflare PagesへDirect Uploadする |
| [ADR-011](./ADR-011-use-vitest-storybook-and-playwright.md) | Vitest、Storybook、Playwrightでテストを分担する |
| [ADR-012](./ADR-012-do-not-add-ci.md) | CIを導入せずローカルで検証する |
| [ADR-028](./ADR-028-support-current-major-browsers.md) | 現行安定版の主要ブラウザを正式サポートする |

## 置換履歴

次のADRはSupersededであり、現行実装では置換先のAccepted ADRを使用する。

| 旧ADR | 直接の置換先 | 変更内容 |
| --- | --- | --- |
| [ADR-003](./ADR-003-use-round-hold-shot-button.md) | [ADR-013](./ADR-013-use-oscillating-power-gauge.md) | Powerを単調増加から往復へ変更 |
| [ADR-004](./ADR-004-board-boundaries.md) | [ADR-014](./ADR-014-use-out-of-bounds-on-all-edges.md) | 左右反射を廃止し、四辺を盤外へ変更 |
| [ADR-005](./ADR-005-score-by-stone-center.md) | [ADR-018](./ADR-018-show-score-numbers-only-in-result.md) | 中心採点を維持し、プレイ中とResultの表示を明確化 |
| [ADR-009](./ADR-009-use-state-based-screen-flow.md) | [ADR-017](./ADR-017-use-top-and-retire-flow.md) | Stage SelectをTOPへ変更し、リタイアを追加 |
| [ADR-017](./ADR-017-use-top-and-retire-flow.md) | [ADR-019](./ADR-019-separate-menu-screens-and-game-phase.md) | メニューを分割し、ScreenとGamePhaseを分離 |
| [ADR-018](./ADR-018-show-score-numbers-only-in-result.md) | [ADR-023](./ADR-023-show-colored-score-labels-on-target.md) | ストーン得点を伏せたまま、ターゲットの固定配点を追加 |

置換チェーンの現行判断は次のとおり。

```text
ADR-003 → ADR-013
ADR-004 → ADR-014
ADR-005 → ADR-018 → ADR-023
ADR-009 → ADR-017 → ADR-019
```

## 状態

| 状態 | 意味 |
| --- | --- |
| `Proposed` | 提案中であり、まだ実装判断として確定していない |
| `Accepted` | 現行の実装判断として採用している |
| `Deprecated` | 利用を推奨しないが、直接の置換先を定めていない |
| `Superseded` | 新しいADRによって置き換えられた |

## 追加・更新ルール

- ファイル名は`ADR-NNN-short-title.md`とし、3桁の連番を使う
- 新しい番号は既存ADRの最大番号に1を加える
- 判断を変更するときは既存ADRの決定本文を書き換えず、新しいADRを追加する
- 旧ADRを`Superseded`へ変更し、`置換先`を追加する
- 新ADRへ`置換対象`を追加する
- このREADMEの現行ADRと置換履歴を更新する
- 誤字、リンク切れ、正本への参照変更など、判断を変えない修正は既存ADRへ直接行ってよい

## テンプレート

```markdown
# ADR-NNN: タイトル

- 状態: Proposed
- 決定日: YYYY-MM-DD

## コンテキスト

## 決定

## 影響
```
