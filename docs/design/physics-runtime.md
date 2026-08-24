# Physics Runtime設計

- 状態: Accepted（関連ADRで確定）

## 1. 構成

Physicsの実行系を、Matter Adapter、Physics Runtime、Animation Frame Schedulerに分離する。

| 要素 | 責務 |
| --- | --- |
| Matter Adapter | EngineとBodyの生成・更新、Surface設定、停止・盤外判定、Matter.js形式との変換 |
| Physics Runtime | Engine、Stone IDとBodyの対応表、accumulator、充電時間、snapshot生成 |
| Scheduler | Animation Frameの開始・停止、経過時間の受け渡し、1フレーム内の更新回数制御 |
| Calibration Harness | 共通RuntimeをStorybook Argsで一時設定し、同じ初期条件から再生成 |

ReactとZustandはMatter.js APIを直接呼ばない。RuntimeはGame ScreenのReactコンポーネント内で`useRef`から参照する。

## 2. 更新ループ

固定タイムステップとPhysicsパラメータは[`physics.md`](../specifications/physics.md)を正本とする。

SchedulerはAnimation Frameごとに次の処理を行う。

1. 前回フレームからの実時間差を取得する
2. 防御用のframe delta上限を適用する
3. accumulatorへ経過時間を加える
4. 固定幅以上の時間が残る間、Matter Adapterを0回以上更新する
5. 現在のRuntime snapshotをRendererへ渡し、Canvasを1回描画する
6. 全Stoneの停止・盤外を評価し、ゲーム上の同期点へ到達した場合だけZustandへ通知する

描画フレーム数をPhysicsの停止条件やPower計測の正本にしない。

## 3. Runtimeが所有する状態

- Matter Engine
- Stone IDからMatter Bodyへの対応表
- Bodyの座標、速度、角速度
- 固定更新用accumulator
- Bodyごとの停止継続時間
- Power計測用の充電時間
- Camera framingに必要なRuntime snapshot

Zustandとの所有境界とsnapshotの同期タイミングは[`state-and-transitions.md`](./state-and-transitions.md)を正本とする。

## 4. GamePhaseとの接続

Schedulerは[ADR-030](../../ADR/ADR-030-run-animation-frames-only-while-active.md)に従う。

- `charging`と`moving`ではAnimation Frameを継続実行する
- `ready`と`review`では状態遷移時、Camera変更時、ResizeObserver通知時に1回だけ描画を予約する
- GamePhaseの変更はZustandが所有し、Runtimeは必要な開始・停止要求を受け取る
- 同じRuntimeに複数のSchedulerを接続しない

## 5. ライフサイクル

- Game Screenのmount時にRuntimeと単一のSchedulerを生成する
- unmount、リタイア確定、TOPへの遷移時にAnimation Frameを必ずcancelする
- React Strict Modeでeffectが再実行されてもloopが二重起動しないようcleanupする
- 次のゲームを開始するときは前のEngine、Body対応表、accumulatorを再利用しない

### ページ非表示

- `visibilitychange`でページが非表示になったらAnimation Frameを停止する
- `moving`ではBody状態を維持する
- `charging`では投射せず入力をキャンセルし、Storeを`ready`へ戻す
- `moving`で再表示した場合は基準時刻とaccumulatorを初期化し、非表示中の経過時間を加えず継続実行を再開する
- `ready`または`review`で再表示した場合は必要に応じて1回描画し、継続実行しない
- visibilityイベントを取得できなかった場合などに備え、frame delta上限は維持する

ページ非表示時の外部動作は[`screen-flow-and-input.md`](../specifications/screen-flow-and-input.md)を正本とする。一時停止はRuntimeのライフサイクル状態であり、`GamePhase`へ`paused`は追加しない。

## 6. Runtime終了とsnapshot

全Stoneが停止または盤外になった場合、Runtimeはゲーム進行へ完了を通知し、その時点のStone snapshotを生成する。

snapshotはMatter Bodyそのものを含めず、Stone ID、座標、盤内・盤外など、Scoringと次投射の配置判定に必要な値だけを持つ。Zustandへ同期したsnapshotからMatter Bodyを操作しない。

## 7. Physics設定とCalibration

Physics設定は型付きの共通設定ファイルを正本とし、アプリとStorybookのCalibration Harnessが同じ設定型、Matter Adapter、Physics Runtime、Rendererを利用する。

Calibration Harnessは[ADR-024](../../ADR/ADR-024-calibrate-physics-in-storybook.md)に従い、Storybook Argsを共通設定の一時的な上書きとして渡す。

- パラメータ変更時は既存Runtimeを破棄する
- 選択中プリセットの同じ初期条件で新しいRuntimeを生成する
- Storyの調整値を自動保存しない
- 確認済みの値だけを共通設定へ手動反映する

Calibration StoryとHarnessはStorybook専用モジュールとして配置し、アプリのentry pointからimportしない。productionアプリには調整用Store、Screen、URL分岐を持たせない。
