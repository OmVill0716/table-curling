# Table Curling MVP仕様書

- 状態: Accepted（MVP仕様確定）

## 目的

このディレクトリは、Table CurlingのMVPが満たす具体的な動作と数値の正本を、目的別に管理する。

- 仕様書: 何を満たすか
- [`design/`](../design/README.md): React、Zustand、Physics Runtime、Rendererがどう責務を分担するか
- [`ADR/`](../../ADR/README.md): なぜその方式を選んだか
- [`table-curling-react-cloudflare-issue.md`](../../table-curling-react-cloudflare-issue.md): 目的、スコープ、受け入れ条件

仕様変更では、最初に要求の原典であるIssueへの影響を確認する。具体的な動作や数値は該当する仕様書だけを正本として更新し、重要な設計判断を変更するときは新しいADRで置き換える。

## 仕様書一覧

| 仕様書 | 主な目的 | 正本として管理する内容 |
| --- | --- | --- |
| [`game-rules.md`](./game-rules.md) | ゲームルールを確認する | 5投制、選択カテゴリー、進行、採点、Result |
| [`coordinates-and-rendering.md`](./coordinates-and-rendering.md) | 盤面と描画を実装する | World座標、Camera、投射位置、Canvas変換、盤面表現 |
| [`physics.md`](./physics.md) | 物理挙動を実装・調整する | 初速度、固定タイムステップ、抵抗、停止、衝突、盤外 |
| [`screen-flow-and-input.md`](./screen-flow-and-input.md) | 画面と操作を実装する | 画面遷移、GamePhase、Power Gauge、レスポンシブ、非表示時の動作 |
| [`persistence.md`](./persistence.md) | 保存処理を実装する | ハイスコア、効果音設定、保存しない途中状態 |
| [`audio.md`](./audio.md) | 効果音を実装・調整する | 音源割り当て、再生条件、事前読込、衝突音制御 |

## 目的別の読み順

### ゲーム画面を実装する

1. [`game-rules.md`](./game-rules.md)
2. [`screen-flow-and-input.md`](./screen-flow-and-input.md)
3. [`coordinates-and-rendering.md`](./coordinates-and-rendering.md)

### 物理演算を実装・調整する

1. [`coordinates-and-rendering.md`](./coordinates-and-rendering.md)
2. [`physics.md`](./physics.md)
3. [`../testing-and-deployment.md`](../testing-and-deployment.md)

### 周辺機能を実装する

- 記録: [`persistence.md`](./persistence.md)
- 効果音: [`audio.md`](./audio.md)

## 文書境界

複数分野に関係する仕様値は、次の文書だけを正本とする。

| 仕様値・動作 | 正本 |
| --- | --- |
| 得点条件、確定タイミング、Result表示 | [`game-rules.md`](./game-rules.md) |
| World寸法、ターゲット中心、ストーン半径、投射位置 | [`coordinates-and-rendering.md`](./coordinates-and-rendering.md) |
| Powerから初速度への変換、抵抗、停止、衝突、盤外 | [`physics.md`](./physics.md) |
| Powerの時間変化、入力、画面遷移、GamePhase | [`screen-flow-and-input.md`](./screen-flow-and-input.md) |
| localStorageの保存対象とキー | [`persistence.md`](./persistence.md) |
| 音源、再生条件、音量、クールダウン | [`audio.md`](./audio.md) |

別の仕様書で同じ概念が必要な場合は、値を重複定義せず正本へリンクする。
