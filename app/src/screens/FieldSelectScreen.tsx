import { Stack, Typography } from '@mui/material'
import { AppShell } from '../components/AppShell'
import { ScreenHeader } from '../components/ScreenHeader'
import { SelectionCard } from '../components/SelectionCard'
import { SURFACE_OPTIONS } from '../config/gameOptions'
import type { Surface } from '../game/types'
import { gameColors } from '../theme'

interface FieldSelectScreenProps {
  readonly selectedSurface: Surface | null
  readonly onBack: () => void
  readonly onSelect: (surface: Surface) => void
}

export function FieldSelectScreen({
  onBack,
  onSelect,
  selectedSurface,
}: FieldSelectScreenProps) {
  return (
    <AppShell>
      <Stack spacing={3}>
        <ScreenHeader onBack={onBack} title="フィールド選択" />
        <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
          滑りやすさの異なるフィールドを選んでください
        </Typography>
        <Stack spacing={2}>
          {SURFACE_OPTIONS.map((option) => (
            <SelectionCard
              description={option.description}
              key={option.value}
              label={option.label}
              onSelect={() => onSelect(option.value)}
              selected={selectedSurface === option.value}
              swatch={gameColors.surface[option.value]}
            />
          ))}
        </Stack>
      </Stack>
    </AppShell>
  )
}
