# ADR-008: Physics EngineにMatter.jsを使う

- 状態: Accepted
- 決定日: 2026-08-23

## コンテキスト

当初のIssueは独自Physicsの技術検証を目的に含めていたが、実際の目的は、ブラウザ上で物理演算を利用したゲームを完成させられるか検証することである。衝突検出・衝突解決そのものの自作は目的ではない。

独自実装では、円同士の衝突、重なり解消、運動量の伝達、停止判定、高速移動時のすり抜けなどへ多くの検証時間が必要になる。Matter.jsは2D剛体、円形Body、衝突、摩擦抵抗、反発、Sleepingを提供している。

## 決定

- Physics EngineにMatter.jsを採用する
- Matter.jsの組み込みRendererは使わず、ADR-001で決定した独自Canvas Rendererを使う
- Matter.jsの組み込みRunnerは使わず、ADR-002のRuntimeから`Engine.update`を`1000 / 120`ミリ秒単位で呼ぶ
- 重力は無効にする
- ストーンは同じ大きさ・密度の円形Bodyとして作成する
- Matter.jsは位置更新と衝突解決を担当する
- アプリ側はSurface別の抵抗設定、投射、停止・盤外判定、採点、ゲーム進行を担当する
- Matter.jsのバージョンは`package-lock.json`で固定する

## 影響

- 独自の衝突ソルバーを実装せず、ゲームの操作感と完成へ集中できる
- Physicsの検証はMatter.js内部のアルゴリズムではなく、設定とゲーム固有ラッパーの期待動作を対象にする
- Matter.js固有のBody、Engine、CompositeなどをPhysics Runtime内で扱う必要がある
- Surface差には水平面上の移動抵抗として`Body.frictionAir`を利用し、実機プレイテストで値を調整する
- 将来Matter.jsを置き換える場合に備え、ReactとZustandから直接Matter.js APIを呼ばずAdapter内へ閉じ込める

## 参照

- [Matter.js公式リポジトリ](https://github.com/liabru/matter-js)
- [Matter.Engine API](https://brm.io/matter-js/docs/classes/Engine.html)
- [Matter.Body API](https://brm.io/matter-js/docs/classes/Body.html)
