/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 */

import {REACT_MEMO_TYPE, REACT_FORWARD_REF_TYPE} from 'shared/ReactSymbols';
import shallowEqual from 'shared/shallowEqual';

export function memo<Props>(
  type: React$ElementType,
  compare?: (oldProps: Props, newProps: Props, oldRef: mixed, newRef: mixed) => boolean,
) {
  if (__DEV__) {
    if (type == null) {
      console.error(
        'memo: The first argument must be a component. Instead ' +
          'received: %s',
        type === null ? 'null' : typeof type,
      );
    }
  }

  // Create custom compare function that includes ref for forwardRef components
  const isForwardRefComponent = typeof type === 'object' && type !== null && type.$$typeof === REACT_FORWARD_REF_TYPE;
  let finalCompare = compare;
  
  if (isForwardRefComponent && compare === undefined) {
    // Default compare for forwardRef: shallow equal props + strict equal ref
    finalCompare = function compareWithRef(oldProps, newProps, oldRef, newRef) {
      return shallowEqual(oldProps, newProps) && oldRef === newRef;
    };
  }

  const elementType = {
    $$typeof: REACT_MEMO_TYPE,
    type,
    compare: finalCompare === undefined ? null : finalCompare,
  };
  if (__DEV__) {
    let ownName;
    Object.defineProperty(elementType, 'displayName', {
      enumerable: false,
      configurable: true,
      get: function () {
        return ownName;
      },
      set: function (name) {
        ownName = name;

        // The inner component shouldn't inherit this display name in most cases,
        // because the component may be used elsewhere.
        // But it's nice for anonymous functions to inherit the name,
        // so that our component-stack generation logic will display their frames.
        // An anonymous function generally suggests a pattern like:
        //   React.memo((props) => {...});
        // This kind of inner function is not used elsewhere so the side effect is okay.
        if (!type.name && !type.displayName) {
          Object.defineProperty(type, 'name', {
            value: name,
          });
          type.displayName = name;
        }
      },
    });
  }
  return elementType;
}
