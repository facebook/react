/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {LazyComponent} from 'react/src/ReactLazy';

import {
  REACT_CONTEXT_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_PORTAL_TYPE,
  REACT_MEMO_TYPE,
  REACT_PROFILER_TYPE,
  REACT_PROVIDER_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_SUSPENSE_TYPE,
  REACT_SUSPENSE_LIST_TYPE,
  REACT_LAZY_TYPE,
  REACT_BLOCK_TYPE,
} from 'shared/ReactSymbols';

type HermesSourceLocation = {
  +fileName: ?string,
  +lineNumber?: ?number,
  +columnNumber?: ?number,
  +cjsModuleOffset?: ?number,
  +virtualOffset?: ?number,
  +isNative: ?boolean,
  ...
};

export type RuntimeSourceLocation = {
  +hermes?: HermesSourceLocation,
};

function getFunctionLocation(type: Function): RuntimeSourceLocation | null {
  if (
    typeof global.HermesInternal === 'object' &&
    global.HermesInternal &&
    typeof global.HermesInternal.getFunctionLocation === 'function'
  ) {
    return {hermes: global.HermesInternal.getFunctionLocation(type)};
  }
  return null;
}

function getComponentLocation(type: mixed): RuntimeSourceLocation | null {
  if (type == null) {
    // Host root, text node or just invalid type.
    return null;
  }
  if (__DEV__) {
    if (typeof (type: any).tag === 'number') {
      console.error(
        'Received an unexpected object in getComponentLocation(). ' +
          'This is likely a bug in React. Please file an issue.',
      );
    }
  }
  if (typeof type === 'function') {
    // TODO: User-defined HOCs?
    return getFunctionLocation((type: any));
  }
  if (typeof type === 'string') {
    return null;
  }
  switch (type) {
    case REACT_FRAGMENT_TYPE:
      return null;
    case REACT_PORTAL_TYPE:
      return null;
    case REACT_PROFILER_TYPE:
      return null;
    case REACT_STRICT_MODE_TYPE:
      return null;
    case REACT_SUSPENSE_TYPE:
      return null;
    case REACT_SUSPENSE_LIST_TYPE:
      return null;
  }
  if (typeof type === 'object') {
    switch (type.$$typeof) {
      case REACT_CONTEXT_TYPE:
        return null;
      case REACT_PROVIDER_TYPE:
        return null;
      case REACT_FORWARD_REF_TYPE:
        return getComponentLocation(type.render);
      case REACT_MEMO_TYPE:
        return getComponentLocation(type.type);
      case REACT_BLOCK_TYPE:
        return getComponentLocation(type._render);
      case REACT_LAZY_TYPE: {
        const lazyComponent: LazyComponent<any, any> = (type: any);
        const payload = lazyComponent._payload;
        const init = lazyComponent._init;
        try {
          return getComponentLocation(init(payload));
        } catch (x) {
          return null;
        }
      }
    }
  }
  return null;
}

export default getComponentLocation;
