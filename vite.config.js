import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/convert': 'http://localhost:8080',
      '/merge': 'http://localhost:8080',
      '/split': 'http://localhost:8080',
      '/compress': 'http://localhost:8080',
      '/extract': 'http://localhost:8080',
      '/rotate': 'http://localhost:8080',
      '/reorder': 'http://localhost:8080',
    }
  }
})
