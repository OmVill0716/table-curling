import { Alert, Button, Paper, Stack, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { AUDIO_VOLUMES } from '../../config/audio'
import { createAudioAdapter } from '../../game/audio/audioAdapter'
import type { StoneCollisionEvent } from '../../game/types'

export interface CollisionAudioCalibrationArgs {
  readonly minRelativeSpeed: number
  readonly cooldownMs: number
  readonly volume: number
}

function collision(relativeSpeed: number, stepCount: number): StoneCollisionEvent {
  return {
    type: 'stoneCollision',
    stepCount,
    stoneIds: ['stone-1', 'stone-2'],
    relativeSpeed,
  }
}

export function CollisionAudioCalibrationHarness({
  minRelativeSpeed,
  cooldownMs,
  volume,
}: CollisionAudioCalibrationArgs) {
  const adapterRef = useRef<ReturnType<typeof createAudioAdapter> | null>(null)
  const [outcome, setOutcome] = useState('試聴する操作を選んでください。')

  useEffect(() => {
    const adapter = createAudioAdapter({
      collisionTuning: { minRelativeSpeed, cooldownMs },
      volumes: { ...AUDIO_VOLUMES, stoneCollision: volume },
    })
    adapter.preload()
    adapterRef.current = adapter

    return () => {
      adapter.setEnabled(false)
      if (adapterRef.current === adapter) {
        adapterRef.current = null
      }
      adapter.dispose()
    }
  }, [cooldownMs, minRelativeSpeed, volume])

  const getUnlockedAdapter = () => {
    const adapter = adapterRef.current
    adapter?.unlock()
    return adapter
  }

  const playSingle = () => {
    const played = getUnlockedAdapter()?.playCollision(
      [collision(Math.max(minRelativeSpeed + 4, 5), 120)],
      1000,
    )
    setOutcome(played ? '単発衝突を再生しました。' : '音源は未準備です。')
  }

  const playWeak = () => {
    const relativeSpeed = Math.max(0, minRelativeSpeed - 0.1)
    const played = getUnlockedAdapter()?.playCollision(
      [collision(relativeSpeed, 240)],
      2000,
    )
    setOutcome(
      played
        ? `相対速度 ${relativeSpeed.toFixed(1)} を再生しました。`
        : `相対速度 ${relativeSpeed.toFixed(1)} は閾値で除外されました。`,
    )
  }

  const playSameStep = () => {
    const speeds = [
      minRelativeSpeed + 1,
      minRelativeSpeed + 5,
      minRelativeSpeed + 3,
    ]
    const played = getUnlockedAdapter()?.playCollision(
      speeds.map((speed) => collision(speed, 360)),
      3000,
    )
    setOutcome(
      played
        ? `同一stepの最大相対速度 ${Math.max(...speeds).toFixed(1)} だけを再生しました。`
        : '音源は未準備です。',
    )
  }

  const playSequence = () => {
    const adapter = getUnlockedAdapter()
    if (adapter === undefined || adapter === null) {
      setOutcome('Audio Adapterを準備できませんでした。')
      return
    }

    const speed = Math.max(minRelativeSpeed + 4, 5)
    const first = adapter.playCollision([collision(speed, 480)], 4000)
    const withinCooldown = adapter.playCollision(
      [collision(speed, 481)],
      4000 + Math.max(0, cooldownMs - 1),
    )
    const atBoundary = adapter.playCollision(
      [collision(speed, 482)],
      4000 + cooldownMs,
    )
    setOutcome(
      `連続衝突: 初回 ${first ? '再生' : '無音'} / 直後 ${withinCooldown ? '再生' : '除外'} / 境界 ${atBoundary ? '再生' : '無音'}`,
    )
  }

  return (
    <Paper elevation={4} sx={{ maxWidth: 640, p: 3, width: '100%' }}>
      <Stack spacing={2.5}>
        <Stack spacing={0.5}>
          <Typography component="h1" variant="h5">
            衝突音 Calibration
          </Typography>
          <Typography color="text.secondary">
            鐘の弱接触除外、連続再生間隔、音量を一時的に比較します。
          </Typography>
        </Stack>

        <Alert severity="warning">
          Controlsの値は仮調整値です。自動保存されません。
        </Alert>

        <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.5}>
          <Typography>閾値: {minRelativeSpeed.toFixed(1)}</Typography>
          <Typography>クールダウン: {cooldownMs}ms</Typography>
          <Typography>音量: {Math.round(volume * 100)}%</Typography>
        </Stack>

        <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1.5}>
          <Button onClick={playSingle} variant="contained">
            単発衝突
          </Button>
          <Button onClick={playWeak} variant="outlined">
            弱い接触
          </Button>
          <Button onClick={playSameStep} variant="outlined">
            同一step複数
          </Button>
          <Button onClick={playSequence} variant="outlined">
            連続衝突
          </Button>
        </Stack>

        <Typography aria-live="polite">{outcome}</Typography>
      </Stack>
    </Paper>
  )
}
