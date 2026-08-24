# 描画・入力接続設計

- 状態: Accepted（関連ADRで確定）

## 1. Rendererの責務

RendererはPhysics Runtimeのsnapshotを受け取り、Camera変換を適用してHTML Canvasへ描画する。

- Physics Engineを更新しない
- Zustandの状態遷移を実行しない
- Matter Bodyを直接所有しない
- 現在座標から描画用のストーン色を導出する
- 描画に必要な静的設定は型付き設定として受け取る

盤面の論理座標、得点色、Surface表現は[`coordinates-and-rendering.md`](../specifications/coordinates-and-rendering.md)を正本とする。

## 2. 座標変換

Rendererは次の3種類のサイズを分離する。

| サイズ | 管理するもの |
| --- | --- |
| CSS表示サイズ | ReactとCSSが確保した画面上の領域 |
| Camera論理表示サイズ | Worldのどの範囲を表示するか |
| Canvas内部ピクセルサイズ | 高DPI端末で実際に確保する描画バッファ |

World座標から表示座標への変換はCameraの位置と表示倍率を使う。Pointer入力では同じ変換の逆変換を使い、表示座標をWorld座標へ戻す。

Cameraは表示だけの状態であり、Physics、盤外判定、採点へ渡さない。

## 3. リサイズ

CanvasのResizeObserverは、ReactとCSSが確保した表示領域の変化を監視する。

- CSS表示サイズを読み取る
- 仕様で定めた描画倍率を反映してCanvas内部ピクセルサイズを更新する
- Cameraの論理表示範囲を再計算する
- Physics Runtime、World座標、GamePhaseを維持する
- `ready`または`review`では継続loopを開始せず、再描画を1回だけ要求する

Canvasの縦横比、描画倍率、レスポンシブ配置は[`coordinates-and-rendering.md`](../specifications/coordinates-and-rendering.md)と[`screen-flow-and-input.md`](../specifications/screen-flow-and-input.md)を正本とする。

## 4. 描画順

Rendererは[ADR-023](../../ADR/ADR-023-show-colored-score-labels-on-target.md)に従い、少なくとも次の順序を維持する。

1. Surface背景
2. ターゲットリング
3. 色付き固定配点
4. ストーン

固定配点はゲームルールの静的表示であり、RuntimeやZustandの得点状態として保持しない。

ストーンの動的な色は現在座標から導出する。最終投射の停止時に確定した各ストーンの得点数値と合計は`review`でCanvasへ描画せず、Result Screenへ遷移してからHTML UIで表示する。

## 5. Reactとの境界

Reactは次の要素を管理する。

- Canvas要素とその配置
- 情報領域と操作領域
- 投射ボタン、進行ボタン、リタイア確認
- CanvasとRuntimeの生成・破棄を接続するeffect
- ResizeObserverの登録と解除

RendererはReactコンポーネントをimportせず、ReactはRendererへ描画に必要なCanvas、snapshot、Camera、設定だけを渡す。

## 6. Pointer・キーボード入力

入力と動きの扱いは[ADR-031](../../ADR/ADR-031-support-pointer-keyboard-and-reduced-motion.md)に従う。

Reactの投射ボタンは、Pointer Eventsとキーボードイベントを共通の投射開始・確定・キャンセル処理へ渡す。

```text
Pointer / Keyboard
        ↓
React input handler
        ├─ 開始・キャンセル → StoreとRuntimeへ状態要求
        └─ 確定Power       → Runtimeへ投射要求
```

入力HandlerはMatter Bodyを直接操作しない。投射要求はPhysics Runtimeの公開境界へ渡す。

Powerの時間変化、Pointer Capture、キャンセル条件、HTML情報は[`screen-flow-and-input.md`](../specifications/screen-flow-and-input.md)を正本とする。UI表示用PowerとRuntime時刻の所有境界は[`state-and-transitions.md`](./state-and-transitions.md)を参照する。

## 7. 動きを減らす設定

`prefers-reduced-motion`はReactとCSSの装飾的なtransitionへ適用する。

ゲーム進行に必要なPhysics Runtime、Power計測、ストーン、衝突、Camera変換へは渡さない。RendererとRuntimeへ別の物理挙動を導入せず、設定の有無でゲーム結果が変わらないようにする。
