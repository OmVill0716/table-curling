import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { AppShell } from '../components/AppShell'
import type { GameResult, StoneScore, Surface, ThrowDistance } from '../game/types'
import { gameColors } from '../theme'

interface ResultScreenProps {
  readonly result: GameResult
  readonly surface: Surface
  readonly throwDistance: ThrowDistance
  readonly onRetry: () => void
  readonly onTop: () => void
}

const scoreColors: Readonly<Record<StoneScore, string>> = gameColors.score
const rankLabels = { 1: '1st', 2: '2nd', 3: '3rd' } as const

export function ResultScreen({
  onRetry,
  onTop,
  result,
  surface,
  throwDistance,
}: ResultScreenProps) {
  return (
    <AppShell>
      <Stack spacing={3}>
        <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <Typography component="h1" variant="h2">
            RESULT
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip label={surface} />
            <Chip label={throwDistance} variant="outlined" />
          </Stack>
        </Stack>

        <Paper
          elevation={6}
          sx={{
            background: 'linear-gradient(145deg, #126782, #0a485d)',
            color: 'primary.contrastText',
            p: { xs: 3, sm: 4 },
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontWeight: 800 }}>TOTAL SCORE</Typography>
          <Typography
            aria-label={`合計 ${result.totalScore}点`}
            sx={{
              fontSize: 'clamp(4rem, 20vw, 7rem)',
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            {result.totalScore}
          </Typography>
          <Typography sx={{ fontWeight: 800 }}>POINTS</Typography>
          {result.highScoreRank === null ? null : (
            <Chip
              color="secondary"
              label={`NEW HIGH SCORE · ${rankLabels[result.highScoreRank]}`}
              sx={{ fontWeight: 900, mt: 2 }}
            />
          )}
        </Paper>

        <Stack component="ol" spacing={1.25} sx={{ m: 0, p: 0 }}>
          {result.stones.map((stone, index) => (
            <Paper
              component="li"
              key={stone.id}
              sx={{ display: 'block', p: 2 }}
              variant="outlined"
            >
              <Stack
                direction="row"
                spacing={2}
                sx={{ alignItems: 'center' }}
              >
                <Typography sx={{ fontWeight: 900, minWidth: 62 }}>
                  Shot {index + 1}
                </Typography>
                <Box
                  aria-hidden="true"
                  sx={{
                    background: stone.inPlay
                      ? scoreColors[stone.score]
                      : gameColors.score[0],
                    border: '3px solid',
                    borderColor: 'text.primary',
                    borderRadius: '50%',
                    flex: '0 0 auto',
                    height: 38,
                    position: 'relative',
                    width: 38,
                    '&::after': {
                      background: 'background.paper',
                      border: '2px solid',
                      borderColor: 'text.primary',
                      borderRadius: 1,
                      content: '""',
                      height: 8,
                      left: '50%',
                      position: 'absolute',
                      top: -7,
                      transform: 'translateX(-50%)',
                      width: 18,
                    },
                  }}
                />
                <Typography
                  aria-label={
                    stone.inPlay
                      ? `Shot ${index + 1}、${stone.score}点`
                      : `Shot ${index + 1}、コースアウト、0点`
                  }
                  sx={{ flex: 1, fontWeight: 900, textAlign: 'right' }}
                  variant="h6"
                >
                  {stone.inPlay ? `${stone.score} pt` : 'OUT / 0'}
                </Typography>
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button fullWidth onClick={onRetry} size="large" variant="contained">
            Retry
          </Button>
          <Button fullWidth onClick={onTop} size="large" variant="outlined">
            TOPへ
          </Button>
        </Stack>
      </Stack>
    </AppShell>
  )
}
