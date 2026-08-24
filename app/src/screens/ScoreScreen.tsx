import {
  Box,
  Chip,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { AppShell } from '../components/AppShell'
import { ScreenHeader } from '../components/ScreenHeader'
import { SURFACE_OPTIONS, THROW_DISTANCE_OPTIONS } from '../config/gameOptions'
import type { HighScores, Surface, ThrowDistance } from '../game/types'

interface ScoreScreenProps {
  readonly highScores: HighScores
  readonly onBack: () => void
}

const rankLabels = ['1st', '2nd', '3rd'] as const

function formatAchievedAt(achievedAt: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
  }).format(new Date(achievedAt))
}

export function ScoreScreen({ highScores, onBack }: ScoreScreenProps) {
  const [surface, setSurface] = useState<Surface>('ICE')
  const [distance, setDistance] = useState<ThrowDistance>('SHORT')
  const records = highScores[surface][distance].slice(0, 3)

  return (
    <AppShell>
      <Stack spacing={3}>
        <ScreenHeader backLabel="TOPへ" onBack={onBack} title="スコア確認" />

        <Paper elevation={4} sx={{ overflow: 'hidden' }}>
          <Tabs
            aria-label="フィールド"
            onChange={(_, value: Surface) => setSurface(value)}
            scrollButtons={false}
            value={surface}
            variant="fullWidth"
          >
            {SURFACE_OPTIONS.map((option) => (
              <Tab key={option.value} label={option.label} value={option.value} />
            ))}
          </Tabs>
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
            <Tabs
              aria-label="長さ"
              onChange={(_, value: ThrowDistance) => setDistance(value)}
              scrollButtons={false}
              value={distance}
              variant="fullWidth"
            >
              {THROW_DISTANCE_OPTIONS.map((option) => (
                <Tab key={option.value} label={option.label} value={option.value} />
              ))}
            </Tabs>
          </Box>
        </Paper>

        <Stack aria-live="polite" spacing={1.5}>
          <Typography component="h2" sx={{ fontWeight: 900 }} variant="h5">
            {surface} / {distance}
          </Typography>
          {records.length === 0 ? (
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
              <Typography sx={{ fontWeight: 800 }}>まだ記録がありません</Typography>
              <Typography color="text.secondary" variant="body2">
                最初のスコアを記録しよう！
              </Typography>
            </Paper>
          ) : (
            records.map((record, index) => (
              <Paper
                key={`${record.achievedAt}-${record.score}`}
                sx={{ p: 2.5 }}
                variant="outlined"
              >
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ alignItems: 'center' }}
                >
                  <Chip
                    color={index === 0 ? 'secondary' : 'default'}
                    label={rankLabels[index]}
                    sx={{ fontWeight: 900 }}
                  />
                  <Typography sx={{ flex: 1, fontWeight: 900 }} variant="h5">
                    {record.score} pt
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {formatAchievedAt(record.achievedAt)}
                  </Typography>
                </Stack>
              </Paper>
            ))
          )}
        </Stack>
      </Stack>
    </AppShell>
  )
}
