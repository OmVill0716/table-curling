import {
  Box,
  Button,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import { AppShell } from '../components/AppShell'
import { gameColors } from '../theme'

interface TopScreenProps {
  readonly soundEnabled: boolean
  readonly onSoundEnabledChange: (enabled: boolean) => void
  readonly onStartGame: () => void
  readonly onOpenScore: () => void
  readonly onOpenHowToPlay: () => void
}

export function TopScreen({
  onOpenHowToPlay,
  onOpenScore,
  onSoundEnabledChange,
  onStartGame,
  soundEnabled,
}: TopScreenProps) {
  return (
    <AppShell maxWidth={620}>
      <Stack
        spacing={{ xs: 3, sm: 4 }}
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100svh - 32px)',
        }}
      >
        <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <Box
            aria-hidden="true"
            sx={{
              background: gameColors.score[100],
              border: `6px solid ${gameColors.ink}`,
              borderRadius: '50%',
              boxShadow: '0 10px 0 rgba(21, 48, 71, 0.16)',
              height: 78,
              position: 'relative',
              width: 78,
              '&::after': {
                background: gameColors.paper,
                border: `4px solid ${gameColors.ink}`,
                borderRadius: '10px 10px 5px 5px',
                content: '""',
                height: 18,
                left: '50%',
                position: 'absolute',
                top: -12,
                transform: 'translateX(-50%)',
                width: 38,
              },
            }}
          />
          <Typography component="h1" variant="h1">
            テーブルカーリング
          </Typography>
          <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
            学校の休憩時間にやったあの遊び
          </Typography>
        </Stack>

        <Paper elevation={5} sx={{ p: { xs: 2, sm: 3 }, width: '100%' }}>
          <Stack spacing={1.5}>
            <Button fullWidth onClick={onStartGame} size="large" variant="contained">
              ゲームプレイ
            </Button>
            <Button fullWidth onClick={onOpenScore} size="large" variant="outlined">
              スコア確認
            </Button>
            <Button
              fullWidth
              onClick={onOpenHowToPlay}
              size="large"
              variant="outlined"
            >
              遊び方
            </Button>
          </Stack>
        </Paper>

        <FormControlLabel
          control={
            <Switch
              checked={soundEnabled}
              onChange={(_, checked) => onSoundEnabledChange(checked)}
              slotProps={{ input: { 'aria-label': '効果音' } }}
            />
          }
          label={`効果音 ${soundEnabled ? 'ON' : 'OFF'}`}
        />
      </Stack>
    </AppShell>
  )
}
