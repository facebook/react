/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from "path";

// We assume this is run from `babel-plugin-react-forget`
export const COMPILER_PATH = path.join(
  process.cwd(),
  "dist",
  "Babel",
  "RunReactForgetBabelPlugin.js"
);
export const LOGGER_PATH = path.join(
  process.cwd(),
  "dist",
  "Utils",
  "logger.js"
);
export const PARSE_CONFIG_PRAGMA_PATH = path.join(
  process.cwd(),
  "dist",
  "HIR",
  "Environment.js"
);
export const FIXTURES_PATH = path.join(
  process.cwd(),
  "src",
  "__tests__",
  "fixtures",
  "compiler"
);
export const FILTER_FILENAME = "testfilter.txt";
export const FILTER_PATH = path.join(process.cwd(), FILTER_FILENAME);
