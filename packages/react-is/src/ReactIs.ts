/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
  REACT_CONSUMER_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_SUSPENSE_TYPE,
  REACT_SUSPENSE_LIST_TYPE,
  REACT_VIEW_TRANSITION_TYPE,
  REACT_SCOPE_TYPE,
  REACT_LEGACY_HIDDEN_TYPE,
  REACT_TRACING_MARKER_TYPE,
} from 'shared/ReactSymbols';

import {
  enableScopeAPI,
  enableTransitionTracing,
  enableLegacyHidden,
  enableViewTransition,
} from 'shared/ReactFeatureFlags';

const REACT_CLIENT_REFERENCE: symbol = Symbol.for('react.client.reference');

export function typeOf(object: unknown): symbol | undefined {
  if (typeof object === 'object' && object !== null) {
    const $$typeof = (object as any).$$typeof;
    switch ($$typeof) {
      case REACT_ELEMENT_TYPE:
        const type = (object as any).type;

        switch (type) {
          case REACT_FRAGMENT_TYPE:
          case REACT_PROFILER_TYPE:
          case REACT_STRICT_MODE_TYPE:
          case REACT_SUSPENSE_TYPE:
          case REACT_SUSPENSE_LIST_TYPE:
          case REACT_VIEW_TRANSITION_TYPE:
            return type;
          default:
            const $$typeofType = type && type.$$typeof;

            switch ($$typeofType) {
              case REACT_CONTEXT_TYPE:
              case REACT_FORWARD_REF_TYPE:
              case REACT_LAZY_TYPE:
              case REACT_MEMO_TYPE:
                return $$typeofType;
              case REACT_CONSUMER_TYPE:
                return $$typeofType;
              // Fall through
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

export const ContextConsumer: symbol = REACT_CONSUMER_TYPE;
export const ContextProvider: symbol = REACT_CONTEXT_TYPE;
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

export function isValidElementType(type: unknown): boolean {
  if (typeof type === 'string' || typeof type === 'function') {
    return true;
  }

  // Note: typeof might be other than 'symbol' or 'number' (e.g. if it's a polyfill).
  if (
    type === REACT_FRAGMENT_TYPE ||
    type === REACT_PROFILER_TYPE ||
    type === REACT_STRICT_MODE_TYPE ||
    type === REACT_SUSPENSE_TYPE ||
    type === REACT_SUSPENSE_LIST_TYPE ||
    (enableLegacyHidden && type === REACT_LEGACY_HIDDEN_TYPE) ||
    (enableScopeAPI && type === REACT_SCOPE_TYPE) ||
    (enableTransitionTracing && type === REACT_TRACING_MARKER_TYPE) ||
    (enableViewTransition && type === REACT_VIEW_TRANSITION_TYPE)
  ) {
    return true;
  }

  if (typeof type === 'object' && type !== null) {
    if (
      (type as any).$$typeof === REACT_LAZY_TYPE ||
      (type as any).$$typeof === REACT_MEMO_TYPE ||
      (type as any).$$typeof === REACT_CONTEXT_TYPE ||
      (type as any).$$typeof === REACT_CONSUMER_TYPE ||
      (type as any).$$typeof === REACT_FORWARD_REF_TYPE ||
      // This needs to include all possible module reference object
      // types supported by any Flight configuration anywhere since
      // we don't know which Flight build this will end up being used
      // with.
      (type as any).$$typeof === REACT_CLIENT_REFERENCE ||
      (type as any).getModuleId !== undefined
    ) {
      return true;
    }
  }

  return false;
}

export function isContextConsumer(object: unknown): boolean {
  return typeOf(object) === REACT_CONSUMER_TYPE;
}
export function isContextProvider(object: unknown): boolean {
  return typeOf(object) === REACT_CONTEXT_TYPE;
}
export function isElement(object: unknown): boolean {
  return (
    typeof object === 'object' &&
    object !== null &&
    (object as any).$$typeof === REACT_ELEMENT_TYPE
  );
}
export function isForwardRef(object: unknown): boolean {
  return typeOf(object) === REACT_FORWARD_REF_TYPE;
}
export function isFragment(object: unknown): boolean {
  return typeOf(object) === REACT_FRAGMENT_TYPE;
}
export function isLazy(object: unknown): boolean {
  return typeOf(object) === REACT_LAZY_TYPE;
}
export function isMemo(object: unknown): boolean {
  return typeOf(object) === REACT_MEMO_TYPE;
}
export function isPortal(object: unknown): boolean {
  return typeOf(object) === REACT_PORTAL_TYPE;
}
export function isProfiler(object: unknown): boolean {
  return typeOf(object) === REACT_PROFILER_TYPE;
}
export function isStrictMode(object: unknown): boolean {
  return typeOf(object) === REACT_STRICT_MODE_TYPE;
}
export function isSuspense(object: unknown): boolean {
  return typeOf(object) === REACT_SUSPENSE_TYPE;
}
export function isSuspenseList(object: unknown): boolean {
  return typeOf(object) === REACT_SUSPENSE_LIST_TYPE;
}
