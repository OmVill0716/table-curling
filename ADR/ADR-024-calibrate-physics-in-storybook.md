# ADR-024: PhysicsパラメータをStorybookで調整する

- 状態: Accepted
- 決定日: 2026-08-23

## コンテキスト

`minSpeed`、`maxSpeed`、Surfaceごとの`frictionAir`、`restitution`、停止速度、停止継続時間は、実装後のプレイテストで調整する必要がある。コードを書き換えてアプリを再起動するだけでは、同じ初期条件での反復比較と数値の観察がしにくい。

一方、調整専用画面、デバッグ用URL、開発用分岐をproductionアプリへ追加すると、プレイヤー向け機能へ開発用責務が混ざる。既に採用済みのStorybookを、UIカタログに加えて隔離されたPhysics実験環境として利用できる。

## 決定

- Physics調整はproductionアプリではなく、Storybookの`Physics Calibration` Storyで行う
- アプリ本体へ調整画面、デバッグメニュー、デバッグ用クエリパラメータを追加しない
- Storybook Args / Controlsで次の値を変更できるようにする
  - Power
  - `minSpeed`と`maxSpeed`
  - ICE、WOOD、FELTの`frictionAir`
  - 全Surface共通の`restitution`
  - 停止速度と停止継続時間
- Story内にCanvasと、現在速度、移動距離、World座標、停止理由の診断表示を置く
- パラメータ変更時は実行中Bodyへ途中適用せず、同じ初期条件でPhysics Runtimeを作り直す
- 手動で投射を再実行できるようにする
- 最低PowerのFELT直線投射、最大PowerのFELT・LONG、Surface間の直線距離比較、正面衝突、停止判定のプリセットStoryを用意する
- Storyの調整値を設定ファイルへ転記可能なJSONとしてコピーできるようにする
- 調整値をアプリの`localStorage`などへ自動保存せず、自動最適化も行わない
- 採用値はレビュー後に共通のPhysics設定ファイルへ手動で反映する
- Calibration用StoryとHarnessがViteのproduction成果物`dist/`へ含まれないことをビルド時に確認する

## 影響

- 同じ初期条件で値だけを変え、Physics挙動を視覚的・数値的に比較できる
- productionアプリの画面遷移とStoreへデバッグ状態を追加せずに済む
- Calibration Harnessはアプリと同じMatter Adapter、Physics Runtime、Renderer、設定型を再利用する必要がある
- Story固有のRuntimeをStoryのunmountとパラメータ変更時に必ず破棄する必要がある
- Storybookはコンポーネント確認だけでなく手動プレイテスト環境も担うが、合否が明確なゲームルールはVitestで引き続き自動検証する
- JSONのコピーだけでは設定ファイルを変更せず、人が内容を確認して反映する工程が残る
