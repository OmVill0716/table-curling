# システム全体設計

- 状態: Accepted（関連ADRで確定）

## 1. 設計目標

Reactの再レンダリングをゲームループに使わず、UI状態、高頻度Physics状態、描画を分離する。

Matter.jsはAdapter内へ閉じ込める。Scoringとゲーム固有ルールはブラウザAPIに依存しない純粋TypeScriptとして実装し、単体テスト可能にする。

localStorageとAudio APIのようなブラウザ副作用はゲーム進行から分離し、失敗してもPhysicsや画面遷移を壊さない。

## 2. レイヤー責務

| レイヤー | 責務 | 持たないもの |
| --- | --- | --- |
| React | Screen構成、MUI、入力イベント、Runtimeの生成・破棄 | 物理計算、フレームごとの座標state |
| Zustand | Surface、UI状態、投数、確定結果などゲームとして意味のある状態 | 毎フレームの座標・速度 |
| Matter Adapter | Engine・Bodyの生成と更新、Surface設定、盤外・停止判定 | DOM、Canvas、Zustand |
| Physics Runtime | accumulator、Matter Engine、Body対応表、Animation Frameの進行 | React UIの描画 |
| Renderer | RuntimeのsnapshotをCamera変換してCanvasへ描画 | 状態遷移、物理計算 |
| Scoring | 最終Stone位置から個別得点と合計を計算 | Store更新、画面表示 |
| Audio Adapter | ゲームイベントに対応する効果音の読み込み・再生・停止 | ゲーム進行、Physics、採点 |
| Persistence | ハイスコアとユーザー設定の読み込み・検証・保存 | ゲームループ、途中ゲームの復元 |

各レイヤーの詳細な所有境界は、[`state-and-transitions.md`](./state-and-transitions.md)、[`physics-runtime.md`](./physics-runtime.md)、[`rendering-and-input.md`](./rendering-and-input.md)、[`external-adapters.md`](./external-adapters.md)を参照する。

## 3. 全体データフロー

```text
Pointer / Keyboard
        ↓
React event handler ─────→ Zustand: gamePhaseを更新
        ↓
Physics Runtime: Matter Bodyを生成
        ↓
Animation Frame
        ↓
固定幅Matter Engine.update（0〜複数回）
        ↓
Canvas Renderer（1回）
        ↓ 全Stone停止
Zustandへ投数とStone snapshotを同期 → review
        ├─ 最終投射以外: 次の投射へ → ready
        └─ 最終投射: Scoring → result確定・High Score保存
                                  ↓ 結果を見る
                               Result Screen
```

Physics RuntimeからZustandへ同期するのは、投射開始、全Stone停止、盤外、Result確定など、ゲームとして意味のある境界だけとする。フレームごとの座標や速度は同期しない。

## 4. 依存方向

```text
React Screens / App Coordinator
    ├─→ Zustand Store ─→ Persistence
    ├─→ Game Runtime ─→ Matter Adapter
    ├─→ Renderer
    ├─→ Audio Adapter
    └─→ Pure game logic / Scoring
```

- ReactはGame Runtimeの公開境界を利用し、Matter.js APIを直接呼ばない
- ZustandはPhysics Runtime、Canvas、DOMを所有しない
- Physics RuntimeとRendererはReactコンポーネントをimportしない
- Physics Runtimeは音声を再生せず、ゲームイベントを公開する
- Scoringとゲーム固有ルールはMatter.js、Zustand、DOM、localStorage、Audio APIへ依存しない
- ブラウザAPIや外部ライブラリへのアクセスは、対応する境界モジュールへ閉じ込める

具体的なファイル配置とimport方針は[`module-structure.md`](./module-structure.md)を正本とする。
