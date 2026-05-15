/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';

// We assume this is run from `babel-plugin-react-compiler`
export const PROJECT_ROOT = path.normalize(
  path.join(process.cwd(), '..', 'babel-plugin-react-compiler'),
);

export const PROJECT_SRC = path.normalize(
  path.join(PROJECT_ROOT, 'dist', 'index.js'),
);
export const PRINT_HIR_IMPORT = 'printFunctionWithOutlined';
export const PRINT_REACTIVE_IR_IMPORT = 'printReactiveFunction';
export const PARSE_CONFIG_PRAGMA_IMPORT = 'parseConfigPragmaForTests';
export const FIXTURES_PATH = path.join(
  PROJECT_ROOT,
  'src',
  '__tests__',
  'fixtures',
  'compiler',
);
export const SNAPSHOT_EXTENSION = '.expect.md';
export const FILTER_FILENAME = 'testfilter.txt';
export const FILTER_PATH = path.join(PROJECT_ROOT, FILTER_FILENAME);
