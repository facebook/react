// @flow

import { getInternalReactConstants } from './renderer';
import describeComponentFrame from './describeComponentFrame';

import type { Fiber, ReactRenderer } from './types';

const FRAME_REGEX = /\n {4}in /;

const injectedRenderers: Map<
  ReactRenderer,
  {|
    getCurrentFiber: () => Fiber | null,
    getDisplayNameForFiber: (fiber: Fiber) => string | null,
  |}
> = new Map();

let isDisabled: boolean = false;
let unpatchFn: null | (() => void) = null;

export function disable(): void {
  isDisabled = true;
}

export function enable(): void {
  isDisabled = false;
}

export function registerRenderer(renderer: ReactRenderer): void {
  const { getCurrentFiber, findFiberByHostInstance, version } = renderer;

  // Ignore React v15 and older because they don't expose a component stack anyway.
  if (typeof findFiberByHostInstance !== 'function') {
    return;
  }

  if (typeof getCurrentFiber === 'function') {
    const { getDisplayNameForFiber } = getInternalReactConstants(version);

    injectedRenderers.set(renderer, {
      getCurrentFiber,
      getDisplayNameForFiber,
    });
  }
}

export function patch(targetConsole?: Object = console): void {
  if (unpatchFn !== null) {
    // Don't patch twice.
    return;
  }

  const originalConsoleMethods = { ...targetConsole };

  unpatchFn = () => {
    for (let method in targetConsole) {
      try {
        // $FlowFixMe property error|warn is not writable.
        targetConsole[method] = originalConsoleMethods[method];
      } catch (error) {}
    }
  };

  for (let method in targetConsole) {
    const appendComponentStack =
      method === 'error' || method === 'warn' || method === 'trace';

    const originalMethod = targetConsole[method];
    const overrideMethod = (...args) => {
      if (isDisabled) return;

      if (appendComponentStack) {
        // If we are ever called with a string that already has a component stack, e.g. a React error/warning,
        // don't append a second stack.
        const alreadyHasComponentStack =
          args.length > 0 && FRAME_REGEX.exec(args[args.length - 1]);

        if (!alreadyHasComponentStack) {
          // If there's a component stack for at least one of the injected renderers, append it.
          // We don't handle the edge case of stacks for more than one (e.g. interleaved renderers?)
          for (let {
            getCurrentFiber,
            getDisplayNameForFiber,
          } of injectedRenderers.values()) {
            let current: ?Fiber = getCurrentFiber();
            let ownerStack: string = '';
            while (current != null) {
              const name = getDisplayNameForFiber(current);
              const owner = current._debugOwner;
              const ownerName =
                owner != null ? getDisplayNameForFiber(owner) : null;

              ownerStack += describeComponentFrame(
                name,
                current._debugSource,
                ownerName
              );

              current = owner;
            }

            if (ownerStack !== '') {
              args.push(ownerStack);
              break;
            }
          }
        }
      }

      originalMethod(...args);
    };

    try {
      // $FlowFixMe property error|warn is not writable.
      targetConsole[method] = overrideMethod;
    } catch (error) {}
  }
}

export function unpatch(): void {
  if (unpatchFn !== null) {
    unpatchFn();
    unpatchFn = null;
  }
}
