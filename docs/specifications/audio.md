# 音声仕様

- 状態: Accepted（MVP仕様確定）

## 1. 基本方針

音声方針は[ADR-020](../../ADR/ADR-020-add-sound-effects-with-user-setting.md)、素材選定は[ADR-025](../../ADR/ADR-025-bundle-selected-kenney-sound-effects.md)、衝突音の多重再生制御は[ADR-026](../../ADR/ADR-026-limit-stone-collision-bell-playback.md)、読み込みは[ADR-027](../../ADR/ADR-027-preload-audio-without-blocking-gameplay.md)に従う。

- 投射、ストーン同士の衝突、全ストーンの停止、コースアウトに効果音を付ける
- BGMと端末の振動は実装しない
- TOPで効果音をON/OFFでき、初期値はONとする
- ユーザー操作前には再生しない
- 音声を再生できない場合もゲームを継続する
- OFFへ切り替えた時点で再生中の音を停止し、以後の再生を開始しない
- 素材は自作、Public Domain、または利用条件を確認したものだけを使う

効果音設定の保存キーは[`persistence.md`](./persistence.md)を正本とする。

## 2. 音源割り当て

| イベント | アプリ内パス | 配布元ファイル |
| --- | --- | --- |
| 投射 | `/audio/shot.ogg` | `phaseJump1.ogg` |
| ストーン衝突 | `/audio/stone-collision.ogg` | `impactBell_heavy_001.ogg` |
| 全ストーン停止 | `/audio/all-stones-stopped.ogg` | `footstep_carpet_000.ogg` |
| コースアウト | `/audio/out-of-bounds.ogg` | `zapThreeToneDown.ogg` |

選定素材はOgg Vorbisのままアプリへ同梱し、古いブラウザ向けの別形式はMVPでは用意しない。出典とライセンスは[`app/public/audio/README.md`](../../app/public/audio/README.md)を参照する。

## 3. 衝突音

- 衝突開始時だけを再生候補とする
- ごく弱い接触を除外する
- 同一Physicsステップでは最も相対速度が大きい衝突だけを鳴らす
- 再生後250msは次の衝突音を鳴らさない
- 初期音量は35%とする

弱い接触の閾値、クールダウン、音量は実装後にStorybookで試聴して調整する。

## 4. 読み込みと再生失敗

- TOP表示後に4音源をバックグラウンドで事前読み込みする
- 最初のユーザー操作時に音声機能の有効化を試みる
- 音声が未準備または再生不能でもゲームを待たせない
- 再生できなかったイベントをキューへ保持せず、後から再生しない

効果音は操作や状態の唯一の通知手段にしない。投射、停止、コースアウトは画面上でも判別できる状態を維持する。
