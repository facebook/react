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

function getComponentName(internalInstance) : string | null {
  if (typeof internalInstance.getName === 'function') {
    // Stack reconciler
    return internalInstance.getName() || 'Component';
  }
  if (typeof internalInstance.tag === 'number') {
    // Fiber reconciler
    const {type} = internalInstance;
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
