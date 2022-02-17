/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  REACT_PROVIDER_TYPE,
  REACT_SERVER_CONTEXT_TYPE,
} from 'shared/ReactSymbols';

import type {
  ReactServerContext,
  ServerContextJSONValue,
} from 'shared/ReactTypes';

import ReactSharedInternals from 'shared/ReactSharedInternals';

import {enableServerContext} from 'shared/ReactFeatureFlags';

const globalServerContextRegistry =
  ReactSharedInternals.globalServerContextRegistry;

const DEFAULT_PLACEHOLDER = globalServerContextRegistry.__defaultValue;

export function createServerContext<T: ServerContextJSONValue>(
  globalName: string,
  defaultValue: T,
): ReactServerContext<T> {
  if (!enableServerContext) {
    throw new Error('Not implemented.');
  }
  if (!globalServerContextRegistry[globalName]) {
    globalServerContextRegistry[globalName] = _createServerContext(
      globalName,
      defaultValue,
    );
  }
  const context = globalServerContextRegistry[globalName];
  if (!context._definitionLoaded) {
    context._definitionLoaded = true;
    context._defaultValue = defaultValue;
  } else {
    throw new Error(`ServerContext: ${globalName} already defined`);
  }
  return context;
}

function _createServerContext<T: ServerContextJSONValue>(
  globalName: string,
  defaultValue: T,
): ReactServerContext<T> {
  const context: ReactServerContext<T> = {
    $$typeof: REACT_SERVER_CONTEXT_TYPE,
    // As a workaround to support multiple concurrent renderers, we categorize
    // some renderers as primary and others as secondary. We only expect
    // there to be two concurrent renderers at most: React Native (primary) and
    // Fabric (secondary); React DOM (primary) and React ART (secondary).
    // Secondary renderers store their context values on separate fields.
    __currentValue: defaultValue,
    __currentValue2: defaultValue,

    get _currentValue() {
      const value = context.__currentValue;
      if (value === DEFAULT_PLACEHOLDER) {
        // If there is an entry in defaults then the definition was loaded
        // and we should use the default value in the definition.
        // Otherwise the definition hasn't loaded so `useServerContext` is not
        // being called, in this case we'll just return the DEFAULT_PLACEHOLDER
        if ('_defaultValue' in context) {
          return (context: any)._defaultValue;
        }
      }
      return value;
    },

    set _currentValue(value) {
      context.__currentValue = value;
    },

    get _currentValue2() {
      const value = context.__currentValue2;
      if (value === DEFAULT_PLACEHOLDER) {
        // If there is an entry in defaults then the definition was loaded
        // and we should use the default value in the definition.
        // Otherwise the definition hasn't loaded so `useServerContext` is not
        // being called, in this case we'll just return the DEFAULT_PLACEHOLDER
        if ('_defaultValue' in context) {
          return (context: any)._defaultValue;
        }
        return (undefined: any);
      }
      return value;
    },

    set _currentValue2(value) {
      context.__currentValue2 = value;
    },

    _defaultValue: (undefined: any),

    // Used to track how many concurrent renderers this context currently
    // supports within in a single renderer. Such as parallel server rendering.
    _threadCount: 0,
    _definitionLoaded: false,
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
  globalServerContextRegistry[globalName] = context;
  return context;
}

// This function is called by FlightClient to create a server context sent from
// the server. Its possible that FlightClient is creating it before the
// definition is loaded on the server. We'll create it with a null default value
// if thats the case and when the definition loads it will  set the correct
// default value.
export function getOrCreateServerContext(globalName: string, value: any) {
  if (!globalServerContextRegistry[globalName]) {
    globalServerContextRegistry[globalName] = _createServerContext(
      globalName,
      value === undefined ? DEFAULT_PLACEHOLDER : value,
    );
  }
  return globalServerContextRegistry[globalName];
}
