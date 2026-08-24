import { Box } from '@mui/material'
import type { PropsWithChildren } from 'react'

interface AppShellProps extends PropsWithChildren {
  readonly game?: boolean
  readonly maxWidth?: number | string
}

const safeAreaPadding = {
  paddingTop: 'max(16px, env(safe-area-inset-top))',
  paddingRight: 'max(16px, env(safe-area-inset-right))',
  paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
  paddingLeft: 'max(16px, env(safe-area-inset-left))',
} as const

export function AppShell({ children, game = false, maxWidth = 760 }: AppShellProps) {
  return (
    <Box
      component="main"
      data-game-layout={game ? 'true' : 'false'}
      sx={{
        ...safeAreaPadding,
        background: game
          ? 'linear-gradient(155deg, #d8eef7 0%, #b9dce9 100%)'
          : 'radial-gradient(circle at 50% -20%, #ffffff 0%, #eaf5fb 52%, #cfe8f3 100%)',
        boxSizing: 'border-box',
        height: game ? '100dvh' : 'auto',
        minHeight: '100svh',
        overflow: game ? 'hidden' : 'auto',
        width: '100%',
        '@media (prefers-reduced-motion: reduce)': {
          '& *, & *::before, & *::after': {
            scrollBehavior: 'auto !important',
            transitionDuration: '0.01ms !important',
          },
        },
      }}
    >
      <Box
        sx={{
          height: game ? '100%' : 'auto',
          marginInline: 'auto',
          maxWidth,
          width: '100%',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
