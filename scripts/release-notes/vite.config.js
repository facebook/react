/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import apiPlugin from './plugins/api.js';

export default defineConfig({
  plugins: [react(), apiPlugin()],
  server: {
    port: 3123,
    watch: {
      ignored: ['**/state.json'],
    },
  },
});
