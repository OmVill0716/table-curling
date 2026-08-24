import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { DevelopmentStatus } from './components/DevelopmentStatus'

const theme = createTheme({
  palette: {
    background: {
      default: '#e7f4ff',
    },
    primary: {
      main: '#145da0',
    },
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'center',
          minHeight: '100svh',
          p: 3,
        }}
      >
        <DevelopmentStatus />
      </Box>
    </ThemeProvider>
  )
}

export default App
