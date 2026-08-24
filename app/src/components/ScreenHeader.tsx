import { Button, Stack, Typography } from '@mui/material'

interface ScreenHeaderProps {
  readonly title: string
  readonly onBack?: () => void
  readonly backLabel?: string
}

export function ScreenHeader({
  title,
  onBack,
  backLabel = '戻る',
}: ScreenHeaderProps) {
  return (
    <Stack spacing={1.5}>
      {onBack === undefined ? null : (
        <Button
          aria-label={backLabel}
          onClick={onBack}
          sx={{ alignSelf: 'flex-start', px: 1.5 }}
          variant="text"
        >
          ← {backLabel}
        </Button>
      )}
      <Typography component="h1" sx={{ textAlign: 'center' }} variant="h2">
        {title}
      </Typography>
    </Stack>
  )
}
