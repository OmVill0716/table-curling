# Issue: React + Zustand + Material UI でテーブルカーリング風ゲームを作る

## 概要

React / Zustand / Material UI を使って、1人用のテーブルカーリング風ミニゲームを実装する。

今回の主目的は、ブラウザ上で物理演算を伴う動的画面を成立させ、1ゲームを最後まで遊べる形へ完成させることである。その実装を通じて、以下を検証する。

- React でどこまでゲームを作れるか確認する
- ブラウザ上で簡易的な物理演算をどこまで実装できるか確認する
- Zustand をゲーム状態管理に使った場合、どこまで自然に責務分離できるか確認する
- 完成したSPAを Cloudflare Pages の無料枠で公開する

対戦、ランキング、バックエンド、ユーザー登録などは実装しない。

---

## ゴール

プレイヤーが円形ボタンのタップ、クリック、またはキーボード操作で投射強度を決め、ストーンをターゲットへ滑らせる。

複数回投射したあと、最終的に円形ターゲット上へ残っているストーンの点数を合計し、1ゲームのスコアとする。

また、摩擦係数の異なる3種類のテーブルを選択できるようにする。

- ICE
- WOOD
- FELT

---

## 技術構成

### Frontend

- React
- TypeScript
- Vite
- Zustand
- Material UI

### Testing

- Vitest
- Storybook + Vitest Addon
- Playwright

### Physics

- Matter.js

### 描画

ゲーム盤面の描画にはHTML Canvas 2D Contextを採用する。

Material UI はゲーム盤面そのものの描画には使用せず、以下のUIを担当する。

- フィールド・投射距離選択
- 投射強度表示
- 現在の投数
- スコア表示
- ゲーム終了画面
- Retry ボタン

---

## アーキテクチャ方針

React / Zustand / Physics / Renderer の責務を分離する。

```text
React
  └─ UI / Screen

Zustand
  └─ Game State

Physics
  └─ Matter.js + Game Rules

Renderer
  └─ HTML Canvas
```

Matter.jsとゲーム固有の物理ルールはReactコンポーネントへ直接埋め込まず、Adapter / Runtimeとして分離する。

例:

```ts
Matter.Engine.update(engine, FIXED_STEP_MS);
```

---

## Zustand の責務

Zustand には「ゲームとして意味のある状態」を持たせる。

例:

```ts
type SurfaceType = "ice" | "wood" | "felt";

type Screen =
  | "top"
  | "fieldSelect"
  | "lengthSelect"
  | "selectionConfirm"
  | "game"
  | "result"
  | "score"
  | "howToPlay";

type GamePhase =
  | "ready"
  | "charging"
  | "moving"
  | "review";

type StoneResult = {
  id: string;
  x: number;
  y: number;
  inPlay: boolean;
  score: number;
};

type GameState = {
  screen: Screen;
  surface: SurfaceType | null;
  shotDistance: "short" | "medium" | "long" | null;
  gamePhase: GamePhase | null;
  completedShots: number;
  maxShots: 5;
  displayedPower: number | null;
  result: {
    stones: StoneResult[];
    totalScore: number;
  } | null;
};
```

正確な状態モデルは[`docs/design/state-and-transitions.md`](./docs/design/state-and-transitions.md)を正本とする。

### Zustand に持たせるもの

- 現在の画面とGame Screen内の状態
- 選択中のSurfaceと投射距離
- 完了投数
- 最大投数
- 停止時のストーンsnapshot
- 確定済みResult
- カテゴリー別ハイスコア
- 効果音のON/OFF
- UI上で必要な投射強度

### Zustand に持たせないもの

毎フレーム高頻度で更新される以下の値は、まずPhysics側で保持する。

- x
- y
- vx
- vy
- deltaTimeごとの中間状態

必要に応じて、停止時やゲーム状態変更時にZustandへ同期する。

---

## ゲームループ

描画・物理更新には `requestAnimationFrame` を使用する。`charging`と`moving`だけ継続実行し、`ready`と`review`では状態変更、Camera変更、リサイズ時に1回だけ描画する。Game以外の画面とページ非表示中はGame用Animation Frameを動かさない。

```text
requestAnimationFrame
        ↓
deltaTime計算
        ↓
Physics更新
        ↓
Canvas描画
        ↓
停止判定
        ↓
必要時のみZustand更新
```

Reactの再レンダリングを毎フレームのゲームループとして使わない。

---

## 基本ゲーム仕様

### プレイ人数

- 1人

### 1ゲームの投数

初期値:

- 5投

定数または設定値として変更可能にする。

### 投射方法

Canvas外に円形の投射ボタンを表示し、タッチとマウスで共通利用する。

長押し中に往復するPower Gaugeの値で投射強度を決定する。

```text
pointerdown
    ↓
Power 1 → 100 → 1 → 100 ...
    ↓
pointerup
    ↓
投射
```

Powerは1から100まで1.5秒、100から1まで1.5秒で直線的に変化し、ボタンを押している限り3秒周期で往復を繰り返す。離した瞬間のPowerで投射する。

Power 1は短い距離でも必ずストーンが動く最低初速とする。未操作時はPower 0を表示せず、ゲージを非表示または`—`表示にする。

投射方向は、各投射位置からターゲット中心へ向かう方向に固定する。MVPではプレイヤーによる角度変更を実装しない。

### 投射距離

ゲーム開始前にユーザーが以下の3段階から1つを選択し、そのゲームの5投中は固定する。

```text
SHORT   520 logical px
MEDIUM  620 logical px
LONG    720 logical px
```

ターゲット位置とターゲット奥側の盤面端は固定し、選択された距離に応じて投射位置を変更する。ゲームプレイのフィールド選択画面と長さ選択画面で設定し、選択内容確認画面を経て開始する。Game ScreenとResult Screenには選択された距離名を表示する。

Physics Worldは`600 × 1500 logical px`とし、通常の表示窓は`600 × 1000 logical px`相当とする。`y = 1000〜1500`は投射側のバッファとして確保する。

最低Powerでも、最も抵抗の大きいFELT上で投射位置から40 logical px以上進むよう最低初速度を調整する。これはストーン直径36 logical pxと4 logical pxの隙間に相当する。

次のストーンが投射後40 logical px進む前に既存ストーンへ衝突する場合、投射位置を投射側へストーン直径36 logical pxずつ移動し、40 logical pxの進路を確保できる最も近い位置を使う。5投目までの初期対応範囲は基本投射位置から最大144 logical pxとする。投射距離カテゴリーとハイスコアカテゴリーは変更しない。

RendererはPhysics Worldの座標を表示窓へ変換する。通常は基本盤面を表示し、投射位置を後退させる場合はターゲットの得点範囲と投射ストーンが同時に見えるようカメラ位置と表示倍率を調整する。

---

## ストーン

ストーンは円形オブジェクトとして扱う。

例:

```ts
type Stone = {
  id: string;

  x: number;
  y: number;

  vx: number;
  vy: number;

  radius: number;

  stopped: boolean;
};
```

---

## 物理演算

Physics EngineにはMatter.jsを使用する。

今回の目的は衝突ソルバーを独自実装することではなく、React / Zustand / Canvasと物理演算を連携し、モバイルとPCで遊べるゲームを完成させることである。

### 基本更新

Matter.js Engineを固定タイムステップで更新する。

```ts
Matter.Engine.update(engine, 1000 / 120);
```

Matter.jsの組み込みRenderer / Runnerは使用せず、独自Canvas Rendererとゲームループを使用する。

---

## テーブル種類

3種類のテーブルを実装する。

### ICE

低摩擦。

特徴:

- 非常によく滑る
- 弱い入力でも長距離移動する
- 微妙な強度調整が重要

### WOOD

標準摩擦。

特徴:

- 基準ステージ
- 最も扱いやすい
- 他ステージとの比較対象

### FELT

高摩擦。

特徴:

- 減速が早い
- 強めに投射する必要がある
- 直進性は維持する

### 設定方針

Surface差にはMatter.js Bodyの`frictionAir`を利用する。具体値は未検証のため、同じ初速で`ICE > WOOD > FELT`の順に停止距離が長くなり、全投射距離へ到達可能になるようStorybookのPhysics Calibration Storyと実際のゲームプレイで調整する。

---

## ストーン停止判定

実装開始時は、Matter.jsの`Body.speed < 1.00`がPhysics上の経過時間で0.25秒継続したストーンを停止扱いとする。途中で`Body.speed >= 1.00`になった場合は継続時間をリセットする。条件成立時に線形速度と角速度をゼロにし、完全なゼロへ自然に到達することは待たない。

停止後もBodyは動的Bodyとして残す。後続ストーンとの衝突で速度を得た場合は継続時間をリセットし、再び運動中とする。速度閾値`1.00`はプレイテスト用の初期値であり、停止が不自然に見える場合は調整する。

---

## ストーン同士の衝突

ストーンを同じ半径・密度のMatter.js円形Bodyとして作成し、衝突検出と衝突解決はMatter.jsへ委譲する。

全Surfaceで共通の反発係数を使い、実装開始時の値は`0.85`とする。最終値は実際のゲームをプレイし、衝突時に少し速度を失いながらも標的ストーンを十分に弾ける範囲へ調整する。

衝突時は、最低限以下を満たすこと。

- ストーン同士が重なり続けない
- ぶつかった側から速度が伝わる
- 100点位置のストーンを後続ストーンで弾き出せる

ゲームとして自然に見えることを優先する。

---

## コースアウト

- 盤面の四辺に反射壁を設けない
- 左右、ターゲット奥側、Physics Worldの投射側終端のいずれかからストーン全体が出た場合は盤外とし、0点にする
- 固定方向の投射から生じる横方向の移動は、ストーン同士の衝突によって発生する

---

## ターゲット / 得点

ターゲットは同心円として描画する。

例:

```text
中心        100点
第1リング    50点
第2リング    30点
第3リング    10点
外側          0点
```

得点はストーン停止後の中心座標とターゲット中心の距離から判定する。

```ts
const distance = Math.hypot(
  stone.x - target.x,
  stone.y - target.y
);
```

プレイ中は同じ判定から現在位置の暫定得点を求め、ストーンを対応する得点リングと共通の色へ動的に変える。暫定得点と色は最終得点として保存しない。

得点色の初期値は、100点を赤`#D32F2F`、50点をオレンジ`#F57C00`、30点を黄`#FBC02D`、10点を青`#1976D2`、0点をグレー`#757575`とする。ストーンには暗色の輪郭線を付ける。

ターゲットには固定配点として、中心へ赤い`100`、50点リング上側へオレンジの`50`、30点リング上側へ黄色の`30`、10点リング上側へ青い`10`を常時表示する。数字にはSurfaceとリング色の上でも読める高コントラストの輪郭または背景を付ける。ターゲット外の0点領域には固定の`0`を表示しない。

Game Screenでは固定配点以外に、各ストーンの現在得点、暫定合計、得点変化ポップアップを表示しない。プレイ中はストーンの色だけを現在位置に応じて動的に変え、ストーン上には得点数値を表示しない。

5投目に関係する全ストーンの停止時に最終得点を内部で一度だけ確定するが、同投目の投射結果確認中も各ストーンの確定得点と合計得点は表示しない。「結果を見る」の押下後、Result Screenで初めて各ストーンの確定得点と合計得点をHTMLテキストとして表示する。

### 採点タイミング

各投射直後ではなく、

**全投射終了後、最終的に盤面上へ残っているストーンの位置から再計算する。**

これにより、

```text
1投目
100点

↓

後続ストーンが衝突

↓

100点位置から押し出される

↓

最終スコアは変化
```

というゲーム性を成立させる。

---

## ゲーム進行

```text
TOP
    └─ ゲームプレイ
          ↓
      フィールド選択
          ↓
        長さ選択
          ↓
       選択内容確認
          ↓
       Game Start
    ↓
Power決定
    ↓
Stone発射
    ↓
Physics Loop
    ↓
Stone停止
    ↓
投射結果確認
    ├─ 1〜4投目: 「次の投射へ」
    │               ↓
    │             次の投射
    │
    └─ 5投目: 全Stone採点・ハイスコア保存
                    ↓
                 「結果を見る」
                    ↓
                  Result
    ↓
Retry
```

5投目の停止・最終結果確定より前は、Game Screenからリタイアできる。確認後にゲーム途中の状態を破棄し、Resultを表示せずTOPへ戻る。リタイアしたゲームの得点、投数、ストーン、リタイア回数は保存しない。5投目停止後はリタイアを表示せず、「結果を見る」で既定の完了後フローへ進む。Resetは実装しない。

Game Screenでページが非表示になった場合はゲームを自動停止する。`moving`ではStoneの位置と速度を維持し、再表示後に同じ状態から自動再開する。`charging`では投射せずPower計測をキャンセルして`ready`へ戻し、`ready`と`review`はそのまま維持する。非表示中の実時間はPower、Physics accumulator、停止判定の継続時間へ加算せず、再開操作は要求しない。

一時停止は途中保存ではない。非表示中にタブを閉じる、再読み込みする、またはブラウザがページを破棄した場合は、未完了ゲームを失って次回はTOPから開始する。

---

## 画面構成

### 1. TOP

表示:

- タイトル「テーブルカーリング」
- 「ゲームプレイ」
- 「スコア確認」
- 「遊び方」
- 効果音のON/OFF。初期値はON

### 2. フィールド選択

- ICE
- WOOD
- FELT
- 戻る

### 3. 長さ選択

- SHORT
- MEDIUM
- LONG
- 戻る

### 4. 選択内容確認

- 選択したフィールド
- 選択した長さ
- ゲーム開始
- 戻る

---

### 5. Game Screen

表示:

- ゲーム盤面
- 投射強度
- `Shot 1 / 5`
- 現在選択中Surface

操作:

- 投射
- 1〜4投目の停止後に表示する「次の投射へ」
- 5投目の停止後に表示する「結果を見る」
- 5投目の停止・最終結果確定より前の未完了ゲームを破棄する「リタイア」

---

### 6. Result Screen

表示:

- 最も大きく表示するFinal Score
- Shot 1〜5を投射順に並べた得点内訳
- 盤内ストーンの最終色と得点
- 盤外ストーンの`OUT / 0`表示
- 選択したSurfaceと投射距離
- 上位3件へ入った場合の`NEW HIGH SCORE`と順位
- 同じSurface・距離で再プレイする`Retry`
- 確認なしで選択を解除して戻る`TOPへ`

ハイスコア圏外の場合は順位を表示しない。座標値と途中得点は表示しない。同点順位はハイスコアの並び順と同じく、新しい記録を上位とする。

### 7. スコア確認

- フィールドごとのタブ
- 長さのタブ
- 選択カテゴリーの上位3件
- TOPへ

### 8. 遊び方

- ゲームの目的
- Surfaceごとの滑りやすさとSHORT・MEDIUM・LONGの投射位置の違い
- Power Gaugeの操作
- 投射方向がターゲット中心へ固定されること
- 5投と「次の投射へ」の進行
- 5投目停止後の「結果を見る」
- ストーン同士の衝突
- ターゲットの色付き数字が固定配点であること
- ストーン色が現在位置に応じて変わること
- 四辺のコースアウト
- 各ストーンの確定得点と合計得点はResultで初めて表示すること
- リタイアでは未完了ゲームを保存せずTOPへ戻ること
- タブを閉じるか再読み込みすると未完了ゲームが失われること
- 効果音をTOPでON/OFFできること
- TOPへ

遊び方はTOPから任意に開く静的な1画面とする。初回起動時の強制表示、既読保存、チュートリアル進捗は設けず、内容が表示領域を超える場合は縦スクロールを許可する。

---

## UIデザイン

Material UIを利用する。

ゲーム盤面はHTML Canvasで表現する。投射ボタン内の目盛りなど、HTML UIの装飾にはSVGを使用できる。

- タップとマウスはPointer Eventsで共通化し、投射ボタンはSpaceとEnterでも操作できるようにする
- 主要操作のタップ領域は最低44 × 44 CSS pxとし、キーボードフォーカスを視認できるようにする
- 投射ボタンの用途、現在Power、増減方向をHTML上でも取得可能にし、色だけを唯一の情報にしない
- `prefers-reduced-motion: reduce`では装飾的なアニメーションを停止または即時完了する。ただしPowerの往復、ストーンの運動、衝突、Camera表示はゲーム進行に必要なため維持する
- ページ全体のピンチズームは無効化しない

Surfaceごとに盤面デザインを変更する。

### ICE

- 氷を連想できる明るいテーブル

### WOOD

- 木目調

### FELT

- フェルト生地風

ただし画像素材を必須としない。

CSS / Canvasの色・パターン等で簡易表現してよい。

---

## 効果音

- 投射、ストーン同士の衝突、全ストーンの停止、コースアウトに効果音を付ける
- BGMと端末の振動は実装しない
- TOPでON/OFFを切り替えられ、初期値はONとする
- ユーザー操作前には再生しない
- OFFでは再生を開始せず、切り替え時に再生中の音があれば停止する
- 音声再生に失敗してもゲーム進行、Physics、採点を継続する
- 効果音は状態を知る唯一の手段にせず、画面上でも判別できるようにする
- 効果音はKenneyのCC0素材をOgg Vorbisのまま同梱し、出典・元ファイル名・ハッシュ・ライセンスを`app/public/audio/README.md`へ記録する
- 投射は`/audio/shot.ogg`、ストーン衝突は`/audio/stone-collision.ogg`、全ストーン停止は`/audio/all-stones-stopped.ogg`、コースアウトは`/audio/out-of-bounds.ogg`を使用する
- TOP表示後に4音源をバックグラウンドで読み込み、最初のユーザー操作時に音声機能の有効化を試みる
- 未準備または再生不能な音はゲームを待たせず、そのイベントの音を後から再生しない
- ストーン衝突音は衝突開始時だけを候補とし、弱い接触を除外する。同一Physicsステップでは最も相対速度が大きい1件だけを候補にし、再生後250msは次の衝突音を鳴らさない
- 衝突音の初期音量は35%とし、弱い接触の閾値を含む数値はStorybookで試聴して調整する

---

## 著作物・アセット方針

既存ゲームの以下を流用しない。

- キャラクター
- ロゴ
- UI
- 盤面
- 画像
- 音楽
- 効果音

ゲームルールも特定製品を再現するのではなく、

「円形ターゲットへストーンを滑らせて得点する」

という独自ミニゲームとして実装する。

必要な画像・効果音を追加する場合は、

- 自作
- Public Domain
- 利用条件を確認した素材

のみ使用する。

---

## 今回実装しないもの

以下は明確にスコープ外とする。

- オンライン対戦
- CPU対戦
- ランキング
- ユーザー登録
- ログイン
- Cloudflare Workers
- Cloudflare D1
- Cloudflare R2
- サーバーAPI
- WebSocket
- チャット
- 課金
- 広告
- SNS連携
- 3D物理やMatter.js以外の追加Physics Engine
- スマートフォン向けネイティブアプリ

---

## データ保存

サーバー保存は行わない。

ICE / WOOD / FELTとSHORT / MEDIUM / LONGを組み合わせた9カテゴリーごとに、得点上位3件を`localStorage`へ保存する。

保存キーは`table-curling.high-scores.v1`とし、5投目に関係する全ストーンの停止時に最終結果を一度だけ確定して該当カテゴリーを更新する。「結果を見る」は保存を行わず、Result Screenへの表示遷移だけを担当する。ブラウザデータ削除時に記録が消えることと、別端末へ共有されないことを許容する。

ゲーム途中のSurface、投射距離、投数、ストーン、Power、画面状態、Camera、暫定得点は`localStorage`、`sessionStorage`、IndexedDBなどへ保存しない。途中でタブを閉じるか再読み込みした場合、そのゲームは失われ、次回起動時はTOPから始める。途中再開機能と復元確認は実装しない。

効果音のON/OFFはユーザー設定として`table-curling.sound-enabled.v1`へBooleanで保存する。保存値がない場合、不正な場合、または`localStorage`を利用できない場合はONとして扱う。この設定はゲーム途中状態の保存には使用しない。

---

## Cloudflare Pages

完成したReact SPAはCloudflare Pagesで公開する。

GitHub ActionsなどのCIは導入せず、テスト、ビルド、デプロイはローカルで手動実行する。

### 方針

Cloudflare側ではビルドさせず、ローカルでビルドする。

```bash
npm ci
npm run build
```

生成物:

```text
dist/
```

をCloudflare Pagesへアップロードする。

例:

```bash
npx wrangler pages deploy dist
```

またはCloudflare管理画面からDirect Uploadする。

---

## Cloudflare利用範囲

今回使用するのは原則として以下のみ。

```text
Cloudflare Pages
    ↓
Static SPA
```

Workers / D1 / R2 は使用しない。

これにより、

- フロントエンドのみ
- バックエンドなし
- ランキングなし
- DBなし

の完全静的アプリとして構成する。

---

## SPA Routing

React Routerは使用しない。ブラウザゲームとして、TOP、フィールド選択、長さ選択、選択内容確認、Game、Result、スコア確認、遊び方はZustandの画面状態で切り替える。Game内部の`ready`、`charging`、`moving`、`review`は画面状態と分離する。

公開URLはアプリのルートのみとし、画面ごとの直接リンクやブラウザの戻る・進む操作との連動はMVPでは実装しない。

---

## 推奨ディレクトリ構成

例:

```text
src/
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
├─ stores/
├─ config/
│  ├─ audio.ts
│  ├─ physics.ts
│  └─ surfaces.ts
└─ test/
```

構成は実装中に改善してよいが、

**PhysicsロジックをReactコンポーネントへ直接埋め込まないこと。**

---

## テスト

最低限、Matter.js Adapterのゲーム固有設定と、純粋関数化したScoringはテスト可能な構造にする。Matter.js内部アルゴリズム自体は再テストしない。

- VitestでScoring、High Score、Store、Matter Adapterをテストする
- Storybook + Vitest Addonで主要UIコンポーネントの状態と操作をテストする
- StorybookのPhysics Calibration Storyで物理パラメータを同じ初期条件から比較・調整する
- StorybookのCollision Audio Calibration Storyで衝突音を試聴・調整する
- Playwrightでゲーム開始から5投、Result、Retry、localStorageまでをE2Eテストする
- `npm run build-storybook`が成功することを確認する

### Physics Calibration Story

productionアプリには物理調整画面、デバッグメニュー、デバッグ用URLを追加しない。Storybookの隔離されたStoryで、アプリと同じMatter Adapter、Physics Runtime、Renderer、設定型を使って調整する。

- ControlsでPower、`minSpeed`、`maxSpeed`、Surfaceごとの`frictionAir`、共通`restitution`、停止速度、停止継続時間を変更できる
- Canvasと現在速度、移動距離、World座標、停止理由を表示する
- パラメータ変更時は実行中Bodyへ途中適用せず、同じ初期条件でRuntimeを作り直す
- 最低PowerのFELT直線投射、最大PowerのFELT・LONG、Surface比較、正面衝突、停止判定のプリセットを用意する
- 候補値を共通設定形式のJSONとしてコピーできる
- 自動最適化、自動保存、設定ファイルの自動更新は行わず、採用値を確認して手動反映する
- Calibration StoryとHarnessをproductionの`dist/`へ含めず、`storybook-static/`もCloudflare Pagesへ公開しない

### Collision Audio Calibration Story

productionアプリへ音声調整画面を追加せず、Storybookで衝突音の相対速度閾値、クールダウン、音量を変更できるようにする。単発衝突と短時間の連続衝突を試聴し、採用値は共通Audio設定ファイルへ手動反映する。調整値の自動保存は行わない。

特に以下をテスト対象候補とする。

### Scoring

- 中心なら100点
- 第1リングなら50点
- 第2リングなら30点
- 第3リングなら10点
- 外なら0点

### Stop判定

- 閾値未満なら停止
- 閾値以上なら継続

### Collision

- 非接触時は速度変化なし
- 接触時は速度が伝播する

### Surface

同じ初速の場合、

```text
ICE > WOOD > FELT
```

の順で移動距離が長くなること。

---

## 受け入れ条件

### 必須

- [ ] React + TypeScript + Vite で起動できる
- [ ] Material UI が導入されている
- [ ] Zustand が導入されている
- [ ] Matter.js が導入され、React / ZustandからAdapterで分離されている
- [ ] ICE / WOOD / FELT の3Surfaceを選択できる
- [ ] Surfaceごとに摩擦差がある
- [ ] タップ、クリック、Space、Enterの長押しと解放で投射強度を決定できる
- [ ] ストーンが滑る
- [ ] ストーンが摩擦によって減速する
- [ ] ストーンが停止する
- [ ] ストーン同士が衝突する
- [ ] 衝突によって別のストーンを動かせる
- [ ] 円形ターゲットが表示される
- [ ] 最終位置に応じて得点が決まる
- [ ] 複数投の最終合計スコアが表示される
- [ ] Retryできる
- [ ] Physics処理がReact UIから分離されている
- [ ] Storybookで主要UIコンポーネントを確認できる
- [ ] StorybookでPhysicsパラメータを比較・調整し、候補値をJSONとしてコピーできる
- [ ] Storybookで衝突音の閾値、クールダウン、音量を試聴・調整できる
- [ ] Vitest / Storybook / Playwrightのテストが成功する
- [ ] `npm run build` が成功する
- [ ] Cloudflare Pagesで静的SPAとして公開できる

---

## 非機能要件

### パフォーマンス

通常のデスクトップブラウザで違和感なく動くこと。

目標:

```text
60 FPS付近
```

ただし厳密な60 FPS保証は不要。

### 対応ブラウザ

リリース時点の現行安定版を正式サポートする。

- PC: Chrome、Edge、Safari
- モバイル: Android版Chrome、iOS版Safari

Firefoxなどは意図的にブロックしないがMVPの必須検証対象には含めず、古いブラウザ・OS向けの互換対応は行わない。User-Agentによるアクセス拒否は設けない。

### Responsive

モバイルブラウザを主対象とする。

PC / タブレットのブラウザにも対応する。

端末の向きは固定しない。狭い画面かつ縦向きでは情報領域、Canvas、操作領域を上から順に並べる。横向き、または幅900 CSS px以上ではCanvasを左、情報・操作領域を右に並べる。

通常のCanvas表示窓は縦横比`3:5`を維持し、safe-areaと情報・操作領域を除いた利用可能な幅と高さへ収まる最大サイズにする。画面回転やウィンドウサイズ変更では表示サイズだけを更新し、Physics World、Cameraの意味、ゲーム進行を変更しない。

Canvasの内部描画倍率は`min(devicePixelRatio, 2)`とし、取得できない場合は`1`とする。CSS表示サイズと内部描画バッファを分離し、描画倍率をPhysics座標、Camera、Pointer入力、採点へ影響させない。

Game Screenは動的viewportの高さへ収め、通常のページスクロールを発生させない。投射ボタンの長押し中はスクロールとブラウザ既定ジェスチャーを抑止するが、ページ全体のピンチズームは無効化しない。Game以外の画面は必要に応じて縦スクロールを許可する。

---

## 実装優先順位

### Phase 1

- Vite + React + TypeScript
- MUI
- Zustand
- 画面遷移
- Canvas表示

### Phase 2

- ストーン描画
- 投射
- 摩擦
- 停止

### Phase 3

- Surface差分
- ICE
- WOOD
- FELT

### Phase 4

- ストーン同士の衝突

### Phase 5

- ターゲット
- スコア計算
- 5投
- Result

### Phase 6

- UI調整
- テスト
- Cloudflare PagesへのDeploy

---

## 将来拡張候補

今回は実装しない。

将来的には以下を追加可能。

- 投射角度変更
- カーブ
- Stoneの重量差
- 複数種類のStone
- ステージ追加
- 障害物
- タイムアタック
- Daily Challenge
- BGM
- PWA
- Cloudflare Workers
- D1ランキング
- オンライン対戦

---

## 今回の技術検証ポイント

完成後、以下を振り返る。

### React

- ReactはゲームUIの管理にどこまで適しているか
- 高頻度描画とReact renderingを分離した設計は扱いやすいか

### Zustand

- Game Stateの管理に適しているか
- 高頻度Physics StateまでStoreに入れるべきか
- StoreとPhysics Engineの境界はどこが適切か

### Physics

- Matter.jsを使った物理演算をCanvasゲームへ自然に統合できるか
- Surface設定とゲーム固有ルールをMatter.jsから適切に分離できるか
- モバイルとPCで安定した操作感を提供できるか

### Cloudflare Pages

- 静的SPA公開先として使いやすいか
- ローカルBuild + Direct Deployの運用感はどうか
- 個人向け小規模ゲームの公開基盤として十分か

---

## Definition of Done

以下を満たせば本Issueを完了とする。

```text
React SPAとしてゲームが完成
↓
ICE / WOOD / FELTで挙動が変わる
↓
5投プレイできる
↓
Stone衝突あり
↓
最終スコアが計算される
↓
Retry可能
↓
Cloudflare Pagesへ公開
```

今回の目的は「高機能なゲームを作ること」ではなく、

**React / Zustand / Browser Physics / Cloudflare Pages の実践検証を、遊べる成果物として完成させること。**
