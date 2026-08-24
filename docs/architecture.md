# アーキテクチャ

- 状態: Accepted（関連ADRで確定）

詳細設計は、目的別に[`design/`](./design/README.md)へ分割した。この文書は既存リンクとの互換性を保つ全体入口とする。

## 詳細設計

| 設計書 | 内容 |
| --- | --- |
| [`design/README.md`](./design/README.md) | 設計書全体の案内、目的別の読み順、文書境界 |
| [`system-overview.md`](./design/system-overview.md) | 設計原則、レイヤー責務、依存方向、全体データフロー |
| [`state-and-transitions.md`](./design/state-and-transitions.md) | 状態型、StoreとRuntimeの所有境界、同期点、画面・ゲーム遷移 |
| [`physics-runtime.md`](./design/physics-runtime.md) | Matter Adapter、Runtime、固定更新、snapshot、停止・再開 |
| [`rendering-and-input.md`](./design/rendering-and-input.md) | Renderer、Camera、Resize、描画順、Pointer・キーボード入力 |
| [`external-adapters.md`](./design/external-adapters.md) | localStorage、Audio、読み込み失敗、音声調整 |
| [`module-structure.md`](./design/module-structure.md) | 推奨ディレクトリ、モジュール境界、import方針 |

## 関連文書

- [`specifications/README.md`](./specifications/README.md): MVPが満たす具体的な動作と数値
- [`ADR/README.md`](../ADR/README.md): 重要な設計判断と置換履歴
- [`testing-and-deployment.md`](./testing-and-deployment.md): 検証方法、公開手順、ロールバック
