/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import {
  REACT_CONTEXT_TYPE,
  REACT_ELEMENT_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_LAZY_TYPE,
  REACT_MEMO_TYPE,
  REACT_PORTAL_TYPE,
  REACT_PROFILER_TYPE,
  REACT_PROVIDER_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_SUSPENSE_TYPE,
  REACT_SUSPENSE_LIST_TYPE,
} from 'shared/ReactSymbols';
import isValidElementType from 'shared/isValidElementType';

export function typeOf(object: any): mixed {
  if (typeof object === 'object' && object !== null) {
    const $$typeof = object.$$typeof;
    switch ($$typeof) {
      case REACT_ELEMENT_TYPE:
        const type = object.type;

        switch (type) {
          case REACT_FRAGMENT_TYPE:
          case REACT_PROFILER_TYPE:
          case REACT_STRICT_MODE_TYPE:
          case REACT_SUSPENSE_TYPE:
          case REACT_SUSPENSE_LIST_TYPE:
            return type;
          default:
            const $$typeofType = type && type.$$typeof;

            switch ($$typeofType) {
              case REACT_CONTEXT_TYPE:
              case REACT_FORWARD_REF_TYPE:
              case REACT_LAZY_TYPE:
              case REACT_MEMO_TYPE:
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

export const ContextConsumer = REACT_CONTEXT_TYPE;
export const ContextProvider = REACT_PROVIDER_TYPE;
export const Element = REACT_ELEMENT_TYPE;
export const ForwardRef = REACT_FORWARD_REF_TYPE;
export const Fragment = REACT_FRAGMENT_TYPE;
export const Lazy = REACT_LAZY_TYPE;
export const Memo = REACT_MEMO_TYPE;
export const Portal = REACT_PORTAL_TYPE;
export const Profiler = REACT_PROFILER_TYPE;
export const StrictMode = REACT_STRICT_MODE_TYPE;
export const Suspense = REACT_SUSPENSE_TYPE;
export const SuspenseList = REACT_SUSPENSE_LIST_TYPE;

export {isValidElementType};

let hasWarnedAboutDeprecatedIsAsyncMode = false;
let hasWarnedAboutDeprecatedIsConcurrentMode = false;

// AsyncMode should be deprecated
export function isAsyncMode(object: any): boolean {
  if (__DEV__) {
    if (!hasWarnedAboutDeprecatedIsAsyncMode) {
      hasWarnedAboutDeprecatedIsAsyncMode = true;
      // Using console['warn'] to evade Babel and ESLint
      console['warn'](
        'The ReactIs.isAsyncMode() alias has been deprecated, ' +
          'and will be removed in React 18+.',
      );
    }
  }
  return false;
}
export function isConcurrentMode(object: any): boolean {
  if (__DEV__) {
    if (!hasWarnedAboutDeprecatedIsConcurrentMode) {
      hasWarnedAboutDeprecatedIsConcurrentMode = true;
      // Using console['warn'] to evade Babel and ESLint
      console['warn'](
        'The ReactIs.isConcurrentMode() alias has been deprecated, ' +
          'and will be removed in React 18+.',
      );
    }
  }
  return false;
}
export function isContextConsumer(object: any): boolean {
  return typeOf(object) === REACT_CONTEXT_TYPE;
}
export function isContextProvider(object: any): boolean {
  return typeOf(object) === REACT_PROVIDER_TYPE;
}
export function isElement(object: any): boolean {
  return (
    typeof object === 'object' &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}
export function isForwardRef(object: any): boolean {
  return typeOf(object) === REACT_FORWARD_REF_TYPE;
}
export function isFragment(object: any): boolean {
  return typeOf(object) === REACT_FRAGMENT_TYPE;
}
export function isLazy(object: any): boolean {
  return typeOf(object) === REACT_LAZY_TYPE;
}
export function isMemo(object: any): boolean {
  return typeOf(object) === REACT_MEMO_TYPE;
}
export function isPortal(object: any): boolean {
  return typeOf(object) === REACT_PORTAL_TYPE;
}
export function isProfiler(object: any): boolean {
  return typeOf(object) === REACT_PROFILER_TYPE;
}
export function isStrictMode(object: any): boolean {
  return typeOf(object) === REACT_STRICT_MODE_TYPE;
}
export function isSuspense(object: any): boolean {
  return typeOf(object) === REACT_SUSPENSE_TYPE;
}
export function isSuspenseList(object: any): boolean {
  return typeOf(object) === REACT_SUSPENSE_LIST_TYPE;
}
