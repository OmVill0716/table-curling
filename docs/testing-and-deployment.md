# テスト・ビルド・デプロイ

- 状態: Phase 4まで実装済み（保存・音声の検証項目はPhase 5）

## 1. ローカル検証

npmコマンドはアプリの作業ディレクトリで実行する。Playwrightのブラウザ取得は初回とPlaywright更新時に必要になる。

```bash
cd app
npm ci
npx playwright install chromium webkit
npm run verify
```

`verify`は次のscriptsを順番に実行する。

```bash
npm run lint
npm run test:unit
npm run test:storybook
npm run build
npm run test:e2e
npm run build-storybook
```

依存関係は`app/package-lock.json`で固定する。Cloudflareへアップロードする成果物は、クリーンなcheckoutの`app/`における`npm ci && npm run build`で再生成できなければならない。

CIは[ADR-012](../ADR/ADR-012-do-not-add-ci.md)に従って導入せず、上記コマンドをデプロイ前にローカルで手動実行する。

`npm run build`後は、Calibration Story、Harness、Storybook依存コードが`app/dist/`へ含まれていないことを確認する。`npm run build-storybook`で生成する`app/storybook-static/`は調整・テスト用成果物であり、Cloudflare Pagesへの公開対象にしない。

## 2. 自動テスト

テスト構成は[ADR-011](../ADR/ADR-011-use-vitest-storybook-and-playwright.md)に従う。

### Vitest

#### Physics

- 1秒を異なる描画フレーム間隔で進めても同じ位置・速度になる
- 大きなframe deltaが上限値に制限される
- Power 1が`minSpeed`、Power 100が`maxSpeed`になり、中間値が線形補間される
- 同じPowerでは全Surfaceの初速度が等しい
- ICE、WOOD、FELTの順で停止距離が長い
- Power 1でFELT上を40 logical px以上進む
- Power 100でFELTかつLONGの最大後退位置からターゲットへ到達できる
- `Body.speed < 1.00`が0.25秒未満では停止せず、0.25秒継続すると線形速度と角速度がゼロになる
- 0.25秒の途中で`Body.speed >= 1.00`になると停止判定の継続時間がリセットされる
- 停止したストーンが衝突で速度を得ると再び運動中になる
- 実装開始時の全ストーンに共通の`restitution: 0.85`が設定される
- 正面衝突で後続ストーンへ速度が伝わる
- 衝突後の両ストーンが選択中Surfaceの抵抗を受けて減速する
- 調整後の最大初速度の正面衝突ですり抜けない
- 四辺に反射壁がなく、World境界`x = 0`、`x = 600`、`y = 0`、`y = 1500`からストーン全体が出ると盤外になる

Matter.js内部アルゴリズムそのものは再テストせず、Matter Adapterの設定とゲームとして観測できる結果をテストする。

#### Scoring

境界値`0`、`30`、`60`、`90`、`120`と、それぞれの直前・直後をテストする。盤外ストーンが座標にかかわらず0点になること、5個の合計が個別得点と一致することも確認する。

- ストーンの中心がリング境界を越えると対応する得点色へ変わる
- `score.100`、`score.50`、`score.30`、`score.10`、`score.0`がそれぞれ指定された初期カラーへ対応する
- 暫定得点色の計算がZustandの確定得点を変更しない
- ターゲットの100、50、30、10が対応する得点色で正しいリング内へ表示される
- ターゲットの固定配点が色なしでも数字として判別でき、各Surface上で輪郭または背景による可読性を持つ
- Game Screenと`review`では固定配点以外に各ストーンの得点、合計得点、得点変化ポップアップを表示しない
- 5投目停止時に最終得点を一度だけ確定しても、`review`では固定配点以外の得点数値を表示しない
- Resultで各ストーンの得点と合計得点をHTMLテキストとして表示する

#### Renderer

- `devicePixelRatio`が1、2、2を超える値の場合に描画倍率がそれぞれ1、2、2になる
- `devicePixelRatio`が取得不能または不正な場合に描画倍率1へフォールバックする
- リサイズ後も描画バッファがCSS表示サイズと描画倍率に一致し、Physics座標とPointer入力が変化しない
- World座標から表示座標への変換とPointer入力の逆変換が描画倍率にかかわらず往復一致する
- `charging`と`moving`ではAnimation Frameを継続予約する
- `ready`と`review`では継続予約せず、状態変更、Camera変更、リサイズごとに1回だけ描画する
- Game以外のScreenとページ非表示中はGame用Animation Frameを予約しない
- `moving`でページを再表示した場合だけ継続予約を再開し、`ready`と`review`では再開しない
- unmountとリタイア時に予約済みFrameを取り消し、Strict ModeでもSchedulerを二重起動しない

#### Store

- `screen`と`gamePhase`が独立し、Game以外では`gamePhase`が`null`になる
- TOPからゲームプレイ、スコア確認、遊び方へ遷移できる
- フィールド選択、長さ選択、選択内容確認の順に進み、確認後にGameを開始すると`gamePhase`が`ready`になる
- 設定中に戻ると1画面前へ移り、既に選んだ値を維持する
- 選択内容確認までGameを開始できない
- スコア確認用のタブ選択がゲームプレイ用のSurfaceと距離を変更しない
- 選択したSHORT、MEDIUM、LONGに応じて正しい基本投射位置になる
- 最初の40 logical pxの進路が塞がれる場合、投射位置を36 logical pxずつ最大4段階まで後退させる
- LONGの最大後退位置が`(300, 1084)`になり、5投中もカテゴリーがLONGのまま維持される
- 選択された投射距離が5投終了まで変わらない
- `ready → charging → moving → review`と遷移する
- 運動中は追加投射できない
- `review`中は追加投射できない
- 1〜4投目は「次の投射へ」を押すまで`review`に留まり、押下後に次のストーンとCameraを準備して`ready`になる
- 5投目は最終得点確定後も「結果を見る」を押すまで`gamePhase: review`に留まり、押下後に`screen: result`となる
- Reset actionとResetボタンが存在しない
- 5投目の停止前を含む未完了状態からリタイアを確定すると、Resultを経由せずゲームを破棄して`top`になる
- リタイア確認を取り消すと元の状態へ戻る。ただし`charging`から開いた場合は`ready`へ戻る
- `moving`中のリタイア確認を取り消しても、確認中の実時間がPhysicsへ加算されない
- `moving`中にページを非表示にすると位置と速度を維持し、再表示後に非表示前の状態から自動再開する
- `charging`中にページを非表示にすると投射せず`ready`へ戻る
- `ready`と`review`でページを非表示にしてもGamePhaseを維持する
- 非表示時間をPower、Physics accumulator、停止判定の継続時間へ加算しない
- 非表示中のPointer Upとキー解放では投射しない
- リタイアしたゲームの得点、投数、ストーン、リタイア回数を保存しない
- RetryはSurfaceと距離を維持し、投数・Stone・Score・Cameraを初期化する
- Resultの「TOPへ」は選択を解除して`top`になる

#### High Score

- 保存キーが`table-curling.high-scores.v1`になる
- 9カテゴリーが互いに混ざらない
- 4件以上追加しても得点上位3件だけが残る
- 同点では新しい記録が先になる
- 1〜4投目と5投目の運動中にはlocalStorageを更新しない
- 5投目の停止時に該当カテゴリーを一度だけ更新する
- 「結果を見る」を複数回発火させてもハイスコアを再保存しない
- ゲーム途中の状態をlocalStorage、sessionStorage、IndexedDBへ保存しない
- ゲーム途中で再読み込みすると`top`へ戻り、投数とストーンを復元しない
- 不正JSON、未知フィールド、範囲外得点を安全に処理する
- localStorageが利用できない場合もゲームを継続できる

#### Audio

- `/audio/shot.ogg`、`/audio/stone-collision.ogg`、`/audio/all-stones-stopped.ogg`、`/audio/out-of-bounds.ogg`を対応するイベントへ割り当てる
- 初期設定がONになり、TOPからON/OFFを切り替えられる
- 投射、全ストーン停止、コースアウトの各イベントが対応する再生要求を1回発行する
- 衝突開始イベントは相対速度を含む再生候補を発行し、Audio Adapterが弱い接触、同一Physicsステップの重複、クールダウンを判定する
- ユーザー操作前とOFFでは再生を開始しない
- OFFへ切り替えると再生中の音を停止する
- 設定を`table-curling.sound-enabled.v1`へ保存し、再読み込み時に復元する
- 不正な保存値またはlocalStorageが利用できない場合はONとしてゲームを継続する
- Audio Adapterが再生に失敗してもGamePhaseとPhysicsの進行が変わらない
- 接触継続中に同じ組み合わせの鐘を繰り返し再生しない
- 同一Physicsステップの複数衝突では相対速度が最大の1件だけを再生候補にする
- 弱い接触と、直前の鐘からPhysics時間で250ms未満の衝突では鐘を再生しない
- 衝突音の初期音量が35%になり、音量制御がPhysicsへ影響しない
- TOP表示後の音源読み込み中でも画面を操作できる
- 最初のユーザー操作前には音声を再生せず、操作後に音声機能の有効化を試みる
- 未準備または読み込み失敗した音は再生せず、準備完了後にも遅延再生しない
- 音源の読み込み状態に関係なくゲーム開始、Physics、GamePhase、採点を継続できる

### Storybook + Vitest Addon

- 主要MUIコンポーネントに基本状態、操作可能状態、無効状態のStoryがある
- `Physics Calibration` StoryでPower、初速度、Surface抵抗、反発係数、停止条件をControlsから変更できる
- Calibrationのパラメータ変更時に既存Runtimeが破棄され、同じ初期条件からシーンが再生成される
- Calibrationで現在速度、移動距離、World座標、停止理由を確認できる
- 最低PowerのFELT、最大PowerのFELT・LONG、Surface比較、正面衝突、停止判定のプリセットStoryがある
- Calibrationの現在値を共通設定形式のJSONとしてコピーできるが、アプリの保存領域や設定ファイルを自動更新しない
- 衝突音調整Storyで相対速度の閾値、クールダウン、音量を変更し、単発衝突と短時間の連続衝突を試聴できる
- 衝突音調整Storyの値は自動保存せず、採用値を確認して共通Audio設定へ手動反映する
- 円形投射ボタンの押下開始、リリース、キャンセルを`play`関数で確認する
- 未操作状態、Power 1、上昇中の50、100、下降中の50を表示できる
- 上半円の固定グラデーション、現在値のマーカー、`1`と`100`、整数値、`↑`または`↓`が表示される
- 同じPowerでは上昇中と下降中のマーカー位置が一致し、方向矢印だけが異なる
- 装飾用SVGがポインター操作を妨げず、SpaceとEnterでも投射ボタンを操作できる
- 投射ボタンがHTML `button`で、用途を示す名前と現在Power・増減方向のHTML情報を持つ
- 主要操作のタップ領域が最低44 × 44 CSS pxで、キーボードフォーカスが視認できる
- Powerの更新が強制的な`aria-live`連続通知にならない
- `prefers-reduced-motion: reduce`で装飾的なtransitionが抑制されても、Power Gaugeとストーンの運動を継続できる
- 3秒を超えて押し続けると次の往復へ入る
- GameでShot 1/5と5/5を表示でき、Resultで得点0と最大得点を表示できる
- ICE / WOOD / FELTとSHORT / MEDIUM / LONGの選択状態を表示できる
- ICE / WOOD / FELTの各背景上で5種類の得点色と暗色輪郭線を確認できる
- Gameと`review`のStoryではターゲットの色付き固定配点を表示するが、各ストーンの得点と合計得点を表示しない
- ResultのStoryでは各ストーンの確定得点と合計得点を表示する
- 1〜4投目の`review`で「次の投射へ」、5投目の`review`で「結果を見る」を表示できる
- 未完了Gameで「リタイア」、Resultで「Retry」と「TOPへ」を表示でき、Resetを表示しない
- TOP、フィールド選択、長さ選択、選択内容確認、スコア確認、遊び方の各画面を表示でき、TOPで効果音をON/OFFできる
- 遊び方に目的、Surface、投射距離、Power、固定方向、5投の進行、衝突、配点、ストーン色、コースアウト、Result、リタイア、途中保存なし、効果音設定の説明がある
- 遊び方は初回に強制表示されず、既読状態を保存せず、内容が長い場合に縦スクロールできる
- Resultで合計得点を最も大きく表示し、Shot 1〜5を投射順に表示する
- Resultで盤内ストーンの最終色と得点、盤外ストーンの`OUT / 0`を表示する
- ResultでSurfaceと距離を表示し、座標値と途中得点を表示しない
- Resultのハイスコア1st・2nd・3rd・圏外を表示でき、圏外では`NEW HIGH SCORE`と順位を表示しない
- 全Storyがエラーなく描画される

### Playwright E2E

- TOPからフィールド選択、長さ選択、選択内容確認を経てゲームを開始できる
- TOPからスコア確認と遊び方へ移動し、TOPへ戻れる
- TOPで効果音をOFFにすると投射しても音声を再生せず、再読み込み後もOFFが維持される
- 円形投射ボタンの長押しとリリースでストーンを投射できる
- 上昇中と下降中の同じPowerで投射できる
- 各投射後に「次の投射へ」を押して5投を完了できる
- 5投目停止後もGame Screenに留まり、「結果を見る」でResultへ遷移できる
- Resultの合計がShot 1〜5の得点内訳と一致し、盤外ストーンが`OUT / 0`になる
- 上位3件に入った場合だけ`NEW HIGH SCORE`と正しい順位が表示される
- 未完了GameをリタイアするとResultを経由せずTOPへ戻る
- Resultから同じSurface・距離でRetryでき、確認なしでTOPへ戻れる
- 5投目停止時に該当カテゴリーのlocalStorageが更新される
- 4投目までに再読み込みすると途中状態を復元せずTOPへ戻る
- `moving`中にページを非表示・再表示してもストーンが瞬間移動せず、自動的に再開する
- `charging`中にページを非表示にすると投射がキャンセルされる
- モバイル相当とデスクトップ相当のviewportで主要操作が画面内に収まる
- 狭い縦向きviewportでは情報、Canvas、操作領域が上下に並ぶ
- 横向きまたは幅900 CSS px以上ではCanvasと情報・操作領域が左右に並ぶ
- 画面回転とリサイズ後もCanvasが`3:5`を維持し、Runtime、投数、Stone位置を維持する
- Game Screenでは通常のページスクロールが発生せず、投射ボタンの長押しで画面が動かない
- Game以外の長い画面では縦スクロールできる
- safe-areaを模したviewportでも主要情報と操作が欠けない
- ブラウザの拡大操作を禁止するviewport設定を使用しない

## 3. ブラウザ確認

対応範囲は[ADR-028](../ADR/ADR-028-support-current-major-browsers.md)に従う。PlaywrightではChromium、WebKit、モバイル相当のemulationを実行する。これとは別に、Android版Chrome、iOS版Safari、デスクトップ版Chrome、Edge、Safariのリリース時点の現行安定版で次を手動確認する。

- Pointer操作とキーボード操作で5投完了できる
- 選択中の投射距離がGame ScreenとResult Screenに表示される
- 通常のCanvas表示窓がモバイル、タブレット、PC幅で縦横比`3:5`を維持する
- 縦向きでは上下配置、横向きと幅900 CSS px以上では左右配置になる
- Game Screenが動的viewportとsafe-area内に収まり、投射操作中にページスクロールしない
- Game以外の画面は内容が収まらない場合にスクロールできる
- Camera変換後もターゲットの得点範囲と後退した投射ストーンが同時に表示される
- World座標から表示座標への変換とPointer入力の逆変換が往復一致する
- 高DPI画面で盤面がぼやけない
- タブをバックグラウンドへ移すとPhysicsが停止し、復帰後に同じ位置と速度から自動再開する
- 各Surfaceの停止距離に明確な差がある
- Retry、リタイア、TOPへの遷移が仕様どおり動く
- DevTools Consoleに未処理例外がない

Firefoxなど正式サポート外のブラウザはMVPの必須確認対象に含めない。古いブラウザやOS向けの互換試験も行わず、User-Agentによるアクセス拒否がないことだけを確認する。

60 FPSは目標値とし、Chrome DevTools Performanceで通常プレイ中に長時間のメインスレッド停止がないことを確認する。

## 4. Cloudflare Pages

方式は[ADR-007](../ADR/ADR-007-cloudflare-pages-direct-upload.md)に従う。

### デプロイ前確認ゲート

Cloudflare Pagesへの公開は本番変更として扱う。実行直前に、次を確認して明示的な許可を得る。

- 使用するCloudflareアカウント
- Pagesプロジェクト名
- productionまたはpreviewのどちらへ出すか
- `git status`とデプロイ対象コミット
- ローカルテストと`npm run build`の成功
- `app/dist/index.html`の存在
- `app/dist/`に秘密情報やsource mapなど意図しない成果物がないこと
- `app/storybook-static/`が`app/dist/`に混入していないこと

確認後に初回プロジェクトを作成し、デプロイする。

```bash
cd app
npx wrangler login
npx wrangler pages project create
npx wrangler pages deploy dist --project-name=<PROJECT_NAME>
```

previewへ出す場合はproduction branch以外を明示する。

```bash
npx wrangler pages deploy dist \
  --project-name=<PROJECT_NAME> \
  --branch=<PREVIEW_BRANCH>
```

### デプロイ後検証

- 発行されたURLのHTTP応答が成功する
- ルートでアプリが表示される
- 5投、結果表示、Retryをproduction URL上でスモークテストする
- ConsoleとNetworkに重大なエラーがないことを確認する

### ロールバック

問題がある場合はCloudflare DashboardのPages deployment履歴から、直前に検証済みのproduction deploymentをRollbackする。ロールバック後に同じスモークテストを実施し、原因となったdeployment URLとcommit hashを記録する。

Direct Uploadプロジェクトは後からGit Integrationへ切り替えられない。自動デプロイが必要になった場合は、新しいADRと新しいPagesプロジェクトで移行する。
