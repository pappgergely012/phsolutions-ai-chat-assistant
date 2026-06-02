import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import cssInjectedByJs from 'vite-plugin-css-injected-by-js'

export default defineConfig({
  plugins: [react(), tailwindcss(), cssInjectedByJs()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  build: {
    rollupOptions: {
      input: 'src/widget.tsx',
      output: {
        format: 'iife',
        entryFileNames: 'chat-widget.js',
        inlineDynamicImports: true,
      },
    },
    cssCodeSplit: false,
  },
})
