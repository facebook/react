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

const ReactIs = {
  typeOf(object: any) {
    const type = getType(object);
    switch (type) {
      case REACT_ASYNC_MODE_TYPE:
      case REACT_FRAGMENT_TYPE:
      case REACT_STRICT_MODE_TYPE:
        return type;
    }

    const typeTypeOf = getTypeTypeOf(object);
    switch (typeTypeOf) {
      case REACT_CONTEXT_TYPE:
      case REACT_PROVIDER_TYPE:
        return typeTypeOf;
    }

    const typeOf = getTypeOf(object);
    switch (typeOf) {
      case REACT_ELEMENT_TYPE:
      case REACT_PORTAL_TYPE:
        return typeOf;
    }
  },

  AsyncMode: REACT_ASYNC_MODE_TYPE,
  ContextConsumer: REACT_CONTEXT_TYPE,
  ContextProvider: REACT_PROVIDER_TYPE,
  Element: REACT_ELEMENT_TYPE,
  Fragment: REACT_FRAGMENT_TYPE,
  Portal: REACT_PORTAL_TYPE,
  StrictMode: REACT_STRICT_MODE_TYPE,

  isAsyncMode(object: any) {
    return getType(object) === REACT_ASYNC_MODE_TYPE;
  },
  isContextConsumer(object: any) {
    return getTypeTypeOf(object) === REACT_CONTEXT_TYPE;
  },
  isContextProvider(object: any) {
    return getTypeTypeOf(object) === REACT_PROVIDER_TYPE;
  },
  isElement(object: any) {
    return getTypeOf(object) === REACT_ELEMENT_TYPE;
  },
  isFragment(object: any) {
    return getType(object) === REACT_FRAGMENT_TYPE;
  },
  isPortal(object: any) {
    return getTypeOf(object) === REACT_PORTAL_TYPE;
  },
  isStrictMode(object: any) {
    return getType(object) === REACT_STRICT_MODE_TYPE;
  },
};

export default ReactIs;
