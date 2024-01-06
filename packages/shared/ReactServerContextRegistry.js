/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactServerContext} from 'shared/ReactTypes';

import {
  REACT_PROVIDER_TYPE,
  REACT_SERVER_CONTEXT_TYPE,
  REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED,
} from 'shared/ReactSymbols';

import ReactSharedInternals from 'shared/ReactSharedInternals';

const ContextRegistry = ReactSharedInternals.ContextRegistry;

export function getOrCreateServerContext(
  globalName: string,
): ReactServerContext<any> {
  if (!ContextRegistry[globalName]) {
    const context: ReactServerContext<any> = {
      $$typeof: REACT_SERVER_CONTEXT_TYPE,

      // As a workaround to support multiple concurrent renderers, we categorize
      // some renderers as primary and others as secondary. We only expect
      // there to be two concurrent renderers at most: React Native (primary) and
      // Fabric (secondary); React DOM (primary) and React ART (secondary).
      // Secondary renderers store their context values on separate fields.
      _currentValue: REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED,
      _currentValue2: REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED,

      _defaultValue: REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED,

      // Used to track how many concurrent renderers this context currently
      // supports within in a single renderer. Such as parallel server rendering.
      _threadCount: 0,
      // These are circular
      Provider: (null: any),
      Consumer: (null: any),
      _globalName: globalName,
    };

    context.Provider = {
      $$typeof: REACT_PROVIDER_TYPE,
      _context: context,
    };

    if (__DEV__) {
      let hasWarnedAboutUsingConsumer;
      context._currentRenderer = null;
      context._currentRenderer2 = null;
      Object.defineProperties(
        context,
        ({
          Consumer: {
            get() {
              if (!hasWarnedAboutUsingConsumer) {
                console.error(
                  'Consumer pattern is not supported by ReactServerContext',
                );
                hasWarnedAboutUsingConsumer = true;
              }
              return null;
            },
          },
        }: any),
      );
    }
    ContextRegistry[globalName] = context;
  }
  return ContextRegistry[globalName];
}
