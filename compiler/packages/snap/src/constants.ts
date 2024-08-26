/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';

// We assume this is run from `babel-plugin-react-compiler`
export const PROJECT_ROOT = path.normalize(
  path.join(process.cwd(), '..', '..'),
);
export const COMPILER_PATH = path.join(
  process.cwd(),
  'dist',
  'Babel',
  'BabelPlugin.js',
);
export const COMPILER_INDEX_PATH = path.join(process.cwd(), 'dist', 'index');
export const LOGGER_PATH = path.join(
  process.cwd(),
  'dist',
  'Utils',
  'logger.js',
);
export const PARSE_CONFIG_PRAGMA_PATH = path.join(
  process.cwd(),
  'dist',
  'HIR',
  'Environment.js',
);
export const FIXTURES_PATH = path.join(
  process.cwd(),
  'src',
  '__tests__',
  'fixtures',
  'compiler',
);
export const SNAPSHOT_EXTENSION = '.expect.md';
export const FILTER_FILENAME = 'testfilter.txt';
export const FILTER_PATH = path.join(process.cwd(), FILTER_FILENAME);
