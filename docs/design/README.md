# Table Curling 設計書

- 状態: Accepted（関連ADRで確定）

## 目的

このディレクトリは、Table Curlingを構成するモジュールの責務、依存方向、連携方法を目的別に管理する。

- [`specifications/`](../specifications/README.md): MVPが何を満たすか
- [`ADR/`](../../ADR/README.md): なぜその方式を選んだか
- `design/`: どのモジュールがどう実現するか
- [`testing-and-deployment.md`](../testing-and-deployment.md): どう正しさを確認し、公開・復旧するか

具体的な動作や数値は仕様書を正本とし、設計書ではその値を利用する責務とデータの流れを定義する。

## 設計書一覧

| 設計書 | 主な目的 | 正本として管理する内容 |
| --- | --- | --- |
| [`system-overview.md`](./system-overview.md) | 全体構造を把握する | 設計原則、レイヤー責務、依存方向、全体データフロー |
| [`state-and-transitions.md`](./state-and-transitions.md) | 状態管理を実装する | 状態型、StoreとRuntimeの所有境界、同期点、画面・ゲーム遷移 |
| [`physics-runtime.md`](./physics-runtime.md) | ゲームループを実装する | Matter Adapter、Runtime、固定更新、snapshot、停止・再開、調整Harness |
| [`rendering-and-input.md`](./rendering-and-input.md) | Canvasと操作を接続する | Renderer、Camera、Resize、描画順、Pointer・キーボード入力 |
| [`external-adapters.md`](./external-adapters.md) | ブラウザ副作用を隔離する | localStorage、Audio、読み込み失敗、Storybook音声調整 |
| [`module-structure.md`](./module-structure.md) | コードを配置する | 推奨ディレクトリ、モジュール境界、import方針 |

## 目的別の読み順

### アプリ全体を実装する

1. [`system-overview.md`](./system-overview.md)
2. [`state-and-transitions.md`](./state-and-transitions.md)
3. [`module-structure.md`](./module-structure.md)

### ゲーム画面を実装する

1. [`physics-runtime.md`](./physics-runtime.md)
2. [`rendering-and-input.md`](./rendering-and-input.md)
3. [`state-and-transitions.md`](./state-and-transitions.md)

### 保存と効果音を実装する

1. [`external-adapters.md`](./external-adapters.md)
2. [`state-and-transitions.md`](./state-and-transitions.md)

## 文書境界

| 設計上の関心 | 正本 |
| --- | --- |
| レイヤー責務と依存方向 | [`system-overview.md`](./system-overview.md) |
| `GameStore`、`Screen`、`GamePhase`、Runtimeとの同期 | [`state-and-transitions.md`](./state-and-transitions.md) |
| Matter Engine、Scheduler、Runtimeライフサイクル | [`physics-runtime.md`](./physics-runtime.md) |
| Renderer、Camera、Canvasサイズ、入力イベントの接続 | [`rendering-and-input.md`](./rendering-and-input.md) |
| localStorageとAudio APIへのアクセス | [`external-adapters.md`](./external-adapters.md) |
| ファイル配置とimport制約 | [`module-structure.md`](./module-structure.md) |

別の設計書で同じ責務へ触れる場合は、詳細を重複定義せず正本へリンクする。

## 更新ルール

- 外部から観測できる動作や数値を変える場合は、先に該当する仕様書を更新する
- 重要な設計判断を変える場合は、既存ADRを書き換えず置換ADRを追加する
- 責務、データフロー、公開境界だけを具体化する変更は該当する設計書を更新する
- 実装によって設計との差異が見つかった場合は、実装と文書のどちらを正すべきか確認してから更新する
