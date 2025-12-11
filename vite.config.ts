import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: 'index.html',
      output: {
        manualChunks: {
          phaser: ['phaser'],
          capacitor: [
            '@capacitor/core',
            '@capacitor/haptics',
            '@capacitor/splash-screen',
            '@capacitor/status-bar'
          ]
        }
      }
    }
  },
  server: {
    port: 8000,
    open: true
  },
  preview: {
    port: 8000
  }
})
