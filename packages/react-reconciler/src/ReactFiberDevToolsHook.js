/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {enableProfilerTimer} from 'shared/ReactFeatureFlags';
import {requestCurrentTime} from './ReactFiberWorkLoop';
import {inferPriorityFromExpirationTime} from './ReactFiberExpirationTime';

import type {Fiber} from './ReactFiber';
import type {FiberRoot} from './ReactFiberRoot';
import type {ExpirationTime} from './ReactFiberExpirationTime';

import {DidCapture} from 'shared/ReactSideEffectTags';
import warningWithoutStack from 'shared/warningWithoutStack';

declare var __REACT_DEVTOOLS_GLOBAL_HOOK__: Object | void;

let onCommitFiberRoot = null;
let onCommitFiberUnmount = null;
let hasLoggedError = false;

export const isDevToolsPresent =
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined';

export function injectInternals(internals: Object): boolean {
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === 'undefined') {
    // No DevTools
    return false;
  }
  const hook = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (hook.isDisabled) {
    // This isn't a real property on the hook, but it can be set to opt out
    // of DevTools integration and associated warnings and logs.
    // https://github.com/facebook/react/issues/3877
    return true;
  }
  if (!hook.supportsFiber) {
    if (__DEV__) {
      warningWithoutStack(
        false,
        'The installed version of React DevTools is too old and will not work ' +
          'with the current version of React. Please update React DevTools. ' +
          'https://fb.me/react-devtools',
      );
    }
    // DevTools exists, even though it doesn't support Fiber.
    return true;
  }
  try {
    const rendererID = hook.inject(internals);
    // We have successfully injected, so now it is safe to set up hooks.
    onCommitFiberRoot = (root, expirationTime) => {
      try {
        const didError = (root.current.effectTag & DidCapture) === DidCapture;
        if (enableProfilerTimer) {
          const currentTime = requestCurrentTime();
          const priorityLevel = inferPriorityFromExpirationTime(
            currentTime,
            expirationTime,
          );
          hook.onCommitFiberRoot(rendererID, root, priorityLevel, didError);
        } else {
          hook.onCommitFiberRoot(rendererID, root, undefined, didError);
        }
      } catch (err) {
        if (__DEV__ && !hasLoggedError) {
          hasLoggedError = true;
          warningWithoutStack(
            false,
            'React DevTools encountered an error: %s',
            err,
          );
        }
      }
    };
    onCommitFiberUnmount = fiber => {
      try {
        hook.onCommitFiberUnmount(rendererID, fiber);
      } catch (err) {
        if (__DEV__ && !hasLoggedError) {
          hasLoggedError = true;
          warningWithoutStack(
            false,
            'React DevTools encountered an error: %s',
            err,
          );
        }
      }
    };
  } catch (err) {
    // Catch all errors because it is unsafe to throw during initialization.
    if (__DEV__) {
      warningWithoutStack(
        false,
        'React DevTools encountered an error: %s.',
        err,
      );
    }
  }
  // DevTools exists
  return true;
}

export function onCommitRoot(root: FiberRoot, expirationTime: ExpirationTime) {
  if (typeof onCommitFiberRoot === 'function') {
    onCommitFiberRoot(root, expirationTime);
  }
}

export function onCommitUnmount(fiber: Fiber) {
  if (typeof onCommitFiberUnmount === 'function') {
    onCommitFiberUnmount(fiber);
  }
}
