import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';
import rsc from './basic/plugin';
import Inspect from 'vite-plugin-inspect';

export default defineConfig({
  clearScreen: false,
  build: {
    minify: false,
  },
  plugins: [
    react(),
    rsc({
      entries: {
        browser: '/src/entry.browser.tsx',
        rsc: '/src/entry.rsc.tsx',
        ssr: '/src/entry.ssr.tsx',
        css: '/src/styles.css',
      },
    }),
    Inspect(),
  ],
  optimizeDeps: {
    include: ['rsc-html-stream/client'],
  },
}) as any;
