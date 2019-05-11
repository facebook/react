/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {LazyComponent} from 'shared/ReactLazyComponent';

import warningWithoutStack from 'shared/warningWithoutStack';
import {
  REACT_CONCURRENT_MODE_TYPE,
  REACT_CONTEXT_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_PORTAL_TYPE,
  REACT_MEMO_TYPE,
  REACT_PROFILER_TYPE,
  REACT_PROVIDER_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_SUSPENSE_TYPE,
  REACT_LAZY_TYPE,
  REACT_EVENT_COMPONENT_TYPE,
  REACT_EVENT_TARGET_TYPE,
  REACT_EVENT_TARGET_TOUCH_HIT,
} from 'shared/ReactSymbols';
import {refineResolvedLazyComponent} from 'shared/ReactLazyComponent';
import type {ReactEventComponent, ReactEventTarget} from 'shared/ReactTypes';

import {enableEventAPI} from './ReactFeatureFlags';

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
    case REACT_CONCURRENT_MODE_TYPE:
      return 'ConcurrentMode';
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
  }
  if (typeof type === 'object') {
    switch (type.$$typeof) {
      case REACT_CONTEXT_TYPE:
        return 'Context.Consumer';
      case REACT_PROVIDER_TYPE:
        return 'Context.Provider';
      case REACT_FORWARD_REF_TYPE:
        return getWrappedName(type, type.render, 'ForwardRef');
      case REACT_MEMO_TYPE:
        return getComponentName(type.type);
      case REACT_LAZY_TYPE: {
        const thenable: LazyComponent<mixed> = (type: any);
        const resolvedThenable = refineResolvedLazyComponent(thenable);
        if (resolvedThenable) {
          return getComponentName(resolvedThenable);
        }
        break;
      }
      case REACT_EVENT_COMPONENT_TYPE: {
        if (enableEventAPI) {
          const eventComponent = ((type: any): ReactEventComponent);
          const displayName = eventComponent.displayName;
          if (displayName !== undefined) {
            return displayName;
          }
        }
        break;
      }
      case REACT_EVENT_TARGET_TYPE: {
        if (enableEventAPI) {
          const eventTarget = ((type: any): ReactEventTarget);
          if (eventTarget.type === REACT_EVENT_TARGET_TOUCH_HIT) {
            return 'TouchHitTarget';
          }
          const displayName = eventTarget.displayName;
          if (displayName !== undefined) {
            return displayName;
          }
        }
      }
    }
  }
  return null;
}

export default getComponentName;
