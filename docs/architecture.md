# アーキテクチャ

- 状態: Accepted（関連ADRで確定）

## 目的

Reactの再レンダリングをゲームループに使わず、UI状態、高頻度Physics状態、描画を分離する。Matter.jsはAdapter内へ閉じ込め、Scoringとゲーム固有ルールはブラウザAPIに依存しない純粋TypeScriptとして単体テスト可能にする。

## 責務

| レイヤー | 責務 | 持たないもの |
| --- | --- | --- |
| React | Screen構成、MUI、入力イベント、Runtimeの生成・破棄 | 物理計算、フレームごとの座標state |
| Zustand | Surface、UI状態、投数、確定結果などゲームとして意味のある状態 | 毎フレームの座標・速度 |
| Matter Adapter | Engine・Bodyの生成と更新、Surface設定、盤外・停止判定 | DOM、Canvas、Zustand |
| Physics Runtime | accumulator、Matter Engine、Body対応表、`requestAnimationFrame`の進行 | React UIの描画 |
| Renderer | RuntimeのスナップショットをCamera変換してCanvasへ描画 | 状態遷移、物理計算 |
| Scoring | 最終Stone位置から個別得点と合計を計算 | Store更新、画面表示 |
| Audio Adapter | ゲームイベントに対応する効果音の読み込み・再生・停止 | ゲーム進行、Physics、採点 |

Rendererは[ADR-029](../ADR/ADR-029-cap-canvas-pixel-ratio-at-two.md)に従い、CSS表示サイズ、Cameraが扱う論理表示サイズ、Canvas内部ピクセルサイズを分離する。描画倍率は`min(devicePixelRatio, 2)`とし、描画コンテキストの変換だけへ反映する。リサイズ時に描画バッファを再設定してもPhysics Runtimeは維持する。

入力と動きの扱いは[ADR-031](../ADR/ADR-031-support-pointer-keyboard-and-reduced-motion.md)に従う。Reactの投射ボタンはPointer Eventsとキーボードイベントを共通の投射開始・確定・キャンセル処理へ渡す。`prefers-reduced-motion`はReactとCSSの装飾的なtransitionへ適用し、Physics Runtime、Power計測、Camera変換へは渡さない。

## データフロー

```text
Pointer / Keyboard
        ↓
React event handler ─────→ Zustand: gamePhaseを更新
        ↓
Physics Runtime: Matter Bodyを生成
        ↓
requestAnimationFrame
        ↓
固定幅Matter Engine.update（0〜複数回）
        ↓
Canvas Renderer（1回）
        ↓ 全Stone停止
Zustandへ投数とStone snapshotを同期 → review
        ├─ 1〜4投目: 次の投射へ → ready
        └─ 5投目: Scoring → result確定・High Score保存
                              ↓ 結果を見る
                           Result Screen
```

## 状態モデル

```ts
type SurfaceType = "ice" | "wood" | "felt";
type ShotDistance = "short" | "medium" | "long";
type Screen =
  | "top"
  | "fieldSelect"
  | "lengthSelect"
  | "selectionConfirm"
  | "game"
  | "result"
  | "score"
  | "howToPlay";
type GamePhase =
  | "ready"
  | "charging"
  | "moving"
  | "review";

type StoneResult = {
  id: string;
  x: number;
  y: number;
  inPlay: boolean;
  score: number;
};

type HighScoreRecord = {
  score: number;
  achievedAt: string;
};

type GameStore = {
  screen: Screen;
  surface: SurfaceType | null;
  shotDistance: ShotDistance | null;
  gamePhase: GamePhase | null;
  completedShots: number; // 0〜5
  maxShots: 5;
  displayedPower: number | null; // charging中は1〜100、未操作時はnull
  soundEnabled: boolean;
  settledStones: Omit<StoneResult, "score">[];
  result: {
    stones: StoneResult[];
    totalScore: number;
  } | null;
  highScores: Record<SurfaceType, Record<ShotDistance, HighScoreRecord[]>>;
};
```

画面遷移とGame内部状態の分離は[ADR-019](../ADR/ADR-019-separate-menu-screens-and-game-phase.md)に従う。React Routerは使わず、画面を`GameStore.screen`、Game Screen内の進行を`GameStore.gamePhase`で制御する。`gamePhase`は`screen === "game"`の間だけ値を持つ。

進行方式は[ADR-016](../ADR/ADR-016-require-manual-advance-after-each-shot.md)に従う。1〜4投目の停止時はsnapshotを同期して`review`へ移り、「次の投射へ」が押された後に投射位置とCameraを準備して`ready`へ移る。5投目の停止時は同じ`review`遷移内でResultを一度だけ確定する。

ハイスコアは[ADR-010](../ADR/ADR-010-store-category-high-scores-locally.md)に従い、`localStorage`の`table-curling.high-scores.v1`から起動時に検証済みデータを読み込み、5投目のResult確定時だけ更新する。Physics RuntimeからlocalStorageへアクセスしない。「結果を見る」は`screen`を`result`へ変えるだけで、再採点や再保存を行わない。

Zustand Store全体へ永続化ミドルウェアを適用しない。途中状態を`localStorage`、`sessionStorage`、IndexedDBへ書き込まず、ページ読み込み時はハイスコアと効果音設定だけを別々に復元して`top`から開始する。

効果音は[ADR-020](../ADR/ADR-020-add-sound-effects-with-user-setting.md)に従う。ゲームイベントはAudio Adapterへ再生要求を渡すが、Adapterの失敗をゲーム状態へ伝播させない。ユーザー操作前、`soundEnabled === false`、または音声APIを利用できない場合は再生しない。ON/OFF設定は`table-curling.sound-enabled.v1`だけへ保存し、途中ゲーム状態の永続化には使わない。

ストーン衝突音は[ADR-026](../ADR/ADR-026-limit-stone-collision-bell-playback.md)に従う。Physics Runtimeは新しく始まった衝突の相対速度をAudio Adapterへ渡し、Adapterは同一Physicsステップの最大候補、弱い接触の閾値、Physics経過時間に基づく250msのクールダウンを適用する。音声用の判定はMatter Bodyの運動へフィードバックしない。

音源の読み込みは[ADR-027](../ADR/ADR-027-preload-audio-without-blocking-gameplay.md)に従う。Audio AdapterはTOP表示後に非同期で音源を読み込み、最初のユーザー操作時に音声機能の有効化を試みる。ゲームイベント時に音源が未準備なら要求を破棄し、キューイングや遅延再生を行わない。読み込み状態はAudio Adapter内部だけで管理し、GameStoreの画面遷移条件にしない。

衝突音の相対速度閾値、クールダウン、音量は型付きの共通Audio設定を正本とし、アプリとStorybookのCollision Audio Calibration Storyで共有する。Storyの値は一時的な上書きとして扱い、自動保存せず、確認後に共通設定へ手動反映する。音声調整Storyをアプリのentry pointからimportせず、productionの`dist/`へ含めない。

Reset actionは持たない。5投目の停止・最終結果確定より前の未完了ゲームではリタイア確認を開ける。確認中はRuntimeの時間更新を停止し、確定時はRuntimeとゲーム状態を破棄して`screen: "top"`へ移る。キャンセル時は確認中の実時間をaccumulatorへ加えず、直前の`gamePhase`へ復帰する。ただし`charging`から開いた場合は入力をキャンセル済みのため`ready`へ戻る。

Physics RuntimeはMatter EngineとStone IDからMatter Bodyへの対応表を持つ。RuntimeはReactコンポーネント内の`useRef`から参照し、ReactとZustandはMatter.js APIを直接呼ばない。

Physics設定は型付きの共通設定ファイルを正本とし、アプリとStorybookのCalibration Harnessが同じ設定型、Matter Adapter、Physics Runtime、Rendererを利用する。Calibration Harnessは[ADR-024](../ADR/ADR-024-calibrate-physics-in-storybook.md)に従い、Storybook Argsを共通設定の一時的な上書きとして渡す。パラメータ変更時は既存Runtimeを破棄し、同じ初期条件で新しいRuntimeを生成する。

Calibration StoryとHarnessはStorybook専用モジュールとして配置し、アプリのentry pointからimportしない。productionアプリには調整用Store、Screen、URL分岐を持たせない。

`displayedPower`はUI表示用であり、充電時間の正本はRuntime側の時刻とする。毎フレームStoreへ書き込まず、値が整数単位で変わった場合だけ更新できる。

座標方式は[ADR-015](../ADR/ADR-015-separate-physics-world-and-viewport.md)に従う。Physics Runtimeは`600 × 1500`のWorld座標を正本とする。RendererはCameraの位置と表示倍率を使って`600 × 1000`相当の表示窓へ変換し、Pointer入力では逆変換する。Cameraは表示だけの状態であり、Physics、盤外判定、採点へ渡さない。

Rendererは[ADR-023](../ADR/ADR-023-show-colored-score-labels-on-target.md)に従い、ターゲットリング、色付き固定配点、ストーンの順に描画する。固定配点はゲームルールの静的表示であり、RuntimeやZustandの得点状態として保持しない。ストーンの動的な色は現在座標から導出する。5投目停止時に確定した各ストーンの得点数値と合計は、`review`では表示せず、Result Screenへ遷移してからUIへ表示する。

レイアウトは[ADR-022](../ADR/ADR-022-use-responsive-game-layout.md)に従う。ReactとCSSが縦配置・横配置、safe-area、Game Screenの利用可能領域を管理する。CanvasのResizeObserverはCSS表示サイズと高DPI用描画バッファを更新するが、Physics Runtimeを再生成せず、World座標やCameraの意味を変更しない。

## ライフサイクル

- Game Screenのmount時にRuntimeと単一のAnimation Frame Schedulerを生成する
- Schedulerは[ADR-030](../ADR/ADR-030-run-animation-frames-only-while-active.md)に従い、`charging`と`moving`だけ継続実行する
- `ready`と`review`では状態遷移時、Camera変更時、ResizeObserver通知時に1回だけ描画を予約する
- unmount、リタイア確定、TOPへの遷移時にAnimation Frameを必ずcancelする
- React Strict Modeでeffectが再実行されてもloopが二重起動しないようcleanupする
- `visibilitychange`で`document.visibilityState === "hidden"`になったらAnimation Frameを停止する
- 非表示時の`moving`はBody状態を維持し、`charging`は投射せず`ready`へ戻す
- `moving`で再表示した場合は基準時刻とaccumulatorを初期化し、非表示中の経過時間を加えず継続実行を再開する
- `ready`または`review`で再表示した場合は必要に応じて1回描画し、継続実行しない
- frame delta上限はvisibilityイベントを取得できなかった場合などの防御として維持する
- CanvasのResizeObserverは表示サイズだけを更新し、ゲーム座標を変更しない

ページ非表示時の詳細は[ADR-021](../ADR/ADR-021-pause-while-page-is-hidden.md)に従う。一時停止はRuntimeのライフサイクル状態であり、`GamePhase`へ`paused`は追加しない。

## 推奨構成

```text
.storybook/
e2e/
src/
├─ components/
│  └─ *.stories.tsx
├─ screens/
├─ game/
│  ├─ audio/
│  │  ├─ audioAdapter.ts
│  │  └─ __stories__/
│  │     └─ CollisionAudioCalibration.stories.tsx
│  ├─ physics/
│  │  ├─ matterAdapter.ts
│  │  ├─ createBodies.ts
│  │  ├─ gamePhysicsRules.ts
│  │  └─ __stories__/
│  │     ├─ PhysicsCalibration.stories.tsx
│  │     └─ PhysicsCalibrationHarness.tsx
│  ├─ runtime/
│  ├─ renderer/
│  ├─ scoring/
│  └─ types.ts
├─ stores/
├─ config/
│  ├─ audio.ts
│  ├─ physics.ts
│  └─ surfaces.ts
└─ test/
```

詳細判断は[ADR一覧](./README.md#adr一覧)を参照する。アーキテクチャに直接関係する判断は、[ADR-001](../ADR/ADR-001-use-html-canvas.md)、[ADR-002](../ADR/ADR-002-fixed-timestep-physics.md)、[ADR-006](../ADR/ADR-006-runtime-state-ownership.md)、[ADR-008](../ADR/ADR-008-use-matter-js.md)、[ADR-010](../ADR/ADR-010-store-category-high-scores-locally.md)、[ADR-011](../ADR/ADR-011-use-vitest-storybook-and-playwright.md)、[ADR-014](../ADR/ADR-014-use-out-of-bounds-on-all-edges.md)、[ADR-015](../ADR/ADR-015-separate-physics-world-and-viewport.md)、[ADR-016](../ADR/ADR-016-require-manual-advance-after-each-shot.md)、[ADR-019](../ADR/ADR-019-separate-menu-screens-and-game-phase.md)、[ADR-020](../ADR/ADR-020-add-sound-effects-with-user-setting.md)、[ADR-021](../ADR/ADR-021-pause-while-page-is-hidden.md)、[ADR-022](../ADR/ADR-022-use-responsive-game-layout.md)、[ADR-023](../ADR/ADR-023-show-colored-score-labels-on-target.md)、[ADR-024](../ADR/ADR-024-calibrate-physics-in-storybook.md)、[ADR-025](../ADR/ADR-025-bundle-selected-kenney-sound-effects.md)、[ADR-026](../ADR/ADR-026-limit-stone-collision-bell-playback.md)、[ADR-027](../ADR/ADR-027-preload-audio-without-blocking-gameplay.md)、[ADR-028](../ADR/ADR-028-support-current-major-browsers.md)、[ADR-029](../ADR/ADR-029-cap-canvas-pixel-ratio-at-two.md)、[ADR-030](../ADR/ADR-030-run-animation-frames-only-while-active.md)、[ADR-031](../ADR/ADR-031-support-pointer-keyboard-and-reduced-motion.md)、[ADR-032](../ADR/ADR-032-use-optional-static-how-to-play-screen.md)である。
