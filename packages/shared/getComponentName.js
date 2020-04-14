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
import type {ReactContext, ReactProviderType} from 'shared/ReactTypes';

function getWrappedName(
  outerType: mixed,
  innerType: any,
  wrapperName: string,
): string {
  const functionName = innerType.displayName || innerType.name || '';
  return (
    (outerType: any).displayName ||
    (functionName !== '' ? `${wrapperName}(${functionName})` : wrapperName)
  );
}

function getContextName(type: ReactContext<any>) {
  return type.displayName || 'Context';
}

function getComponentName(elementType: mixed): string | null {
  if (elementType == null) {
    // Host root, text node or just invalid type.
    return null;
  }
  if (__DEV__) {
    // TODO: protect against potential false positives from user-defined statics
    if (typeof (elementType: any).tag === 'number') {
      console.error(
        'Received an unexpected object in getComponentName(). ' +
          'This is likely a bug in React. Please file an issue.',
      );
    }
  }
  if (typeof elementType === 'function') {
    return (elementType: any).displayName || elementType.name || null;
  }
  if (typeof elementType === 'string') {
    return elementType;
  }
  switch (elementType) {
    case REACT_FRAGMENT_TYPE:
      return 'Fragment';
    case REACT_PORTAL_TYPE:
      return 'Portal';
    case REACT_PROFILER_TYPE:
      return `Profiler`;
    case REACT_STRICT_MODE_TYPE:
      return 'StrictMode';
    case REACT_SUSPENSE_TYPE:
      return 'Suspense';
    case REACT_SUSPENSE_LIST_TYPE:
      return 'SuspenseList';
  }
  if (typeof elementType === 'object') {
    switch (elementType.$$typeof) {
      case REACT_CONTEXT_TYPE:
        const context: ReactContext<any> = (elementType: any);
        return getContextName(context) + '.Consumer';
      case REACT_PROVIDER_TYPE:
        const provider: ReactProviderType<any> = (elementType: any);
        return getContextName(provider._context) + '.Provider';
      case REACT_FORWARD_REF_TYPE:
        return getWrappedName(elementType, elementType.render, 'ForwardRef');
      case REACT_MEMO_TYPE:
        return getComponentName(elementType.type);
      case REACT_BLOCK_TYPE:
        return getComponentName(elementType._render);
      case REACT_LAZY_TYPE: {
        const lazyComponent: LazyComponent<any, any> = (elementType: any);
        const payload = lazyComponent._payload;
        const init = lazyComponent._init;
        try {
          return getComponentName(init(payload));
        } catch (x) {
          return null;
        }
      }
    }
  }
  return null;
}

export default getComponentName;
