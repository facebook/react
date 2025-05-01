/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {REACT_SERVER_CONTEXT_TYPE, REACT_PROVIDER_TYPE} from 'shared/ReactSymbols';
import type {ReactContext, ReactProviderType} from 'shared/ReactTypes';
import ReactSharedInternals from './ReactSharedInternalsServer';

/**
 * Creates a context object that works with React Server Components.
 * Uses AsyncLocalStorage to maintain context across async operations.
 */
export function createServerContext<T>(
  defaultValue: T,
  displayName?: string,
): ReactContext<T> {
  const contextId = Symbol('ServerContext');
  
  const context: ReactContext<T> = {
    $$typeof: REACT_SERVER_CONTEXT_TYPE,
    // Maintain compatibility with existing context API
    _currentValue: defaultValue,
    _currentValue2: defaultValue,
    _threadCount: 0,
    
    // Server context specific properties
    _serverContextId: contextId,
    _isServerContext: true,
    
    // Will be populated below
    Provider: (null: any),
    Consumer: (null: any),
  };

  // Create the Provider component
  const Provider: ReactProviderType<T> = {
    $$typeof: REACT_PROVIDER_TYPE,
    _context: context,
  };
  
  context.Provider = Provider;
  
  if (__DEV__) {
    context._debugName = displayName || 'ServerContext';
  }
  
  return context;
}

/**
 * Returns the current value of a server context within the AsyncLocalStorage.
 * Falls back to the default value if not found.
 */
export function useServerContext<T>(context: ReactContext<T>): T {
  if (!context._isServerContext) {
    throw new Error(
      'useServerContext: Expected a context created with createServerContext. ' +
      'Did you use React.createContext instead?'
    );
  }
  
  return ReactSharedInternals.getServerContextValue(context);
}

/**
 * Sets a server context value and runs a callback with that value.
 * Uses AsyncLocalStorage to ensure the context is available throughout
 * the asynchronous server component rendering process.
 */
export function setServerContext<T, R>(
  context: ReactContext<T>,
  value: T,
  callback: () => R,
): R {
  return ReactSharedInternals.setServerContextValue(context, value, callback);
}
