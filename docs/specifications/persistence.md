# データ保存仕様

- 状態: Accepted（MVP仕様確定）

## 1. 保存対象

永続化するゲーム関連データはハイスコアだけとする。ユーザー設定として、効果音のON/OFFを別キーへ保存する。

Zustand Store全体やゲーム途中の状態は永続化しない。

## 2. ハイスコア

保存方式は[ADR-010](../../ADR/ADR-010-store-category-high-scores-locally.md)に従う。

Surface 3種類と投射距離3種類を組み合わせた9カテゴリーごとに、上位3件を保存する。

保存先は`localStorage`、保存キーは`table-curling.high-scores.v1`とする。

```ts
type HighScoreRecord = {
  score: number;
  achievedAt: string; // ISO 8601
};
```

得点の降順、同点なら`achievedAt`の降順とし、新しい記録を上位にする。

ハイスコアは5投目に関係する全ストーンが停止または盤外になり、最終得点が確定した時点で一度だけ更新する。「結果を見る」の押下有無は保存結果に影響しない。

スコア確認画面ではSurfaceを大カテゴリー、投射距離を切り替え項目として、選択中カテゴリーの上位3件を表示する。画面操作の詳細は[`screen-flow-and-input.md`](./screen-flow-and-input.md)を参照する。

## 3. 効果音設定

効果音のON/OFFは`localStorage`の`table-curling.sound-enabled.v1`へBooleanとして保存する。再生動作と初期値は[`audio.md`](./audio.md)を正本とする。

このキーはゲーム途中の状態を保存する目的には使用しない。

## 4. 保存しない状態

次の状態は永続化しない。

- ゲーム途中のSurface
- 投射距離
- 投数
- ストーン
- Power
- `Screen`
- `GamePhase`
- Camera
- 暫定得点
- リタイア回数

途中でタブを閉じるか再読み込みした場合、そのゲームと画面位置は破棄され、次回は`top`から開始する。途中再開と復元確認は提供しない。

ページが一時的に非表示になっただけの場合は永続化せず、メモリ上のゲームを一時停止する。再表示時の動作は[`screen-flow-and-input.md`](./screen-flow-and-input.md)を参照する。
