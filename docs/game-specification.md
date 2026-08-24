# MVPゲーム仕様

- 状態: Accepted（MVP仕様確定）

MVPの詳細仕様は、目的別に[`specifications/`](./specifications/README.md)へ分割した。この文書は既存リンクとの互換性を保つ全体入口とする。

## 詳細仕様

| 仕様書 | 内容 |
| --- | --- |
| [`specifications/README.md`](./specifications/README.md) | 仕様書全体の案内、目的別の読み順、文書境界 |
| [`game-rules.md`](./specifications/game-rules.md) | 5投制、選択カテゴリー、進行、採点、Result |
| [`coordinates-and-rendering.md`](./specifications/coordinates-and-rendering.md) | World座標、Camera、投射位置、Canvas変換、盤面表現 |
| [`physics.md`](./specifications/physics.md) | 初速度、固定タイムステップ、抵抗、停止、衝突、盤外 |
| [`screen-flow-and-input.md`](./specifications/screen-flow-and-input.md) | 画面遷移、GamePhase、Power Gauge、レスポンシブ、非表示時の動作 |
| [`persistence.md`](./specifications/persistence.md) | ハイスコア、効果音設定、保存しない途中状態 |
| [`audio.md`](./specifications/audio.md) | 音源割り当て、再生条件、事前読込、衝突音制御 |

## 関連文書

- [`design/README.md`](./design/README.md): React、Zustand、Physics Runtime、Rendererの責務とデータフロー
- [`testing-and-deployment.md`](./testing-and-deployment.md): 検証方法、Cloudflare Pagesへの公開手順、ロールバック
- [`ADR/`](../ADR/README.md): 重要な設計判断と、その理由・影響
