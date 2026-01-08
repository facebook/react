/** 
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

function isValidElementType(type) {
  return (
    typeof type === 'string' ||
    typeof type === 'function' ||
    (type != null && typeof type === 'object' && 'render' in type)
  );
}

module.exports = isValidElementType;
