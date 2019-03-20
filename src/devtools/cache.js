// @flow

import React, { createContext } from 'react';

// Cache implementation was forked from the React repo:
// https://github.com/facebook/react/blob/master/packages/react-cache/src/ReactCache.js
//
// This cache is simpler than react-cache in that:
// 1. Individual items don't need to be invalidated.
//    Profiling data is invalidated as a whole.
// 2. We didn't need the added overhead of an LRU cache.
//    The size of this cache is bounded by how many renders were profiled,
//    and it will be fully reset between profiling sessions.

type Thenable<T> = {
  then(resolve: (T) => mixed, reject: (mixed) => mixed): mixed,
};

type Suspender = {
  then(resolve: () => mixed, reject: () => mixed): mixed,
};

type PendingResult = {|
  status: 0,
  value: Suspender,
|};

type ResolvedResult<V> = {|
  status: 1,
  value: V,
|};

type RejectedResult = {|
  status: 2,
  value: mixed,
|};

type Result<V> = PendingResult | ResolvedResult<V> | RejectedResult;

export type Resource<I, V> = {
  read(I): V,
  preload(I): void,
};

const Pending = 0;
const Resolved = 1;
const Rejected = 2;

const ReactCurrentDispatcher = (React: any)
  .__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher;

function readContext(Context, observedBits) {
  const dispatcher = ReactCurrentDispatcher.current;
  if (dispatcher === null) {
    throw new Error(
      'react-cache: read and preload may only be called from within a ' +
        "component's render. They are not supported in event handlers or " +
        'lifecycle methods.'
    );
  }
  return dispatcher.readContext(Context, observedBits);
}

function identityHashFn(input) {
  return input;
}

const CacheContext = createContext(null);

const entries: Map<Resource<any, any>, Map<any, any>> = new Map();

function accessResult<I, K, V>(
  resource: any,
  fetch: I => Thenable<V>,
  input: I,
  key: K
): Result<V> {
  let entriesForResource = entries.get(resource);
  if (entriesForResource === undefined) {
    entriesForResource = new Map();
    entries.set(resource, entriesForResource);
  }
  let entry = entriesForResource.get(key);
  if (entry === undefined) {
    const thenable = fetch(input);
    thenable.then(
      value => {
        if (newResult.status === Pending) {
          const resolvedResult: ResolvedResult<V> = (newResult: any);
          resolvedResult.status = Resolved;
          resolvedResult.value = value;
        }
      },
      error => {
        if (newResult.status === Pending) {
          const rejectedResult: RejectedResult = (newResult: any);
          rejectedResult.status = Rejected;
          rejectedResult.value = error;
        }
      }
    );
    const newResult: PendingResult = {
      status: Pending,
      value: thenable,
    };
    entriesForResource.set(key, newResult);
    return newResult;
  } else {
    return entry;
  }
}

export function createResource<I, K: string | number, V>(
  fetch: I => Thenable<V>,
  maybeHashInput?: I => K
): Resource<I, V> {
  const hashInput: I => K =
    maybeHashInput !== undefined ? maybeHashInput : (identityHashFn: any);

  const resource = {
    read(input: I): V {
      // Prevent access outside of render.
      // eslint-disable-next-line react-hooks/rules-of-hooks
      readContext(CacheContext);

      const key = hashInput(input);
      const result: Result<V> = accessResult(resource, fetch, input, key);
      switch (result.status) {
        case Pending: {
          const suspender = result.value;
          throw suspender;
        }
        case Resolved: {
          const value = result.value;
          return value;
        }
        case Rejected: {
          const error = result.value;
          throw error;
        }
        default:
          // Should be unreachable
          return (undefined: any);
      }
    },

    preload(input: I): void {
      // Prevent access outside of render.
      // eslint-disable-next-line react-hooks/rules-of-hooks
      readContext(CacheContext);

      const key = hashInput(input);
      accessResult(resource, fetch, input, key);
    },
  };
  return resource;
}

export function invalidateResources(): void {
  entries.clear();
}
