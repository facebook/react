/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

function validateWebpackTarget(target) {
  if (!target) {
    console.error('TARGET not set');
    process.exit(1);
  }
  switch (target) {
    case 'local':
      return;
    case 'remote':
      return;
    case 'inline':
      return;
    case 'standalone':
      return;
    case 'backend':
      return;
    case 'extension':
      return;
    default:
      console.error('invalid TARGET:', target);
      process.exit(1);
  }
}

module.exports = {
  resolveTargetFlags,
};
