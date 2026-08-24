# 状態管理・遷移設計

- 状態: Accepted（関連ADRで確定）

## 1. 状態モデル

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
  completedShots: number;
  maxShots: number;
  displayedPower: number | null;
  soundEnabled: boolean;
  settledStones: Omit<StoneResult, "score">[];
  result: {
    stones: StoneResult[];
    totalScore: number;
  } | null;
  highScores: Record<SurfaceType, Record<ShotDistance, HighScoreRecord[]>>;
};
```

具体的な画面、投数、Power範囲、保存データは、[`game-rules.md`](../specifications/game-rules.md)、[`screen-flow-and-input.md`](../specifications/screen-flow-and-input.md)、[`persistence.md`](../specifications/persistence.md)を正本とする。

## 2. 状態の所有境界

| 所有者 | 所有する状態 |
| --- | --- |
| Zustand | `Screen`、選択中のSurface・距離、`GamePhase`、完了投数、UI表示用Power、停止時snapshot、確定Result、ハイスコア、効果音設定 |
| Physics Runtime | Matter Engine、Body、座標、速度、角速度、accumulator、停止継続時間、充電時間の正本 |
| React component | Runtime参照、Canvas参照、DOMとReact effectのライフサイクル |
| Rendererの導出 | 現在座標に基づくストーン色、Camera変換後の描画位置 |
| Persistence | localStorageから読み取った検証前データと保存処理 |
| Audio Adapter | 音源の読込状態、再生中の音、衝突音の再生制御状態 |

高頻度状態をPhysics Runtimeが所有する判断は[ADR-006](../../ADR/ADR-006-runtime-state-ownership.md)に従う。

## 3. ScreenとGamePhase

画面遷移とGame内部状態の分離は[ADR-019](../../ADR/ADR-019-separate-menu-screens-and-game-phase.md)に従う。

- 画面は`GameStore.screen`で制御する
- Game Screen内の進行は`GameStore.gamePhase`で制御する
- `gamePhase`は`screen === "game"`の間だけ値を持つ
- React Routerは使わず、公開URLとブラウザ履歴をゲーム内遷移へ連動させない

許可される画面遷移とGamePhaseごとの操作は[`screen-flow-and-input.md`](../specifications/screen-flow-and-input.md)を正本とする。

## 4. Runtimeとの同期点

ZustandとPhysics Runtimeは、次の境界でだけ同期する。

### ゲーム開始

- Zustandで確定したSurfaceと投射距離をRuntime生成時に渡す
- Runtimeを生成し、1投目のBodyとCameraを準備する
- 準備完了後に`gamePhase`を`ready`へ移す

### 投射開始

- React入力から確定したPowerをRuntimeへ渡す
- RuntimeがBodyへ初速度を与える
- Zustandの`gamePhase`を`moving`へ移す

### 全Stone停止

- RuntimeからStone snapshotを一度取得する
- 完了投数と`settledStones`をZustandへ同期する
- `gamePhase`を`review`へ移す

最終投射以外では「次の投射へ」が押された後に投射位置とCameraを準備し、`ready`へ移る。

最終投射では停止時のsnapshotをScoringへ渡し、Resultを一度だけ確定する。ハイスコア更新もこの確定処理から一度だけ要求する。「結果を見る」は`screen`を`result`へ変えるだけで、再採点や再保存を行わない。

## 5. UI表示用の導出状態

`displayedPower`はUI表示用であり、充電時間の正本はRuntime側の時刻とする。毎フレームStoreへ書き込まず、表示値が整数単位で変わった場合だけ更新できる。

ストーンの暫定得点色はRendererが現在座標から導出する。Zustandへ毎フレーム保存せず、最終投射の停止時だけScoringの結果を`result`へ保存する。

## 6. 永続化との接続

Zustand Store全体へ永続化ミドルウェアを適用しない。

起動時はPersistenceから検証済みのハイスコアと効果音設定だけを受け取り、`screen: "top"`から開始する。ゲーム途中の状態はPersistenceへ渡さない。

Physics RuntimeからlocalStorageへアクセスしない。保存対象、タイミング、キーは[`persistence.md`](../specifications/persistence.md)、ブラウザAPIとの境界は[`external-adapters.md`](./external-adapters.md)を正本とする。

## 7. リタイア

Reset actionは持たない。最終結果確定前の未完了ゲームではリタイア確認を開ける。

- 確認中はRuntimeの時間更新を停止する
- 確定時はRuntimeとゲーム状態を破棄し、`screen: "top"`へ移る
- キャンセル時は確認中の実時間をaccumulatorへ加えず、直前の`gamePhase`へ復帰する
- `charging`から確認を開いた場合は入力をキャンセル済みのため、キャンセル時も`ready`へ戻る

入力キャンセルと非表示時の状態遷移は[`screen-flow-and-input.md`](../specifications/screen-flow-and-input.md)、Runtimeの停止・再開は[`physics-runtime.md`](./physics-runtime.md)を参照する。
