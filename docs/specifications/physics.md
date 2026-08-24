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

2026-08-24のStorybookプレイテストで、次の初速度を採用した。

| 設定 | 採用値 |
| --- | ---: |
| `minSpeed` | 2 |
| `maxSpeed` | 14 |

- Power 1では、最も抵抗の大きいFELT上でも投射位置から40 logical px以上進む
- Power 100では、FELTかつLONGの最大後退位置からでもターゲットへ到達できる

40 logical pxは、[`coordinates-and-rendering.md`](./coordinates-and-rendering.md)で定義したストーン直径と4 logical pxの隙間に相当する。この値を投射位置探索の`minimumTravelDistance`とする。

Powerの時間変化と入力方法は[`screen-flow-and-input.md`](./screen-flow-and-input.md)を正本とする。

## 3. Surface

| Surface | `frictionAir`採用値 | 特性 |
| --- | ---: | --- |
| ICE | 0.004 | 低抵抗 |
| WOOD | 0.008 | 標準 |
| FELT | 0.015 | 高抵抗 |

Surfaceごとの滑りやすさは、初速度を変えずに`frictionAir`の抵抗値で表現する。衝突がない直線投射では、同じPowerに対して`ICE > WOOD > FELT`の順に停止距離が長くなるよう調整する。実際の移動距離には、抵抗に加えてストーン同士の衝突も影響する。

この3値は2026-08-24のStorybookプレイテストで採用した。値の正本は`app/src/config/surfaces.ts`とする。

## 4. 停止判定

停止判定は`Body.speed < 1.00`がPhysics上の経過時間で0.25秒継続することとする。描画フレーム数では判定しない。途中で`Body.speed >= 1.00`になった場合は、そのBodyの継続時間をゼロへ戻す。この閾値と継続時間は2026-08-24のStorybookプレイテストで採用した。

条件成立時は`Body.setVelocity(body, { x: 0, y: 0 })`と`Body.setAngularVelocity(body, 0)`を適用し、停止扱いとする。

Bodyは静的化しない。後続ストーンとの衝突で速度を得た場合は継続時間をリセットして再び運動中とする。

## 5. ストーン同士の衝突

- 全ストーンを同じ半径・密度のMatter.js円形Bodyとする
- 衝突検出、重なり解消、速度伝達はMatter.jsへ委譲する
- 反発係数は全Surfaceで共通の`restitution: 0.85`とし、2026-08-24のStorybookプレイテストで採用した
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

現在の採用値はJSONとしてコピーできるが、自動保存と自動最適化は行わない。Controlsで一時的に変更した値も実行中の設定ファイルへ自動反映しない。再調整する場合は、内容を確認したうえで共通Physics設定ファイルへ手動反映し、Vitestと実際のゲームプレイで再検証する。

## 8. 採用時の測定結果

Matter.js 0.20.0を`1000 / 120`ミリ秒の固定タイムステップで実行し、2026-08-24に次の結果を確認した。距離はlogical pxである。

| 条件 | 測定結果 |
| --- | ---: |
| FELT、SHORT、Power 1の停止距離 | 79.5141 |
| ICE、SHORT、Power 1の停止距離 | 263.9371 |
| WOOD、SHORT、Power 1の停止距離 | 138.1883 |
| FELT、LONG最大後退、Power 100のターゲット最小中心距離 | 0.2260 |
| 同条件の停止までのPhysics step | 380 |
| WOOD、LONG、Power 100の正面衝突で対象Stoneが得た最大速度 | 7.4255 |

FELTのPower 1は最低移動距離40を満たす。同じ初速度2に対する停止距離は`ICE > WOOD > FELT`である。FELT・LONG最大後退のPower 100は、移動中にターゲット中心から120以内へ入る。最大初速度14の正面衝突では、対象Stoneへ速度が伝わり、Stoneの順序が逆転するすり抜けは発生しない。
