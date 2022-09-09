/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'shared/ReactTypes';

import * as React from 'react';
import {createContext} from 'react';

// TODO (cache) Remove this cache; it is outdated and will not work with newer APIs like startTransition.

// Cache implementation was forked from the React repo:
// https://github.com/facebook/react/blob/main/packages/react-cache/src/ReactCache.js
//
// This cache is simpler than react-cache in that:
// 1. Individual items don't need to be invalidated.
//    Profiling data is invalidated as a whole.
// 2. We didn't need the added overhead of an LRU cache.
//    The size of this cache is bounded by how many renders were profiled,
//    and it will be fully reset between profiling sessions.

export type {Thenable};

type Suspender = {then(resolve: () => mixed, reject: () => mixed): mixed, ...};

type PendingResult = {
  status: 0,
  value: Suspender,
};

type ResolvedResult<Value> = {
  status: 1,
  value: Value,
};

type RejectedResult = {
  status: 2,
  value: mixed,
};

type Result<Value> = PendingResult | ResolvedResult<Value> | RejectedResult;

export type Resource<Input, Key, Value> = {
  clear(): void,
  invalidate(Key): void,
  read(Input): Value,
  preload(Input): void,
  write(Key, Value): void,
  ...
};

const Pending = 0;
const Resolved = 1;
const Rejected = 2;

const ReactCurrentDispatcher = (React: any)
  .__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher;

function readContext(Context) {
  const dispatcher = ReactCurrentDispatcher.current;
  if (dispatcher === null) {
    throw new Error(
      'react-cache: read and preload may only be called from within a ' +
        "component's render. They are not supported in event handlers or " +
        'lifecycle methods.',
    );
  }
  return dispatcher.readContext(Context);
}

const CacheContext = createContext(null);

type Config = {useWeakMap?: boolean, ...};

const entries: Map<
  Resource<any, any, any>,
  Map<any, any> | WeakMap<any, any>,
> = new Map();
const resourceConfigs: Map<Resource<any, any, any>, Config> = new Map();

function getEntriesForResource(
  resource: any,
): Map<any, any> | WeakMap<any, any> {
  let entriesForResource = ((entries.get(resource): any): Map<any, any>);
  if (entriesForResource === undefined) {
    const config = resourceConfigs.get(resource);
    entriesForResource =
      config !== undefined && config.useWeakMap ? new WeakMap() : new Map();
    entries.set(resource, entriesForResource);
  }
  return entriesForResource;
}

function accessResult<Input, Key, Value>(
  resource: any,
  fetch: Input => Thenable<Value>,
  input: Input,
  key: Key,
): Result<Value> {
  const entriesForResource = getEntriesForResource(resource);
  const entry = entriesForResource.get(key);
  if (entry === undefined) {
    const thenable = fetch(input);
    thenable.then(
      value => {
        if (newResult.status === Pending) {
          const resolvedResult: ResolvedResult<Value> = (newResult: any);
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
      },
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

export function createResource<Input, Key, Value>(
  fetch: Input => Thenable<Value>,
  hashInput: Input => Key,
  config?: Config = {},
): Resource<Input, Key, Value> {
  const resource = {
    clear(): void {
      entries.delete(resource);
    },

    invalidate(key: Key): void {
      const entriesForResource = getEntriesForResource(resource);
      entriesForResource.delete(key);
    },

    read(input: Input): Value {
      // Prevent access outside of render.
      readContext(CacheContext);

      const key = hashInput(input);
      const result: Result<Value> = accessResult(resource, fetch, input, key);
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

    preload(input: Input): void {
      // Prevent access outside of render.
      readContext(CacheContext);

      const key = hashInput(input);
      accessResult(resource, fetch, input, key);
    },

    write(key: Key, value: Value): void {
      const entriesForResource = getEntriesForResource(resource);

      const resolvedResult: ResolvedResult<Value> = {
        status: Resolved,
        value,
      };

      entriesForResource.set(key, resolvedResult);
    },
  };

  resourceConfigs.set(resource, config);

  return resource;
}

export function invalidateResources(): void {
  entries.clear();
}
