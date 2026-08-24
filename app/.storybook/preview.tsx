import { Box, CssBaseline, ThemeProvider } from '@mui/material'
import type { Preview } from '@storybook/react-vite'
import { appTheme } from '../src/theme'

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 3,
          }}
        >
          <Story />
        </Box>
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
}

export default preview
