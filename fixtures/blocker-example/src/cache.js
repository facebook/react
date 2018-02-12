import React from 'react';

export function createNewCache(invalidator) {
  const cache = new Map();
  const pendingRequests = new Map();
  function load(key, miss) {
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key);
    }
    let promise = miss();
    pendingRequests.set(key, promise);
    promise
      .then(value => {
        cache.set(key, value);
      })
      .finally(() => {
        pendingRequests.delete(key);
      });
    // TODO: This will automatically refetch if it is read after an error state.
    // We might want to store the error state?
    return promise;
  }
  return {
    invalidate() {
      invalidator();
    },
    preload(key, miss) {
      if (cache.has(key)) {
        return cache.get(key);
      }
      load(key, miss);
    },
    read(key, miss) {
      if (cache.has(key)) {
        return cache.get(key);
      }
      throw load(key, miss);
    },
  };
}

// Global cache has no eviction policy, except for a hard refresh.
const globalCache = createNewCache(() => {});
export const SimpleCache = React.createContext(globalCache);

export function useCache(Component) {
  return props => (
    <SimpleCache.Consumer>
      {cache => <Component cache={cache} {...props} />}
    </SimpleCache.Consumer>
  );
}
