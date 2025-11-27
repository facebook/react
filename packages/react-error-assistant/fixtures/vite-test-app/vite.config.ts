import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// Import from the source (relative to fixtures/vite-test-app)
import { errorAssistant } from '../../src/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    errorAssistant({
      enabled: true,
    }),
  ],
  // Temporarily commented out to test error handling
  // resolve: {
  //   alias: {
  //     '@': path.resolve(__dirname, './src'),
  //   },
  // },
});

