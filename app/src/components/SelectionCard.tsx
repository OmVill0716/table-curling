import { Box, ButtonBase, Paper, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

interface SelectionCardProps {
  readonly description: string
  readonly label: string
  readonly selected: boolean
  readonly swatch: string
  readonly onSelect: () => void
  readonly decoration?: ReactNode
}

export function SelectionCard({
  decoration,
  description,
  label,
  onSelect,
  selected,
  swatch,
}: SelectionCardProps) {
  return (
    <Paper
      elevation={selected ? 7 : 2}
      sx={{
        border: '3px solid',
        borderColor: selected ? 'secondary.main' : 'transparent',
        overflow: 'hidden',
      }}
    >
      <ButtonBase
        aria-label={`${label}を選択`}
        aria-pressed={selected}
        onClick={onSelect}
        sx={{
          minHeight: 108,
          p: 2,
          textAlign: 'left',
          width: '100%',
          '&:focus-visible': {
            outline: '3px solid',
            outlineColor: 'secondary.main',
            outlineOffset: -4,
          },
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', width: '100%' }}
        >
          <Box
            aria-hidden="true"
            sx={{
              alignItems: 'center',
              background: swatch,
              border: '2px solid rgba(21, 48, 71, 0.3)',
              borderRadius: '50%',
              display: 'flex',
              flex: '0 0 auto',
              height: 64,
              justifyContent: 'center',
              width: 64,
            }}
          >
            {decoration}
          </Box>
          <Stack spacing={0.5} sx={{ flex: 1 }}>
            <Typography component="span" sx={{ fontWeight: 900 }} variant="h6">
              {label}
            </Typography>
            <Typography color="text.secondary" component="span" variant="body2">
              {description}
            </Typography>
          </Stack>
          <Typography
            aria-hidden="true"
            color="primary"
            sx={{ fontSize: '1.5rem' }}
          >
            →
          </Typography>
        </Stack>
      </ButtonBase>
    </Paper>
  )
}
