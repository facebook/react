/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This refers to a WWW module.
const warningWWW = require('warning');

export default function warningWithoutStack(format, ...args) {
  return warningWWW(false, format, ...args);
}
