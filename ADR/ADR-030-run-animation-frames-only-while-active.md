# ADR-030: 動的なGamePhaseだけAnimation Frameを継続する

- 状態: Accepted
- 決定日: 2026-08-23

## コンテキスト

Game Screenを表示している間ずっと`requestAnimationFrame`を繰り返すと、盤面もUIも変化しない`ready`や`review`でもCanvasを再描画し続ける。モバイルを主対象とするため、不要なCPU・GPU使用と電池消費を避けたい。

一方、`charging`ではPowerの時間変化を表示し、`moving`では固定タイムステップでPhysicsを進めて最新状態を描画する必要がある。静止中でも状態変更やリサイズ後には、現在状態をCanvasへ反映する1回の描画が必要になる。

## 決定

- Game ScreenのAnimation Frameは単一のSchedulerが所有する
- `charging`ではPower更新のためAnimation Frameを継続する
- `moving`ではPhysics更新、停止判定、Canvas描画のためAnimation Frameを継続する
- `ready`と`review`ではAnimation Frameを継続せず、状態へ入った時に1回描画する
- `ready`と`review`でも、Canvasのリサイズ、Camera変更、表示対象の変更時には1回の描画を予約する
- Game以外のScreenではGame用Animation Frameを動かさない
- ページ非表示中はGamePhaseにかかわらずAnimation Frameを停止する
- `moving`で再表示した場合だけ、基準時刻とaccumulatorを初期化して継続ループを再開する
- `ready`または`review`で再表示した場合は必要に応じて1回描画し、継続ループを開始しない
- 同時に複数のAnimation Frameを予約せず、unmount、リタイア、TOP遷移時に予約済みFrameを必ず取り消す

## 影響

- 静止画面での不要な再描画と電池消費を抑えられる
- Schedulerは継続更新と単発描画の両方を扱う必要がある
- GamePhase変更、Camera変更、ResizeObserverから描画要求を明示的に通知する必要がある
- `ready`や`review`で描画要求を漏らすと画面が古いままになるため、Schedulerの状態遷移テストが必要になる
- Physicsの固定タイムステップとaccumulatorは`moving`だけで進み、描画最適化がゲーム結果へ影響しない
