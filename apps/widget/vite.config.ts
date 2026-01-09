import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.tsx'),
      name: 'PixelPoint',
      fileName: () => 'pixelpoint.js',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        assetFileNames: 'pixelpoint.[ext]',
      },
    },
    cssCodeSplit: false,
  },
  server: {
    port: 3001,
  },
})
