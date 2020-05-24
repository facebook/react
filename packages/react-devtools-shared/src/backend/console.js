/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import type {CurrentDispatcherRef, ReactRenderer, WorkTagMap} from './types';

import {getInternalReactConstants} from './renderer';
import {getStackByFiberInDevAndProd} from './DevToolsFiberComponentStack';

const APPEND_STACK_TO_METHODS = ['error', 'trace', 'warn'];

// React's custom built component stack strings match "\s{4}in"
// Chrome's prefix matches "\s{4}at"
const PREFIX_REGEX = /\s{4}(in|at)\s{1}/;
// Firefox and Safari have no prefix ("")
// but we can fallback to looking for location info (e.g. "foo.js:12:345")
const ROW_COLUMN_NUMBER_REGEX = /:\d+:\d+(\n|$)/;

const injectedRenderers: Map<
  ReactRenderer,
  {|
    currentDispatcherRef: CurrentDispatcherRef,
    getCurrentFiber: () => Fiber | null,
    workTagMap: WorkTagMap,
  |},
> = new Map();

let targetConsole: Object = console;
let targetConsoleMethods = {};
for (const method in console) {
  targetConsoleMethods[method] = console[method];
}

let unpatchFn: null | (() => void) = null;

// Enables e.g. Jest tests to inject a mock console object.
export function dangerous_setTargetConsoleForTesting(
  targetConsoleForTesting: Object,
): void {
  targetConsole = targetConsoleForTesting;

  targetConsoleMethods = {};
  for (const method in targetConsole) {
    targetConsoleMethods[method] = console[method];
  }
}

// v16 renderers should use this method to inject internals necessary to generate a component stack.
// These internals will be used if the console is patched.
// Injecting them separately allows the console to easily be patched or un-patched later (at runtime).
export function registerRenderer(renderer: ReactRenderer): void {
  const {
    currentDispatcherRef,
    getCurrentFiber,
    findFiberByHostInstance,
    version,
  } = renderer;

  // Ignore React v15 and older because they don't expose a component stack anyway.
  if (typeof findFiberByHostInstance !== 'function') {
    return;
  }

  // currentDispatcherRef gets injected for v16.8+ to support hooks inspection.
  // getCurrentFiber gets injected for v16.9+.
  if (currentDispatcherRef != null && typeof getCurrentFiber === 'function') {
    const {ReactTypeOfWork} = getInternalReactConstants(version);

    injectedRenderers.set(renderer, {
      currentDispatcherRef,
      getCurrentFiber,
      workTagMap: ReactTypeOfWork,
    });
  }
}

// Patches whitelisted console methods to append component stack for the current fiber.
// Call unpatch() to remove the injected behavior.
export function patch(): void {
  if (unpatchFn !== null) {
    // Don't patch twice.
    return;
  }

  const originalConsoleMethods = {};

  unpatchFn = () => {
    for (const method in originalConsoleMethods) {
      try {
        // $FlowFixMe property error|warn is not writable.
        targetConsole[method] = originalConsoleMethods[method];
      } catch (error) {}
    }
  };

  APPEND_STACK_TO_METHODS.forEach(method => {
    try {
      const originalMethod = (originalConsoleMethods[method] =
        targetConsole[method]);

      const overrideMethod = (...args) => {
        try {
          // If we are ever called with a string that already has a component stack, e.g. a React error/warning,
          // don't append a second stack.
          const lastArg = args.length > 0 ? args[args.length - 1] : null;
          const alreadyHasComponentStack =
            lastArg !== null &&
            (PREFIX_REGEX.test(lastArg) ||
              ROW_COLUMN_NUMBER_REGEX.test(lastArg));

          if (!alreadyHasComponentStack) {
            // If there's a component stack for at least one of the injected renderers, append it.
            // We don't handle the edge case of stacks for more than one (e.g. interleaved renderers?)
            // eslint-disable-next-line no-for-of-loops/no-for-of-loops
            for (const {
              currentDispatcherRef,
              getCurrentFiber,
              workTagMap,
            } of injectedRenderers.values()) {
              const current: ?Fiber = getCurrentFiber();
              if (current != null) {
                const componentStack = getStackByFiberInDevAndProd(
                  workTagMap,
                  current,
                  currentDispatcherRef,
                );
                if (componentStack !== '') {
                  args.push(componentStack);
                }
                break;
              }
            }
          }
        } catch (error) {
          // Don't let a DevTools or React internal error interfere with logging.
        }

        originalMethod(...args);
      };

      overrideMethod.__REACT_DEVTOOLS_ORIGINAL_METHOD__ = originalMethod;

      // $FlowFixMe property error|warn is not writable.
      targetConsole[method] = overrideMethod;
    } catch (error) {}
  });
}

// Removed component stack patch from whitelisted console methods.
export function unpatch(): void {
  if (unpatchFn !== null) {
    unpatchFn();
    unpatchFn = null;
  }
}
