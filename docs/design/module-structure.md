# モジュール構成設計

- 状態: Accepted（関連ADRで確定）

## 1. 推奨ディレクトリ

```text
ADR/
docs/
app/
├─ .storybook/
├─ e2e/
├─ public/
│  └─ audio/
└─ src/
   ├─ components/
   │  └─ *.stories.tsx
   ├─ screens/
   ├─ game/
   │  ├─ audio/
   │  │  ├─ audioAdapter.ts
   │  │  └─ __stories__/
   │  │     └─ CollisionAudioCalibration.stories.tsx
   │  ├─ physics/
   │  │  ├─ matterAdapter.ts
   │  │  ├─ createBodies.ts
   │  │  ├─ gamePhysicsRules.ts
   │  │  └─ __stories__/
   │  │     ├─ PhysicsCalibration.stories.tsx
   │  │     └─ PhysicsCalibrationHarness.tsx
   │  ├─ runtime/
   │  ├─ renderer/
   │  ├─ scoring/
   │  └─ types.ts
   ├─ persistence/
   ├─ stores/
   ├─ config/
   │  ├─ audio.ts
   │  ├─ physics.ts
   │  └─ surfaces.ts
   └─ test/
```

アプリ本体、依存関係、公開素材、開発・テスト設定は[ADR-033](../../ADR/ADR-033-self-contained-static-spa-under-app.md)に従って`app/`へ自己完結させる。リポジトリルートにNode.jsのpackage管理ファイルを置かず、npmコマンドは`app/`で実行する。

実装開始時は責務に必要な最小ファイルだけを作成する。上記の構成を満たすために、空ディレクトリや利用しない抽象化を先に作らない。

## 2. モジュール境界

### `screens/`と`components/`

- React、MUI、Zustandを利用して画面と操作を構成する
- Game ScreenはRuntimeとCanvasのライフサイクルを接続する
- Game ScreenはRuntimeのゲームイベントをAudio Adapterの公開境界へ接続する
- Matter.js API、localStorage、Audio APIを直接呼ばない

### `game/physics/`

- Matter.js固有のEngine・Body操作を閉じ込める
- DOM、Canvas、React、Zustandへ依存しない
- ゲーム固有の停止・盤外ルールをMatter Adapterから呼び出せる形にする

### `game/runtime/`

- Physics RuntimeとSchedulerを配置する
- Matter Adapterの公開境界を利用する
- ReactコンポーネントとZustandをimportしない
- Storeへ渡すsnapshotとゲームイベントを公開する

### `game/renderer/`

- Canvas描画とCamera変換を配置する
- Runtime snapshotと描画設定だけを入力にする
- 状態遷移とMatter Engineの更新を行わない

### `game/scoring/`

- Stone snapshotから得点を計算する純粋TypeScriptを配置する
- Matter.js、Zustand、DOM、Canvas、ブラウザAPIへ依存しない

### `game/audio/`

- Audio Adapter、音源読込、再生制御、音声調整Storyを配置する
- 音声の成否をゲーム進行へ返さない

### `stores/`

- Screen、GamePhase、ゲーム設定、確定Resultなどを管理する
- 毎フレームのBody座標と速度を保持しない
- Matter.js APIを直接呼ばない

### `persistence/`

- ハイスコアと効果音設定の読込、検証、保存を配置する
- Store全体や途中ゲームをシリアライズしない
- Physics Runtime、Renderer、Scoringをimportしない
- Zustand Storeをimportせず、保存に必要な値を引数として受け取る

### `config/`

- アプリとStorybookで共有する型付き設定を配置する
- production値を正本とし、Storybookの一時上書きを保存しない

## 3. 依存ルール

```text
screens / components
    ├─→ stores
    ├─→ game/runtime の公開境界
    ├─→ game/renderer の公開境界
    └─→ game/audio の公開境界

game/runtime
    ├─→ game/physics
    └─→ game/types

game/renderer
    └─→ game/types

game/scoring
    └─→ game/types

game/audio
    └─→ config/audio

stores
    └─→ persistence
```

- 下位モジュールから`screens/`、`components/`、`stores/`をimportしない
- Runtime、Renderer、Scoring間ではMatter Bodyではなく、共有するゲーム型を受け渡す
- 循環importを作らない
- ブラウザ副作用を持つモジュールを純粋なゲームルールからimportしない

## 4. Storybook専用コード

Calibration StoryとHarnessは`__stories__/`またはStorybook専用ファイルへ配置する。

- アプリのentry pointからimportしない
- productionの`dist/`へ含めない
- 共通Runtime、Renderer、設定型はアプリと共有する
- Storybook Argsによる設定変更は実行中のRuntimeへ途中適用せず、Runtimeを再生成する

テストの配置と実行方法は[`testing-and-deployment.md`](../testing-and-deployment.md)を参照する。
