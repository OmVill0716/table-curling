import { createTheme } from '@mui/material'

export const gameColors = {
  background: '#eaf5fb',
  backgroundDeep: '#cfe8f3',
  ink: '#153047',
  paper: '#fffdf8',
  primary: '#126782',
  primaryDark: '#0a485d',
  accent: '#f28f3b',
  score: {
    0: '#e9eef2',
    10: '#75c8ae',
    30: '#55a6d9',
    50: '#f6c85f',
    100: '#ef6461',
  },
  surface: {
    ICE: '#bde5f5',
    WOOD: '#d6a86e',
    FELT: '#77a66b',
  },
} as const

export const appTheme = createTheme({
  palette: {
    background: {
      default: gameColors.background,
      paper: gameColors.paper,
    },
    primary: {
      main: gameColors.primary,
      dark: gameColors.primaryDark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: gameColors.accent,
    },
    text: {
      primary: gameColors.ink,
      secondary: '#496477',
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily:
      '"Noto Sans JP", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    h1: {
      fontSize: 'clamp(2rem, 7vw, 3.75rem)',
      fontWeight: 900,
      letterSpacing: '0.02em',
    },
    h2: {
      fontSize: 'clamp(1.65rem, 5vw, 2.5rem)',
      fontWeight: 800,
    },
    button: {
      fontWeight: 800,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: 14,
          paddingInline: 20,
          '&:focus-visible': {
            outline: `3px solid ${gameColors.accent}`,
            outlineOffset: 3,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 44,
          minWidth: 72,
          '&:focus-visible': {
            outline: `3px solid ${gameColors.accent}`,
            outlineOffset: -3,
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-switchBase:focus-visible': {
            outline: `3px solid ${gameColors.accent}`,
            outlineOffset: 1,
          },
        },
      },
    },
  },
})
