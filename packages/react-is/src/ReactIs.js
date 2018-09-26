/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import {
  REACT_CONCURRENT_MODE_TYPE,
  REACT_CONTEXT_TYPE,
  REACT_ELEMENT_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_PORTAL_TYPE,
  REACT_PROFILER_TYPE,
  REACT_PROVIDER_TYPE,
  REACT_STRICT_MODE_TYPE,
} from 'shared/ReactSymbols';
import isValidElementType from 'shared/isValidElementType';
import lowPriorityWarning from 'shared/lowPriorityWarning';

export function typeOf(object: any) {
  if (typeof object === 'object' && object !== null) {
    const $$typeof = object.$$typeof;

    switch ($$typeof) {
      case REACT_ELEMENT_TYPE:
        const type = object.type;

        switch (type) {
          case REACT_CONCURRENT_MODE_TYPE:
          case REACT_FRAGMENT_TYPE:
          case REACT_PROFILER_TYPE:
          case REACT_STRICT_MODE_TYPE:
            return type;
          default:
            const $$typeofType = type && type.$$typeof;

            switch ($$typeofType) {
              case REACT_CONTEXT_TYPE:
              case REACT_FORWARD_REF_TYPE:
              case REACT_PROVIDER_TYPE:
                return $$typeofType;
              default:
                return $$typeof;
            }
        }
      case REACT_PORTAL_TYPE:
        return $$typeof;
    }
  }

  return undefined;
}

// AsyncMode alias is deprecated along with isAsyncMode
export const AsyncMode = REACT_CONCURRENT_MODE_TYPE;
export const ConcurrentMode = REACT_CONCURRENT_MODE_TYPE;
export const ContextConsumer = REACT_CONTEXT_TYPE;
export const ContextProvider = REACT_PROVIDER_TYPE;
export const Element = REACT_ELEMENT_TYPE;
export const ForwardRef = REACT_FORWARD_REF_TYPE;
export const Fragment = REACT_FRAGMENT_TYPE;
export const Profiler = REACT_PROFILER_TYPE;
export const Portal = REACT_PORTAL_TYPE;
export const StrictMode = REACT_STRICT_MODE_TYPE;

export {isValidElementType};

let hasWarnedAboutDeprecatedIsAsyncMode = false;

// AsyncMode should be deprecated
export function isAsyncMode(object: any) {
  if (__DEV__) {
    if (!hasWarnedAboutDeprecatedIsAsyncMode) {
      hasWarnedAboutDeprecatedIsAsyncMode = true;
      lowPriorityWarning(
        false,
        'The ReactIs.isAsyncMode() alias has been deprecated, ' +
          'and will be removed in React 17+. Update your code to use ' +
          'ReactIs.isConcurrentMode() instead. It has the exact same API.',
      );
    }
  }
  return isConcurrentMode(object);
}
export function isConcurrentMode(object: any) {
  return typeOf(object) === REACT_CONCURRENT_MODE_TYPE;
}
export function isContextConsumer(object: any) {
  return typeOf(object) === REACT_CONTEXT_TYPE;
}
export function isContextProvider(object: any) {
  return typeOf(object) === REACT_PROVIDER_TYPE;
}
export function isElement(object: any) {
  return (
    typeof object === 'object' &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}
export function isForwardRef(object: any) {
  return typeOf(object) === REACT_FORWARD_REF_TYPE;
}
export function isFragment(object: any) {
  return typeOf(object) === REACT_FRAGMENT_TYPE;
}
export function isProfiler(object: any) {
  return typeOf(object) === REACT_PROFILER_TYPE;
}
export function isPortal(object: any) {
  return typeOf(object) === REACT_PORTAL_TYPE;
}
export function isStrictMode(object: any) {
  return typeOf(object) === REACT_STRICT_MODE_TYPE;
}
