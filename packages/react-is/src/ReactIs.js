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
    switch (getType(object)) {
      case REACT_ASYNC_MODE_TYPE:
        return 'ReactAsyncMode';
      case REACT_FRAGMENT_TYPE:
        return 'ReactFragment';
      case REACT_STRICT_MODE_TYPE:
        return 'ReactStrictMode';
    }

    switch (getTypeTypeOf(object)) {
      case REACT_CONTEXT_TYPE:
        return 'ReactContextConsumer';
      case REACT_PROVIDER_TYPE:
        return 'ReactContextProvider';
    }

    switch (getTypeOf(object)) {
      case REACT_ELEMENT_TYPE:
        return 'ReactElement';
      case REACT_PORTAL_TYPE:
        return 'ReactPortal';
    }
  },
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
