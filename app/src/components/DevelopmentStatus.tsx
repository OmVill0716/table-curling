import { Paper, Stack, Typography } from '@mui/material'

export const DEVELOPMENT_STATUS_TEXT =
  'Phase 1: Development environment ready'

export function DevelopmentStatus() {
  return (
    <Paper
      component="main"
      elevation={4}
      sx={{
        borderRadius: 4,
        maxWidth: 560,
        px: { xs: 3, sm: 6 },
        py: { xs: 5, sm: 7 },
        textAlign: 'center',
        width: '100%',
      }}
    >
      <Stack spacing={2}>
        <Typography component="h1" variant="h3">
          Table Curling
        </Typography>
        <Typography color="text.secondary">
          {DEVELOPMENT_STATUS_TEXT}
        </Typography>
      </Stack>
    </Paper>
  )
}
