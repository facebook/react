/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const {resolve} = require('path');

function resolveFeatureFlags(target) {
  let flagsPath;
  switch (target) {
    case 'core/backend':
    case 'core/standalone':
    case 'inline':
    case 'shell':
      flagsPath = 'DevToolsFeatureFlags.default';
      break;
    case 'extension':
      flagsPath = 'DevToolsFeatureFlags.extension';
      break;
    default:
      console.error(`Invalid target "${target}"`);
      process.exit(1);
  }

  return resolve(__dirname, 'src/config/', flagsPath);
}

module.exports = {
  resolveFeatureFlags,
};
