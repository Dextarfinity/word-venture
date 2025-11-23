/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    legacy()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8100, // Default Ionic port
    fs: {
      // Allow serving files from the models directory
      allow: ['..']
    }
  },
  publicDir: 'public', // Explicitly set public directory
  assetsInclude: ['**/*.zip', '**/*.tar.gz'], // Include .zip and .tar.gz files as static assets
  test: {
    globals: true,
    environment: 'jsdom'
  }
})
