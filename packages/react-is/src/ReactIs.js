/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import {
  REACT_ASYNC_MODE_TYPE,
  REACT_CONTEXT_TYPE,
  REACT_ELEMENT_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_PORTAL_TYPE,
  REACT_PROVIDER_TYPE,
  REACT_STRICT_MODE_TYPE,
} from 'shared/ReactSymbols';

// e.g. Fragments, StrictMode
function getType(object: any) {
  return typeof object === 'object' && object !== null ? object.type : null;
}

// e.g. Elements, Portals
function getTypeOf(object: any) {
  return typeof object === 'object' && object !== null ? object.$$typeof : null;
}

// e.g. Context provider and consumer
function getTypeTypeOf(object: any) {
  return typeof object === 'object' &&
    object !== null &&
    typeof object.type === 'object' &&
    object.type !== null
    ? object.type.$$typeof
    : null;
}

export function typeOf(object: any) {
  let maybeType = getType(object);
  switch (maybeType) {
    case REACT_ASYNC_MODE_TYPE:
    case REACT_FRAGMENT_TYPE:
    case REACT_STRICT_MODE_TYPE:
      if (getTypeOf(object) === REACT_ELEMENT_TYPE) {
        return maybeType;
      }
  }

  maybeType = getTypeTypeOf(object);
  switch (maybeType) {
    case REACT_CONTEXT_TYPE:
    case REACT_PROVIDER_TYPE:
      return maybeType;
  }

  maybeType = getTypeOf(object);
  switch (maybeType) {
    case REACT_ELEMENT_TYPE:
    case REACT_PORTAL_TYPE:
      return maybeType;
  }
}

export const AsyncMode = REACT_ASYNC_MODE_TYPE;
export const ContextConsumer = REACT_CONTEXT_TYPE;
export const ContextProvider = REACT_PROVIDER_TYPE;
export const Element = REACT_ELEMENT_TYPE;
export const Fragment = REACT_FRAGMENT_TYPE;
export const Portal = REACT_PORTAL_TYPE;
export const StrictMode = REACT_STRICT_MODE_TYPE;

export function isAsyncMode(object: any) {
  return (
    getType(object) === REACT_ASYNC_MODE_TYPE &&
    getTypeOf(object) === REACT_ELEMENT_TYPE
  );
}
export function isContextConsumer(object: any) {
  return getTypeTypeOf(object) === REACT_CONTEXT_TYPE;
}
export function isContextProvider(object: any) {
  return getTypeTypeOf(object) === REACT_PROVIDER_TYPE;
}
export function isElement(object: any) {
  return getTypeOf(object) === REACT_ELEMENT_TYPE;
}
export function isFragment(object: any) {
  return (
    getType(object) === REACT_FRAGMENT_TYPE &&
    getTypeOf(object) === REACT_ELEMENT_TYPE
  );
}
export function isPortal(object: any) {
  return getTypeOf(object) === REACT_PORTAL_TYPE;
}
export function isStrictMode(object: any) {
  return (
    getType(object) === REACT_STRICT_MODE_TYPE &&
    getTypeOf(object) === REACT_ELEMENT_TYPE
  );
}
