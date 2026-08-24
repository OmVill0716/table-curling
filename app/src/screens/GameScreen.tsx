import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { AppShell } from '../components/AppShell'
import type { Surface, ThrowDistance } from '../game/types'
import type { GamePhase } from '../stores/gameStore'

interface GameScreenProps {
  readonly completedShots: number
  readonly gamePhase: GamePhase
  readonly maxShots: number
  readonly surface: Surface
  readonly throwDistance: ThrowDistance
  readonly onNextShot?: () => void
  readonly onViewResult?: () => void
}

const phaseLabels: Readonly<Record<GamePhase, string>> = {
  ready: '投射準備OK',
  charging: 'Power調整中',
  moving: 'ストーン移動中',
  review: '投射完了',
}

export function GameScreen({
  completedShots,
  gamePhase,
  maxShots,
  onNextShot,
  onViewResult,
  surface,
  throwDistance,
}: GameScreenProps) {
  const currentShot = Math.min(completedShots + 1, maxShots)
  const isFinalReview = gamePhase === 'review' && completedShots === maxShots

  return (
    <AppShell game maxWidth={1180}>
      <Box
        data-testid="game-layout"
        sx={{
          display: 'grid',
          gap: { xs: 1, sm: 1.5 },
          gridTemplateAreas: '"info" "board" "controls"',
          gridTemplateRows: 'auto minmax(0, 1fr) auto',
          height: '100%',
          minHeight: 0,
          '@media (orientation: landscape), (min-width: 900px)': {
            gap: 2,
            gridTemplateAreas: '"board info" "board controls"',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 360px)',
            gridTemplateRows: 'auto minmax(0, 1fr)',
          },
        }}
      >
        <Paper
          component="section"
          elevation={3}
          sx={{ gridArea: 'info', p: { xs: 1.25, sm: 2 } }}
        >
          <Stack
            direction={{ xs: 'row', sm: 'row' }}
            spacing={1}
            sx={{ alignItems: 'center', flexWrap: 'wrap' }}
          >
            <Typography component="h1" sx={{ fontWeight: 900 }} variant="h6">
              Shot {currentShot} / {maxShots}
            </Typography>
            <Chip label={surface} size="small" />
            <Chip label={throwDistance} size="small" variant="outlined" />
            <Chip
              color={gamePhase === 'ready' ? 'primary' : 'secondary'}
              label={phaseLabels[gamePhase]}
              size="small"
              sx={{ marginLeft: { sm: 'auto !important' } }}
            />
          </Stack>
        </Paper>

        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            gridArea: 'board',
            justifyContent: 'center',
            minHeight: 0,
            minWidth: 0,
          }}
        >
          <Box
            aria-describedby="game-board-description"
            aria-label="カーリング盤面"
            component="canvas"
            height={1000}
            role="img"
            sx={{
              aspectRatio: '3 / 5',
              backgroundColor: 'background.paper',
              backgroundImage:
                'radial-gradient(circle at 50% 22%, #ef6461 0 6%, #f6c85f 6.5% 12%, #55a6d9 12.5% 18%, #75c8ae 18.5% 24%, transparent 24.5%), linear-gradient(180deg, rgba(255,255,255,0.86), rgba(219,238,245,0.96))',
              border: '3px solid',
              borderColor: 'text.primary',
              borderRadius: 2,
              boxShadow: '0 8px 24px rgba(21, 48, 71, 0.18)',
              display: 'block',
              height: '100%',
              maxHeight: '100%',
              maxWidth: '100%',
              touchAction: 'none',
              width: 'auto',
            }}
            width={600}
          />
          <Typography
            id="game-board-description"
            sx={{
              border: 0,
              clip: 'rect(0 0 0 0)',
              height: 1,
              margin: -1,
              overflow: 'hidden',
              padding: 0,
              position: 'absolute',
              whiteSpace: 'nowrap',
              width: 1,
            }}
          >
            ターゲットへ向けてストーンを投射する縦長の盤面
          </Typography>
        </Box>

        <Paper
          component="section"
          elevation={3}
          sx={{ gridArea: 'controls', p: { xs: 1.25, sm: 2 } }}
        >
          <Stack spacing={1.25} sx={{ alignItems: 'stretch' }}>
            {gamePhase === 'ready' ? (
              <Typography sx={{ fontWeight: 800, textAlign: 'center' }}>
                ストーンを投げる準備ができました
              </Typography>
            ) : null}
            {gamePhase === 'charging' ? (
              <Typography sx={{ fontWeight: 800, textAlign: 'center' }}>
                ボタンを離して投射
              </Typography>
            ) : null}
            {gamePhase === 'moving' ? (
              <Typography sx={{ fontWeight: 800, textAlign: 'center' }}>
                全ストーンの停止を待っています
              </Typography>
            ) : null}
            {gamePhase === 'review' && !isFinalReview ? (
              <Button
                disabled={onNextShot === undefined}
                onClick={onNextShot}
                variant="contained"
              >
                次の投射へ
              </Button>
            ) : null}
            {isFinalReview ? (
              <Button
                disabled={onViewResult === undefined}
                onClick={onViewResult}
                variant="contained"
              >
                結果を見る
              </Button>
            ) : null}
          </Stack>
        </Paper>
      </Box>
    </AppShell>
  )
}
