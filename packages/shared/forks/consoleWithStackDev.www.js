/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This refers to a WWW module.
const warningWWW = require('warning');

export function warn() {
  // TODO: use different level for "warn".
  const args = Array.prototype.slice.call(arguments);
  args.unshift(false);
  warningWWW.apply(null, args);
}

export function error() {
  const args = Array.prototype.slice.call(arguments);
  args.unshift(false);
  warningWWW.apply(null, args);
}
