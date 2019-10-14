/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This "lowPriorityWarning" is an external module
const _lowPriorityWarning = require('lowPriorityWarning');

export default function lowPriorityWarningWithoutStack(format, ...args) {
  return _lowPriorityWarning(false, format, ...args);
}
