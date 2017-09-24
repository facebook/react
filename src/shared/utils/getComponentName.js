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

import type {ReactInstance} from 'ReactInstanceType';
import type {Fiber} from 'ReactFiber';

function getComponentName(
  instanceOrFiber: ReactInstance | Fiber,
): string | null {
  if (typeof instanceOrFiber.getName === 'function') {
    // Stack reconciler
    const instance = ((instanceOrFiber: any): ReactInstance);
    return instance.getName();
  }
  if (typeof instanceOrFiber.tag === 'number') {
    // Fiber reconciler
    const fiber = ((instanceOrFiber: any): Fiber);
    const {type} = fiber;
    if (typeof type === 'string') {
      return type;
    }
    if (typeof type === 'function') {
      return type.displayName || type.name;
    }
  }
  return null;
}

module.exports = getComponentName;
