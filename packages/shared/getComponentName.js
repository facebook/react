/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule getComponentName
 * @flow
 */

'use strict';

import type {Fiber} from 'ReactFiber';

function getComponentName(fiber: Fiber): string | null {
  const {type} = fiber;
  if (typeof type === 'string') {
    return type;
  }
  if (typeof type === 'function') {
    return type.displayName || type.name;
  }
  return null;
}

module.exports = getComponentName;
