/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This "lowPriorityWarning" is an external module
const lowPriorityWarning = require('lowPriorityWarning');

export default function(...args) {
  // eslint-disable-next-line react-internal/warning-args, react-internal/no-production-logging
  return lowPriorityWarning(args);
}
