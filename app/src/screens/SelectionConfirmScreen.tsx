import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { AppShell } from '../components/AppShell'
import { ScreenHeader } from '../components/ScreenHeader'
import { getSurfaceDetails, getThrowDistanceDetails } from '../config/gameOptions'
import type { Surface, ThrowDistance } from '../game/types'
import { gameColors } from '../theme'

interface SelectionConfirmScreenProps {
  readonly surface: Surface
  readonly throwDistance: ThrowDistance
  readonly onBack: () => void
  readonly onStartGame: () => void
}

export function SelectionConfirmScreen({
  onBack,
  onStartGame,
  surface,
  throwDistance,
}: SelectionConfirmScreenProps) {
  const surfaceDetails = getSurfaceDetails(surface)
  const distanceDetails = getThrowDistanceDetails(throwDistance)

  return (
    <AppShell>
      <Stack spacing={3}>
        <ScreenHeader onBack={onBack} title="選択内容確認" />
        <Paper elevation={5} sx={{ overflow: 'hidden', p: { xs: 2.5, sm: 4 } }}>
          <Stack spacing={3}>
            <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
              <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
                フィールド
              </Typography>
              <Box
                aria-hidden="true"
                sx={{
                  background: gameColors.surface[surface],
                  border: '3px solid rgba(21, 48, 71, 0.35)',
                  borderRadius: '50%',
                  height: 80,
                  width: 80,
                }}
              />
              <Typography component="p" sx={{ fontWeight: 900 }} variant="h4">
                {surfaceDetails.label}
              </Typography>
              <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
                {surfaceDetails.description}
              </Typography>
            </Stack>

            <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />

            <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
              <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
                長さ
              </Typography>
              <Chip
                color="primary"
                label={distanceDetails.label}
                sx={{ fontSize: '1.15rem', fontWeight: 900, px: 1.5 }}
              />
              <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
                {distanceDetails.description}
              </Typography>
            </Stack>

            <Button fullWidth onClick={onStartGame} size="large" variant="contained">
              ゲーム開始
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </AppShell>
  )
}
