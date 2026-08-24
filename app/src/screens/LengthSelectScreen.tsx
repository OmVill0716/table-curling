import { Stack, Typography } from '@mui/material'
import { AppShell } from '../components/AppShell'
import { ScreenHeader } from '../components/ScreenHeader'
import { SelectionCard } from '../components/SelectionCard'
import { THROW_DISTANCE_OPTIONS } from '../config/gameOptions'
import type { ThrowDistance } from '../game/types'

const distanceDecoration: Readonly<Record<ThrowDistance, string>> = {
  SHORT: '● ─ ◎',
  MEDIUM: '● ── ◎',
  LONG: '● ─── ◎',
}

interface LengthSelectScreenProps {
  readonly selectedDistance: ThrowDistance | null
  readonly onBack: () => void
  readonly onSelect: (distance: ThrowDistance) => void
}

export function LengthSelectScreen({
  onBack,
  onSelect,
  selectedDistance,
}: LengthSelectScreenProps) {
  return (
    <AppShell>
      <Stack spacing={3}>
        <ScreenHeader onBack={onBack} title="長さ選択" />
        <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
          ターゲットまでの距離を選んでください
        </Typography>
        <Stack spacing={2}>
          {THROW_DISTANCE_OPTIONS.map((option) => (
            <SelectionCard
              decoration={
                <Typography
                  sx={{
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {distanceDecoration[option.value]}
                </Typography>
              }
              description={option.description}
              key={option.value}
              label={option.label}
              onSelect={() => onSelect(option.value)}
              selected={selectedDistance === option.value}
              swatch="#f3eee3"
            />
          ))}
        </Stack>
      </Stack>
    </AppShell>
  )
}
