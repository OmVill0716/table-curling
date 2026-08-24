# 画面遷移・入力仕様

- 状態: Accepted（MVP仕様確定）

## 1. 画面構成

画面構成と状態の分離は[ADR-019](../../ADR/ADR-019-separate-menu-screens-and-game-phase.md)に従う。

```text
TOP「テーブルカーリング」
├─ ゲームプレイ
│  └─ フィールド選択 → 長さ選択 → 選択内容確認 → Game → Result
├─ スコア確認
└─ 遊び方
```

TOPには「ゲームプレイ」「スコア確認」「遊び方」の3つの主要な入口と、効果音のON/OFF設定を表示する。

ゲーム設定中は「戻る」で1画面前へ戻り、既に選択した値を維持する。

- フィールド選択から戻るとTOPへ移る
- 長さ選択から戻るとフィールド選択へ移る
- 選択内容確認から戻ると長さ選択へ移る
- 選択内容確認ではフィールドと長さを表示し、「ゲーム開始」が押された後にGame Screenを開始する

Game ScreenとResult Screenには、選択されたSurfaceと投射距離名を表示する。

スコア確認ではフィールドごとのタブと長さのタブを表示し、選択中カテゴリーの上位3件だけを表示する。「TOPへ」でTOPへ戻る。スコア確認用のタブ選択は、ゲームプレイ用のフィールド・長さ選択を変更しない。

## 2. 遊び方

遊び方は[ADR-032](../../ADR/ADR-032-use-optional-static-how-to-play-screen.md)に従い、TOPから任意に開く静的な1画面とする。

次の内容を説明する。

- ゲームの目的
- Surfaceと投射距離の違い
- Power Gaugeと固定投射方向
- 5投の進行
- ストーン同士の衝突
- ターゲットの固定配点
- 動的なストーン色
- 四辺のコースアウト
- Resultでの最終採点
- リタイア
- 途中保存を行わないこと
- 効果音設定

「TOPへ」でTOPへ戻る。初回強制表示、既読保存、チュートリアル進捗は設けず、内容がviewportへ収まらない場合は縦スクロールを許可する。

## 3. 画面状態

| `Screen` | 意味 | 主な操作 |
| --- | --- | --- |
| `top` | 入口 | ゲームプレイ、スコア確認、遊び方 |
| `fieldSelect` | フィールド選択 | ICE、WOOD、FELT、戻る |
| `lengthSelect` | 長さ選択 | SHORT、MEDIUM、LONG、戻る |
| `selectionConfirm` | 選択内容確認 | ゲーム開始、戻る |
| `game` | ゲーム | GamePhaseに従う操作、リタイア |
| `result` | 結果 | Retry、TOPへ |
| `score` | スコア確認 | フィールド・長さタブ、TOPへ |
| `howToPlay` | 遊び方 | TOPへ |

## 4. Game Screen内の状態

| 状態 | 意味 | 許可する操作 |
| --- | --- | --- |
| `ready` | 投射待ち | 長押し開始、リタイア |
| `charging` | Powerが1〜100を往復中 | リリースして投射、キャンセル、リタイア |
| `moving` | 1個以上のストーンが運動中 | リタイア |
| `review` | 投射結果の確認中 | 1〜4投目は次の投射へ・リタイア、5投目は結果を見る |

ゲーム進行と各`review`で表示する情報は[`game-rules.md`](./game-rules.md)を正本とする。

「次の投射へ」を押した後に次の投射位置を計算し、Cameraの準備が完了してから`ready`へ移る。「結果を見る」は確定済みResultを表示するだけで、再採点やハイスコア保存を行わない。

## 5. リタイア・Retry・TOP

- `リタイア`: 5投目の停止・最終結果確定より前の未完了ゲームを確認後に破棄し、Resultを表示せずTOPへ戻る
- `Retry`: Resultから同じSurface・距離で新しいゲームを始める
- `TOPへ`: Resultから確認なしで選択を解除し、TOPへ戻る

Resetは実装しない。リタイアしたゲームの得点、投数、ストーン、リタイア回数は保存しない。

リタイア確認中はPower入力とPhysicsを停止する。

- `charging`から確認を開く場合は充電をキャンセルし、確認を取り消した場合は`ready`へ戻る
- `moving`から確認を取り消した場合は、確認中の実時間をPhysicsへ加算せず`moving`を再開する
- `ready`または1〜4投目の`review`から確認を取り消した場合は元の状態へ戻る

## 6. Power Gaugeと投射操作

入力方式は[ADR-013](../../ADR/ADR-013-use-oscillating-power-gauge.md)に従う。

Canvas外に、タッチとマウスで共通利用する円形の投射ボタンを表示する。Pointer DownまたはキーボードのSpace/EnterでPower Gaugeを開始し、Powerを1から100まで1.5秒、100から1まで1.5秒で直線的に変化させる。

ボタンを押している限り、3秒周期で往復を繰り返す。Pointer Upまたはキーを離した時点で発射する。

```ts
const halfCycleSeconds = 1.5;
const phase = (heldSeconds % (halfCycleSeconds * 2)) / halfCycleSeconds;
const normalized = phase <= 1 ? phase : 2 - phase;
const power = 1 + normalized * 99;
```

Power Gaugeは円形投射ボタンの上半円を使って表示する。上半円の目盛りは、Power 1の左端を緑、中央付近を黄、Power 100の右端を赤とする固定グラデーションとし、現在のPowerに対応する位置へマーカーを表示する。ボタン内には整数の現在値と、上昇中を示す`↑`または下降中を示す`↓`を併記する。

色だけでPowerを判別させない。上半円の左右には`1`と`100`を表示し、マーカー、数値、方向矢印を常に組み合わせる。未操作時はマーカーと方向矢印を隠し、現在値を`—`と表示する。Power 0は表示しない。

上半円はHTMLボタンに重ねたSVGで描画できる。装飾用SVGは`pointer-events: none`とし、Pointer Eventsとキーボードイベントは下層のHTMLボタンが受け取る。SVGは投射ボタンの装飾であり、盤面をHTML Canvasで描画する[ADR-001](../../ADR/ADR-001-use-html-canvas.md)の決定を変更しない。

投射ボタンではPointer Captureまたは同等の処理を使用する。`pointercancel`、ウィンドウのフォーカス喪失、または充電中のリタイア開始では投射せず、Power表示を未操作状態へ戻す。短いタップまたはクリックはPower 1の有効な投射として扱う。

Powerから初速度への変換は[`physics.md`](./physics.md)を正本とする。

## 7. アクセシビリティ

操作のアクセシビリティは[ADR-031](../../ADR/ADR-031-support-pointer-keyboard-and-reduced-motion.md)に従う。

- 投射ボタンはHTML `button`を使う
- 投射ボタンはアクセシブルな名前と、現在Power・増減方向のHTML情報を持つ
- 主要操作のタップ領域は最低44 × 44 CSS pxとする
- キーボードフォーカスを視認できるようにする
- Power値を強制的に連続読み上げする`aria-live`は使用しない
- 投射ボタンは長押し中のページスクロールを防ぐが、ページ全体のピンチズームは無効化しない

`prefers-reduced-motion: reduce`では装飾的な画面遷移を抑制するが、Power Gaugeの往復、ストーン、衝突、Cameraの動きはゲーム進行として維持する。

## 8. レスポンシブレイアウト

Game Screenの配置は[ADR-022](../../ADR/ADR-022-use-responsive-game-layout.md)に従う。

```text
狭い画面・縦向き              横向き・幅900 CSS px以上
┌──────────────┐          ┌────────────┬────────┐
│ 情報領域       │          │            │ 情報領域 │
├──────────────┤          │   Canvas   ├────────┤
│              │          │            │ 操作領域 │
│    Canvas    │          └────────────┴────────┘
│              │
├──────────────┤
│ 操作領域       │
└──────────────┘
```

- Game Screenは動的viewportの高さへ収め、通常のページスクロールを発生させない
- safe-area insetを上下左右の余白へ加える
- 情報領域にはShot、Surface、距離を表示する
- 操作領域には投射ボタンと現在のGamePhaseで利用できる進行・リタイア操作を表示する
- 画面回転やウィンドウサイズ変更ではCanvasのCSS表示サイズと描画バッファだけを更新し、Runtime、World座標、進行状態を維持する
- Game以外の画面は内容が表示領域を超えた場合に縦スクロールできる

Canvasの縦横比と描画倍率は[`coordinates-and-rendering.md`](./coordinates-and-rendering.md)を正本とする。

## 9. ページ非表示時

バックグラウンド動作は[ADR-021](../../ADR/ADR-021-pause-while-page-is-hidden.md)に従う。

- Game Screenでページが非表示になった時点でPower計測とPhysicsの時間更新を停止する
- `moving`はStoneの位置と速度を維持し、再表示後に同じ状態から自動再開する
- `charging`は投射せずキャンセルし、Power表示を未操作状態へ戻して`ready`へ移る
- `ready`と`review`は状態を維持する
- 非表示中の実時間はPower、Physics accumulator、[`physics.md`](./physics.md)で定義した停止継続時間へ加算しない
- 再表示時に「再開」ボタンや確認画面は表示しない
- 非表示中のPointer Upとキー解放では投射しない

一時停止は途中保存ではない。再読み込み、タブを閉じる、またはブラウザによってページが破棄された場合の扱いは[`persistence.md`](./persistence.md)を正本とする。

## 10. 描画更新

Animation Frameは`charging`と`moving`で継続する。`ready`と`review`では、状態、Camera、表示サイズが変わった時に1回だけ描画する。

Animation Frameの生成・破棄とReactライフサイクル上の責務は[`../architecture.md`](../architecture.md)を参照する。
