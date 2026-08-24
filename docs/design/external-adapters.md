# 外部Adapter設計

- 状態: Accepted（関連ADRで確定）

## 1. 目的

localStorageとAudio APIへのアクセスをゲーム進行から分離する。外部APIが利用できない場合やデータ・音源が不正な場合でも、Store、Physics、Scoringの基本処理を継続できる境界にする。

保存対象と再生動作は[`persistence.md`](../specifications/persistence.md)と[`audio.md`](../specifications/audio.md)を正本とする。

## 2. Persistence

Persistenceは、ハイスコアと効果音設定をlocalStorageから読み込み、検証済みの値だけをアプリへ返す。

### 起動時

- ハイスコアのJSON構造、カテゴリー、レコード形式、得点範囲を検証する
- 破損したハイスコアはゲームを停止させず、空の記録として扱う
- 効果音設定が存在しない、不正、またはlocalStorageを利用できない場合は仕様上の初期値を返す
- GameStore全体や途中ゲームの状態を読み込まない

### 保存時

- 最終Resultの確定イベントから、更新済みハイスコアだけを受け取って保存する
- 「結果を見る」やResult Screenの再描画から再保存しない
- 効果音設定の変更時は、ハイスコアとは別の保存処理として扱う
- Physics Runtime、Renderer、ScoringからlocalStorageへ直接アクセスしない

localStorageのキー、保存形式、保存しない状態は[`persistence.md`](../specifications/persistence.md)を参照する。

## 3. Audio Adapter

Audio Adapterは、音源の読み込み、音声機能の有効化、再生、停止、衝突音の再生制御状態を所有する。

ゲームイベントはAudio Adapterへ再生要求を渡すが、Adapterの失敗をGamePhase、Physics、採点へ伝播させない。

- ユーザー操作前または効果音OFFでは再生を開始しない
- OFFへ変更された場合は再生中の音を停止する
- Audio APIを利用できない場合は要求を破棄する
- 再生結果をゲーム状態の遷移条件にしない

## 4. 音源の読み込み

TOP表示後にAudio Adapterを通じて音源を非同期に読み込む。

- 読み込み中も画面遷移とゲーム開始を許可する
- 最初のユーザー操作時に音声機能の有効化を試みる
- 未準備、読み込み失敗、デコード失敗ではそのイベントの要求を破棄する
- 破棄した要求をキューへ保存せず、準備後に遅延再生しない
- 読み込み状態はAudio Adapter内部だけで管理し、GameStoreへ保存しない

## 5. 衝突音

Physics Runtimeは、新しく始まった衝突のStone IDと相対速度をゲームイベントとして公開する。Game Screen側の接続処理が、そのイベントを再生候補としてAudio Adapterへ渡す。

Audio Adapterは次の順で候補を絞り込む。

1. 継続接触ではなく、新しく始まった衝突だけを受け取る
2. 同一Physicsステップの候補から相対速度が最大の1件を選ぶ
3. 弱い接触を除外する
4. Physics経過時間に基づくクールダウンを適用する
5. 再生可能な場合だけ鐘を再生する

音声用の判定結果はMatter Bodyの運動へフィードバックしない。閾値、クールダウン、音量の具体値は[`audio.md`](../specifications/audio.md)を正本とする。

## 6. Audio設定とStorybook

衝突音の相対速度閾値、クールダウン、音量は型付きの共通Audio設定を正本とし、アプリとStorybookのCollision Audio Calibration Storyで共有する。

- Storyの値は一時的な上書きとして扱う
- 調整値を自動保存しない
- 確認後に共通設定へ手動反映する
- 音声調整Storyをアプリのentry pointからimportしない
- productionの`dist/`へStoryと調整Harnessを含めない
