/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

import type {RefObject} from 'shared/ReactTypes';

import getComponentName from 'shared/getComponentName';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import warning from 'shared/warning';

// an immutable object with a single mutable value
export function createRef(): RefObject {
  const refObject = {
    current: null,
  };
  if (__DEV__) {
    const dispatcher = ReactSharedInternals.ReactCurrentDispatcher.current;
    const owner = ReactSharedInternals.ReactCurrentOwner.current;
    warning(
      dispatcher === null || dispatcher._isContextOnlyDispatcherDEV === true,
      '%s is a function component but called React.createRef(). This will ' +
        'create a new ref on every render instead of reusing it. Did you ' +
        'mean to use React.useRef() instead?',
      getComponentName(owner.type) || 'A component',
    );

    Object.seal(refObject);
  }
  return refObject;
}
