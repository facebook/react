/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule getComponentName
 */

'use strict';

import type { ReactInstance } from 'ReactInstanceType';
import type { Fiber } from 'ReactFiber';

function getComponentName(instanceOrFiber : ReactInstance | Fiber) : string | null {
  if (typeof instanceOrFiber.getName === 'function') {
    // Stack reconciler
    const instance = ((instanceOrFiber : any) : ReactInstance);
    return instance.getName() || 'Component' || null;
  }
  if (typeof instanceOrFiber.tag === 'number') {
    // Fiber reconciler
    const fiber = ((instanceOrFiber : any) : Fiber);
    const {type} = fiber;
    if (typeof type === 'string') {
      return type;
    }
    if (typeof type === 'function') {
      return type.displayName || type.name || null;
    }
  }
  return null;
}

module.exports = getComponentName;
