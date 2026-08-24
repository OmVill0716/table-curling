# ADR-015: Physics Worldと表示窓を分離する

- 状態: Accepted
- 決定日: 2026-08-23

## コンテキスト

ADR-001ではCanvasの論理座標を`600 × 1000`とした。一方、最低Powerを連続して使った場合でも次の投射前にストーン直径と隙間を確保するには、基本投射位置から投射側へ後退できる領域が必要になる。特にLONGの5投目では、基本投射位置`y = 940`から最大144 logical px後退し、投射位置が`y = 1084`になる。

盤面全体を常に縮小すると、通常プレイ時のターゲットとストーンが小さくなる。Physicsの座標範囲とCanvasに見せる範囲を分離する必要がある。

## 決定

- Physics Worldを`600 × 1500 logical px`とする
- 通常の表示窓はADR-001の`600 × 1000 logical px`相当を維持する
- `y = 1000〜1500`を投射側バッファとする
- 投射位置は必要な場合に36 logical pxずつ投射側へ移動し、5投目までの初期上限を144 logical pxとする
- RendererはWorld座標を表示座標へ変換するCameraを持つ
- 通常時は基本盤面を表示し、投射位置の後退時はターゲットの得点範囲と投射ストーンが同時に見えるようCameraの位置と表示倍率を調整する
- Physics、衝突、盤外判定、採点はWorld座標だけを使い、Cameraの値に依存させない
- 具体的な投射位置探索とCamera framingは[`coordinates-and-rendering.md`](../docs/specifications/coordinates-and-rendering.md)、盤外条件は[`physics.md`](../docs/specifications/physics.md)を正本とする

## 影響

- 通常時の表示サイズを維持しながら、5投目まで投射位置を後退できる
- 選択した投射距離とハイスコアカテゴリーを途中で変更せずに済む
- Rendererと入力座標変換にCamera変換が必要になる
- Canvasの表示倍率が変わってもPhysics結果は変化しない
- Camera移動と倍率変更が急激に見えないようUI調整が必要になる
