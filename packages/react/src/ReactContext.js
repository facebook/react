/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  REACT_PROVIDER_TYPE,
  REACT_CONSUMER_TYPE,
  REACT_CONTEXT_TYPE,
} from 'shared/ReactSymbols';

import type {ReactContext} from 'shared/ReactTypes';
import {enableRenderableContext} from 'shared/ReactFeatureFlags';

export function createContext<T>(defaultValue: T): ReactContext<T> {
  // TODO: Second argument used to be an optional `calculateChangedBits`
  // function. Warn to reserve for future use?

  const context: ReactContext<T> = {
    $$typeof: REACT_CONTEXT_TYPE,
    // As a workaround to support multiple concurrent renderers, we categorize
    // some renderers as primary and others as secondary. We only expect
    // there to be two concurrent renderers at most: React Native (primary) and
    // Fabric (secondary); React DOM (primary) and React ART (secondary).
    // Secondary renderers store their context values on separate fields.
    _currentValue: defaultValue,
    _currentValue2: defaultValue,
    // Used to track how many concurrent renderers this context currently
    // supports within in a single renderer. Such as parallel server rendering.
    _threadCount: 0,
    // These are circular
    Provider: (null: any),
    Consumer: (null: any),
  };

  if (enableRenderableContext) {
    context.Provider = context;
    context.Consumer = {
      $$typeof: REACT_CONSUMER_TYPE,
      _context: context,
    };
  } else {
    (context: any).Provider = {
      $$typeof: REACT_PROVIDER_TYPE,
      _context: context,
    };
    if (__DEV__) {
      const Consumer: any = {
        $$typeof: REACT_CONTEXT_TYPE,
        _context: context,
      };
      Object.defineProperties(Consumer, {
        Provider: {
          get() {
            return context.Provider;
          },
          set(_Provider: any) {
            context.Provider = _Provider;
          },
        },
        _currentValue: {
          get() {
            return context._currentValue;
          },
          set(_currentValue: T) {
            context._currentValue = _currentValue;
          },
        },
        _currentValue2: {
          get() {
            return context._currentValue2;
          },
          set(_currentValue2: T) {
            context._currentValue2 = _currentValue2;
          },
        },
        _threadCount: {
          get() {
            return context._threadCount;
          },
          set(_threadCount: number) {
            context._threadCount = _threadCount;
          },
        },
        Consumer: {
          get() {
            return context.Consumer;
          },
        },
        displayName: {
          get() {
            return context.displayName;
          },
          set(displayName: void | string) {},
        },
      });
      (context: any).Consumer = Consumer;
    } else {
      (context: any).Consumer = context;
    }
  }

  if (__DEV__) {
    context._currentRenderer = null;
    context._currentRenderer2 = null;
  }

  return context;
}
