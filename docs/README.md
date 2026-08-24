# Table Curling ドキュメント

- 状態: Accepted（MVP仕様確定）

## 文書の位置づけ

- [`table-curling-react-cloudflare-issue.md`](../table-curling-react-cloudflare-issue.md): 要求の原典。目的、スコープ、受け入れ条件を管理する
- [`specifications/README.md`](./specifications/README.md): 目的別に分割したMVP仕様の正本と読み方
- [`game-specification.md`](./game-specification.md): 既存リンクと全体案内のための仕様入口
- [`design/README.md`](./design/README.md): 目的別に分割したモジュール責務、依存方向、データフローの正本
- [`architecture.md`](./architecture.md): 既存リンクと全体案内のための設計入口
- [`testing-and-deployment.md`](./testing-and-deployment.md): 検証方法、Cloudflare Pagesへの公開手順、ロールバック
- [`ADR/`](../ADR/README.md): 重要な技術判断、その理由、置換履歴

要求を変更するときはIssueを先に更新する。実装上の数値や動作を変更するときは[`specifications/README.md`](./specifications/README.md)で正本を確認して該当仕様書だけを更新し、重要な設計判断を変更するときは既存ADRを書き換えず、新しいADRで置き換える。

## 確定したMVPの概要

以下は全体像を把握するための要約であり、具体的な動作と数値は[`specifications/`](./specifications/README.md)を正本とする。

- 600 × 1500のPhysics Worldを、通常600 × 1000相当のHTML Canvas表示窓へ描画する
- 投射方向はターゲット中心へ固定し、長押し中に往復するPowerを離すタイミングで強度を決める
- 1ゲーム5投とし、各投射後はボタン操作で次の投射またはResultへ進む
- 物理演算は1/120秒の固定タイムステップで更新する
- Surface差はMatter.jsの`frictionAir`で表現し、プレイテストで調整する
- 反射壁は設けず、四辺のいずれかから出たストーンは0点とする
- 全5投終了時のストーン中心座標で最終得点を計算する
- 投射、衝突、停止、コースアウトに効果音を付け、TOPからON/OFFを選べるようにする
- 効果音には選定済みのKenney CC0素材をOgg Vorbisのまま同梱する
- ページが一時的に非表示の間はゲームを停止し、再表示時に安全に再開する
- Game Screenは縦画面で上下配置、横画面・広い画面で左右配置とし、Canvasの`3:5`を維持する
- Canvasの描画倍率は`devicePixelRatio`を反映しつつ最大2に制限する
- Animation Frameは`charging`と`moving`だけ継続し、静止状態では必要時に1回だけ描画する
- Pointerとキーボードで同じ操作を提供し、動きを減らす設定では装飾的なアニメーションだけを抑制する
- 遊び方はTOPから任意に開く静的画面とし、強制チュートリアルや既読保存を設けない
- PCのChrome・Edge・Safariと、Android版Chrome・iOS版Safariの現行安定版を正式サポートする
- Physicsパラメータはproductionアプリへ調整画面を設けず、StorybookのCalibration Storyで比較・調整する
- ビルド済みの`app/dist/`をCloudflare PagesへDirect Uploadする

## ADR一覧

現行の設計判断は、[`ADR/README.md`](../ADR/README.md)で目的別に確認する。Superseded ADRと置換チェーンも同じ索引で管理する。
