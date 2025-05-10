/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {AsyncLocalStorage} from 'async_hooks';
import type {ReactContext} from 'shared/ReactTypes';

// Create a dedicated AsyncLocalStorage for server contexts
export const SERVER_CONTEXT_STORAGE = new AsyncLocalStorage();

/**
 * Retrieves the current value of a server context from the registry.
 * Falls back to the default value if not found.
 */
export function getServerContextValue<T>(context: ReactContext<T>): T {
  // Get the current store from AsyncLocalStorage
  const store = SERVER_CONTEXT_STORAGE.getStore();
  if (!store || !store.has(context._serverContextId)) {
    // No value in the store, use the default value
    return context._currentValue;
  }
  
  // Return the value from the store
  return store.get(context._serverContextId);
}

/**
 * Sets a server context value and runs a callback with that value.
 * Uses AsyncLocalStorage to ensure the context is available throughout
 * the asynchronous server component rendering process.
 */
export function setServerContextValue<T, R>(
  context: ReactContext<T>,
  value: T,
  callback: () => R,
): R {
  if (!context._isServerContext) {
    // Not a server context, use the normal context behavior
    const prevValue = context._currentValue;
    context._currentValue = value;
    try {
      return callback();
    } finally {
      context._currentValue = prevValue;
    }
  }
  
  // Get the existing store or create a new one
  const prevStore = SERVER_CONTEXT_STORAGE.getStore() || new Map();
  const nextStore = new Map(prevStore);
  
  // Set the new value in the store
  nextStore.set(context._serverContextId, value);
  
  // Run the callback with the new context value in the store
  return SERVER_CONTEXT_STORAGE.run(nextStore, callback);
}
