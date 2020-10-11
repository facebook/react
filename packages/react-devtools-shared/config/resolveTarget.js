/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function resolveTargetFlags(resolve, target) {
  let flagsPath;
  switch (target) {
    case 'local':
    case 'remote':
    case 'inline':
    case 'standalone':
    case 'backend':
      flagsPath = 'TargetFlags.default';
      break;
    case 'extension':
      flagsPath = 'TargetFlags.extension';
      break;
    default:
      console.error('invalid TARGET:', target);
      process.exit(1);
  }
  return resolve(__dirname, flagsPath);
}

module.exports = {
  resolveTargetFlags,
};
