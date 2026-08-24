# ADR-025: 選定したKenney効果音をOggで同梱する

- 状態: Accepted
- 決定日: 2026-08-23

## コンテキスト

ADR-020で4種類の効果音をMVPへ追加すると決定したが、素材、配布形式、出典は未確定だった。候補を試聴した結果、ゲームの反応が分かりやすく、ストーン衝突時の鐘を演出として楽しめる組み合わせを選定した。

配布元のKenney公式アーカイブには各素材とCreative Commons Zero（CC0）のライセンス文書が同梱されている。MVPの対応対象は現行の主要ブラウザであり、選定素材の元形式であるOgg Vorbisをそのまま利用できる。

## 決定

- 次のKenney素材をアプリ内へ同梱する
  - 投射: Digital Audioの`phaseJump1.ogg`
  - ストーン衝突: Impact Soundsの`impactBell_heavy_001.ogg`
  - 全ストーン停止: Impact Soundsの`footstep_carpet_000.ogg`
  - コースアウト: Digital Audioの`zapThreeToneDown.ogg`
- 素材は再エンコードせず、配布元と同じOgg Vorbis形式で保持する
- ライセンスはCC0とし、配布元URL、元ファイル名、取得日、SHA-256、同梱ライセンス文書を`app/public/audio/README.md`へ記録する
- 古いブラウザ向けのWAVまたはMP3フォールバックはMVPへ追加しない
- 衝突音は意図的な演出として鐘の音を採用する
- 衝突が連続した際の弱い接触の除外、再生間隔、音量は、実装後に試聴して調整する。未調整の数値を本ADRでは固定しない

## 影響

- 音声素材の権利と由来をリポジトリ内で追跡できる
- 元素材を再エンコードしないため、変換による品質劣化と変換成果物の管理を避けられる
- Ogg Vorbisを再生できない古いブラウザでは効果音が鳴らないが、ADR-020に従ってゲーム進行は継続する
- 鐘の衝突音が短時間に重なるとくどくなる可能性があるため、Audio Adapterで多重再生を制御する必要がある

## 参照

- [WebKit Features in Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)
