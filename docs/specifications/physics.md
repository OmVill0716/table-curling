# 物理演算仕様

- 状態: Accepted（MVP仕様確定）

## 1. 基本方針

Physics EngineにはMatter.jsを使う。詳細は[ADR-008](../../ADR/ADR-008-use-matter-js.md)を参照する。

距離はlogical pxとして扱い、Matter.jsの`Engine.update`を`1000 / 120`ミリ秒の固定タイムステップで呼び出す。時間制御の詳細は[ADR-002](../../ADR/ADR-002-fixed-timestep-physics.md)を参照する。

Physics Worldの寸法、ターゲット中心、ストーン半径、投射位置は[`coordinates-and-rendering.md`](./coordinates-and-rendering.md)を正本とする。

## 2. Powerと初速度

Power 1は短い距離でも必ずストーンが動く最低初速、Power 100は最大初速へ対応させる。

PowerからMatter.js Bodyの初速度への変換は線形とする。Power 1を`minSpeed`、Power 100を`maxSpeed`へ対応させ、同じPowerならSurfaceにかかわらず同じ初速度を与える。

```ts
const normalizedPower = (power - 1) / 99;
const speed = minSpeed + normalizedPower * (maxSpeed - minSpeed);
```

初速度は、各投射位置からターゲット中心へ向かう単位ベクトルへ`speed`を掛けて与える。プレイヤーによる角度操作は行わない。

`minSpeed`と`maxSpeed`の具体値は未検証のため、プレイテストで調整する。

- Power 1では、最も抵抗の大きいFELT上でも投射位置から40 logical px以上進む
- Power 100では、FELTかつLONGの最大後退位置からでもターゲットへ到達できる

40 logical pxは、[`coordinates-and-rendering.md`](./coordinates-and-rendering.md)で定義したストーン直径と4 logical pxの隙間に相当する。この値を投射位置探索の`minimumTravelDistance`とする。

Powerの時間変化と入力方法は[`screen-flow-and-input.md`](./screen-flow-and-input.md)を正本とする。

## 3. Surface

| Surface | Matter.js設定 | 特性 |
| --- | --- | --- |
| ICE | `frictionAir`低 | 低抵抗 |
| WOOD | `frictionAir`中 | 標準 |
| FELT | `frictionAir`高 | 高抵抗 |

Surfaceごとの滑りやすさは、初速度を変えずに`frictionAir`の抵抗値で表現する。衝突がない直線投射では、同じPowerに対して`ICE > WOOD > FELT`の順に停止距離が長くなるよう調整する。実際の移動距離には、抵抗に加えてストーン同士の衝突も影響する。

`frictionAir`と最終的な停止閾値は未検証のため、プレイテストで調整する。

## 4. 停止判定

停止判定の初期値は`Body.speed < 1.00`がPhysics上の経過時間で0.25秒継続することとする。描画フレーム数では判定しない。途中で`Body.speed >= 1.00`になった場合は、そのBodyの継続時間をゼロへ戻す。

条件成立時は`Body.setVelocity(body, { x: 0, y: 0 })`と`Body.setAngularVelocity(body, 0)`を適用し、停止扱いとする。

Bodyは静的化しない。後続ストーンとの衝突で速度を得た場合は継続時間をリセットして再び運動中とする。速度閾値`1.00`はプレイテスト用の初期値であり、停止が不自然に見える場合は調整する。

## 5. ストーン同士の衝突

- 全ストーンを同じ半径・密度のMatter.js円形Bodyとする
- 衝突検出、重なり解消、速度伝達はMatter.jsへ委譲する
- 反発係数は全Surfaceで共通とし、実装開始時は`restitution: 0.85`とする
- 最終的な反発係数は、衝突時に少し速度を失いながらも100点位置のストーンを後続ストーンで弾き出せる範囲へプレイテストで調整する
- 衝突後の各ストーンには、選択中Surfaceの`frictionAir`が引き続き作用する
- 固定タイムステップを使い、調整後の最大初速度における正面衝突ですり抜けないことを確認する

## 6. 盤外

境界の方式は[ADR-014](../../ADR/ADR-014-use-out-of-bounds-on-all-edges.md)に従う。

- 盤面の四辺にMatter.jsの静的な反射壁を作成しない
- ストーン全体が左端、右端、上端、Physics World下端のいずれかを越えた時点、すなわち中心が`x < -18`、`x > 618`、`y < -18`、`y > 1518`のいずれかを満たした時点で盤外とする
- 盤外ストーンは描画、摩擦、衝突判定から除外するが、Result用データには0点として残す

## 7. パラメータ調整

調整方法は[ADR-024](../../ADR/ADR-024-calibrate-physics-in-storybook.md)に従う。productionアプリには調整画面やデバッグ用URLを設けず、Storybookの`Physics Calibration` Storyで調整する。

Storybook ControlsからPower、`minSpeed`、`maxSpeed`、Surfaceごとの`frictionAir`、共通`restitution`、停止速度、停止継続時間を変更できるようにする。変更時は実行中のBodyへ値を途中適用せず、選択中プリセットの同じ初期条件からRuntimeを作り直す。

Calibration StoryではCanvasに加え、現在速度、投射開始地点からの移動距離、World座標、停止理由を表示する。最低PowerのFELT直線投射、最大PowerのFELT・LONG、3 Surfaceの直線距離比較、正面衝突、停止判定を個別のプリセットとして再現できるようにする。

採用候補値はJSONとしてコピーできるが、自動保存と自動最適化は行わない。内容を確認したうえで共通Physics設定ファイルへ手動反映し、Vitestと実際のゲームプレイで再検証する。
