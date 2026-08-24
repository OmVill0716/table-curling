# ADR-006: 高頻度状態をPhysics Runtimeが所有する

- 状態: Accepted
- 決定日: 2026-08-23

## コンテキスト

Stoneの位置と速度をZustandへ毎フレーム保存すると、Store通知とReact再レンダリングがゲームループへ混入する。一方ですべてをRuntimeだけに置くと、投数や結果などUIに必要な状態の正本が不明瞭になる。

## 決定

高頻度状態とゲーム進行状態を次のように分離する。

- Physics Runtime: 現在の全Stoneの位置、速度、盤内外、accumulator
- Zustand: Surface、画面状態、完了投数、停止時Stone snapshot、確定結果
- React: Runtimeのライフサイクル、入力イベント、Zustandから得たUI表示
- Renderer: Runtimeを読み取ってCanvasへ描画

RuntimeからZustandへのStone同期は、各投射の運動終了やResult確定などの意味のある境界でだけ行う。Power表示は整数値が変わったときだけ同期できる。

プレイ中の暫定得点とストーン色はRuntimeの現在位置からRendererが導出し、Zustandへ保存しない。

## 影響

- Reactの更新頻度をPhysicsの120 Hzから切り離せる
- Matter Adapterのゲーム固有設定をStoreなしでテストできる
- RuntimeとStoreの二重管理を避けるため、同期イベントを明示的に実装する必要がある
- Game Screenのunmount時にAnimation FrameとRuntimeを確実に破棄する必要がある
