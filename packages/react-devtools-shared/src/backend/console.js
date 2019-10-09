/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {getInternalReactConstants} from './renderer';
import describeComponentFrame from './describeComponentFrame';

import type {Fiber} from 'react-reconciler/src/ReactFiber';
import type {ReactRenderer} from './types';

const APPEND_STACK_TO_METHODS = ['error', 'trace', 'warn'];

const FRAME_REGEX = /\n {4}in /;

type OnErrorOrWarning = (
  fiber: Fiber,
  type: 'error' | 'warn',
  args: Array<any>,
) => void;

const injectedRenderers: Map<
  ReactRenderer,
  {|
    getCurrentFiber: () => Fiber | null,
    getDisplayNameForFiber: (fiber: Fiber) => string | null,
    onErrorOrWarning: ?OnErrorOrWarning,
  |},
> = new Map();

let targetConsole: Object = console;
let targetConsoleMethods = {};
for (let method in console) {
  targetConsoleMethods[method] = console[method];
}

let unpatchFn: null | (() => void) = null;

// Enables e.g. Jest tests to inject a mock console object.
export function dangerous_setTargetConsoleForTesting(
  targetConsoleForTesting: Object,
): void {
  targetConsole = targetConsoleForTesting;

  targetConsoleMethods = {};
  for (let method in targetConsole) {
    targetConsoleMethods[method] = console[method];
  }
}

// v16 renderers should use this method to inject internals necessary to generate a component stack.
// These internals will be used if the console is patched.
// Injecting them separately allows the console to easily be patched or un-patched later (at runtime).
export function registerRenderer(
  renderer: ReactRenderer,
  onErrorOrWarning?: OnErrorOrWarning,
): void {
  const {getCurrentFiber, findFiberByHostInstance, version} = renderer;

  // Ignore React v15 and older because they don't expose a component stack anyway.
  if (typeof findFiberByHostInstance !== 'function') {
    return;
  }

  if (typeof getCurrentFiber === 'function') {
    const {getDisplayNameForFiber} = getInternalReactConstants(version);

    injectedRenderers.set(renderer, {
      getCurrentFiber,
      getDisplayNameForFiber,
      onErrorOrWarning,
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
    for (let method in originalConsoleMethods) {
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
          const alreadyHasComponentStack =
            args.length > 0 && FRAME_REGEX.exec(args[args.length - 1]);

          if (!alreadyHasComponentStack) {
            // If there's a component stack for at least one of the injected renderers, append it.
            // We don't handle the edge case of stacks for more than one (e.g. interleaved renderers?)
            // eslint-disable-next-line no-for-of-loops/no-for-of-loops
            for (let {
              getCurrentFiber,
              getDisplayNameForFiber,
              onErrorOrWarning,
            } of injectedRenderers.values()) {
              let current: ?Fiber = getCurrentFiber();
              let ownerStack: string = '';
              if (current != null) {
                if (method === 'error' || method === 'warn') {
                  if (typeof onErrorOrWarning === 'function') {
                    // TODO (inline errors) The renderer is injected in two places:
                    // 1. First by "react-devtools-shared/src/hook" which isn't stateful and doesn't supply onErrorOrWarning()
                    // 2. Second by "react-devtools-shared/src/backend/renderer" which is and does
                    //
                    // We should probably move the queueing+batching mechanism from backend/renderer to this file,
                    // so that it handles warnings logged during initial mount (potentially before step 2 above).
                    onErrorOrWarning(current, method, args);
                  }
                }

                while (current != null) {
                  const name = getDisplayNameForFiber(current);
                  const owner = current._debugOwner;
                  const ownerName =
                    owner != null ? getDisplayNameForFiber(owner) : null;

                  ownerStack += describeComponentFrame(
                    name,
                    current._debugSource,
                    ownerName,
                  );

                  current = owner;
                }
              }

              if (ownerStack !== '') {
                args.push(ownerStack);
                break;
              }
            }
          }
        } catch (error) {
          console.log(error);
          // Don't let a DevTools or React internal error interfere with logging.
        }

        originalMethod(...args);
      };

      overrideMethod.__REACT_DEVTOOLS_ORIGINAL_METHOD__ = originalMethod;
      originalMethod.__REACT_DEVTOOLS_OVERRIDE_METHOD__ = overrideMethod;

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
