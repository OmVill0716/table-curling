import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ['matter-js', 'zustand', 'zustand/vanilla'],
  },
  plugins: [react()],
})
