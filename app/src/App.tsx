import { Box, CssBaseline, ThemeProvider } from '@mui/material'
import { DevelopmentStatus } from './components/DevelopmentStatus'
import { appTheme } from './theme'

function App() {
  return (
    <ThemeProvider theme={appTheme}>
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
