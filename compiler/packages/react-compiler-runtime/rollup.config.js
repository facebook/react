/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import typescript from '@rollup/plugin-typescript';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import path from 'path';
import process from 'process';
import terser from '@rollup/plugin-terser';
import banner2 from 'rollup-plugin-banner2';

const NO_INLINE = new Set(['react']);

const PROD_ROLLUP_CONFIG = {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
    sourcemap: true,
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      compilerOptions: {
        noEmit: true,
      },
    }),
    json(),
    nodeResolve({
      preferBuiltins: true,
      resolveOnly: module => NO_INLINE.has(module) === false,
      rootDir: path.join(process.cwd(), '..'),
    }),
    commonjs(),
    terser({
      format: {
        comments: false,
      },
    }),
    banner2(
      () => `/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @lightSyntaxTransform
 * @noflow
 * @nolint
 * @preventMunge
 * @preserve-invariant-messages
 */

"use no memo";` // DO NOT REMOVE
    ),
  ],
};

export default PROD_ROLLUP_CONFIG;
