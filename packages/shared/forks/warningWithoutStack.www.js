/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const _warning = require('warning');

export default function warningWithoutStack(format, ...args) {
  return _warning(false, format, ...args);
}
