/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import prettier from 'rollup-plugin-prettier';
import banner2 from 'rollup-plugin-banner2';
import babel from '@rollup/plugin-babel';

const ROLLUP_CONFIG = {
  input: 'index.js',
  output: {
    file: 'dist/index.js',
    format: 'esm',
    sourcemap: false,
    exports: 'named',
  },
  plugins: [
    json(),
    babel({babelHelpers: 'bundled'}),
    terser({
      format: {
        comments: false,
      },
      compress: false,
      mangle: false,
    }),
    prettier(),
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
`
    ),
  ],
};

export default ROLLUP_CONFIG;
