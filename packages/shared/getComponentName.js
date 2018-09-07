/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'shared/ReactLazyComponent';

import warningWithoutStack from 'shared/warningWithoutStack';
import {
  REACT_ASYNC_MODE_TYPE,
  REACT_CONTEXT_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_PORTAL_TYPE,
  REACT_PROFILER_TYPE,
  REACT_PROVIDER_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_PLACEHOLDER_TYPE,
} from 'shared/ReactSymbols';
import {refineResolvedThenable} from 'shared/ReactLazyComponent';

function getComponentName(type: mixed): string | null {
  if (type == null) {
    // Host root, text node or just invalid type.
    return null;
  }
  if (__DEV__) {
    if (typeof (type: any).tag === 'number') {
      warningWithoutStack(
        false,
        'Received an unexpected object in getComponentName(). ' +
          'This is likely a bug in React. Please file an issue.',
      );
    }
  }
  if (typeof type === 'function') {
    return type.displayName || type.name || null;
  }
  if (typeof type === 'string') {
    return type;
  }
  switch (type) {
    case REACT_ASYNC_MODE_TYPE:
      return 'AsyncMode';
    case REACT_FRAGMENT_TYPE:
      return 'Fragment';
    case REACT_PORTAL_TYPE:
      return 'Portal';
    case REACT_PROFILER_TYPE:
      return `Profiler`;
    case REACT_STRICT_MODE_TYPE:
      return 'StrictMode';
    case REACT_PLACEHOLDER_TYPE:
      return 'Placeholder';
  }
  if (typeof type === 'object') {
    switch (type.$$typeof) {
      case REACT_CONTEXT_TYPE:
        return 'Context.Consumer';
      case REACT_PROVIDER_TYPE:
        return 'Context.Provider';
      case REACT_FORWARD_REF_TYPE:
        const renderFn = (type.render: any);
        const functionName = renderFn.displayName || renderFn.name || '';
        return functionName !== ''
          ? `ForwardRef(${functionName})`
          : 'ForwardRef';
    }
    if (typeof type.then === 'function') {
      const thenable: Thenable<mixed> = (type: any);
      const resolvedThenable = refineResolvedThenable(thenable);
      if (resolvedThenable) {
        return getComponentName(resolvedThenable);
      }
    }
  }
  return null;
}

export default getComponentName;
