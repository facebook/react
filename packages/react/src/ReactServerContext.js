/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {REACT_PROVIDER_TYPE, REACT_CONTEXT_TYPE} from 'shared/ReactSymbols';

import type {
  ReactServerContext,
  ServerContextJSONValue,
} from 'shared/ReactTypes';

const globalRegistry: {
  [globalName: string]: ReactServerContext<any>,
} = {};

export function createServerContext<T: ServerContextJSONValue>(
  globalName: string,
  defaultValue: T,
): ReactServerContext<T> {
  if (globalRegistry[globalName]) {
    throw new Error('ServerContext in that name already exists');
  }
  const context: ReactServerContext<T> = {
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
    displayName: globalName,
  };

  context.Provider = {
    $$typeof: REACT_PROVIDER_TYPE,
    _context: context,
  };

  if (__DEV__) {
    context._currentRenderer = null;
    context._currentRenderer2 = null;
  }
  globalRegistry[globalName] = context;
  return context;
}

export function getOrCreateContextByName(name: string) {
  if (!globalRegistry[name]) {
    globalRegistry[name] = createServerContext(name, null);
  }
  return globalRegistry[name];
}
