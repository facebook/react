/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import warning from 'fbjs/lib/warning';

function noop() {}

const Empty = 0;
const Pending = 1;
const Resolved = 2;
const Rejected = 3;

type EmptyRecord = {|
  status: 0,
  suspender: null,
  value: null,
  error: null,
|};

type PendingRecord<V> = {|
  status: 1,
  suspender: Promise<V>,
  value: null,
  error: null,
|};

type ResolvedRecord<V> = {|
  status: 2,
  suspender: null,
  value: V,
  error: null,
|};

type RejectedRecord = {|
  status: 3,
  suspender: null,
  value: null,
  error: Error,
|};

type Record<V> =
  | EmptyRecord
  | PendingRecord<V>
  | ResolvedRecord<V>
  | RejectedRecord;

type RecordCache<K, V> = Map<K, Record<V>>;
// TODO: How do you express this type with Flow?
type ResourceCache = Map<any, RecordCache<any, any>>;
type Cache = {
  invalidate(): void,
  read<K, V, A>(
    resourceType: mixed,
    key: K,
    miss: (A) => Promise<V>,
    missArg: A,
  ): V,
  preload<K, V, A>(
    resourceType: mixed,
    key: K,
    miss: (A) => Promise<V>,
    missArg: A,
  ): void,

  // DEV-only
  $$typeof?: Symbol | number,
};

let CACHE_TYPE;
if (__DEV__) {
  CACHE_TYPE = 0xcac4e;
}

let isCache;
if (__DEV__) {
  isCache = value =>
    value !== null &&
    typeof value === 'object' &&
    value.$$typeof === CACHE_TYPE;
}

export function createCache(invalidator: () => mixed): Cache {
  const resourceCache: ResourceCache = new Map();

  function getRecord<K, V>(resourceType: any, key: K): Record<V> {
    if (__DEV__) {
      warning(
        typeof resourceType !== 'string' && typeof resourceType !== 'number',
        'Invalid resourceType: Expected a symbol, object, or function, but ' +
          'instead received: %s. Strings and numbers are not permitted as ' +
          'resource types.',
        resourceType,
      );
    }

    let recordCache = resourceCache.get(resourceType);
    if (recordCache !== undefined) {
      const record = recordCache.get(key);
      if (record !== undefined) {
        return record;
      }
    } else {
      recordCache = new Map();
      resourceCache.set(resourceType, recordCache);
    }

    const record = {
      status: Empty,
      suspender: null,
      value: null,
      error: null,
    };
    recordCache.set(key, record);
    return record;
  }

  function load<V>(emptyRecord: EmptyRecord, suspender: Promise<V>) {
    const pendingRecord: PendingRecord<V> = (emptyRecord: any);
    pendingRecord.status = Pending;
    pendingRecord.suspender = suspender;
    suspender.then(
      value => {
        // Resource loaded successfully.
        const resolvedRecord: ResolvedRecord<V> = (pendingRecord: any);
        resolvedRecord.status = Resolved;
        resolvedRecord.suspender = null;
        resolvedRecord.value = value;
      },
      error => {
        // Resource failed to load. Stash the error for later so we can throw it
        // the next time it's requested.
        const rejectedRecord: RejectedRecord = (pendingRecord: any);
        rejectedRecord.status = Rejected;
        rejectedRecord.suspender = null;
        rejectedRecord.error = error;
      },
    );
  }

  const cache: Cache = {
    invalidate() {
      invalidator();
    },
    preload<K, V, A>(
      resourceType: any,
      key: K,
      miss: A => Promise<V>,
      missArg: A,
    ): void {
      const record: Record<V> = getRecord(resourceType, key);
      switch (record.status) {
        case Empty:
          // Warm the cache.
          const suspender = miss(missArg);
          load(record, suspender);
          return;
        case Pending:
          // There's already a pending request.
          return;
        case Resolved:
          // The resource is already in the cache.
          return;
        case Rejected:
          // The request failed.
          return;
      }
    },
    read<K, V, A>(
      resourceType: any,
      key: K,
      miss: A => Promise<V>,
      missArg: A,
    ): V {
      const record: Record<V> = getRecord(resourceType, key);
      switch (record.status) {
        case Empty:
          // Load the requested resource.
          const suspender = miss(missArg);
          load(record, suspender);
          throw suspender;
        case Pending:
          // There's already a pending request.
          throw record.suspender;
        case Resolved:
          return record.value;
        case Rejected:
        default:
          // The requested resource previously failed loading.
          const error = record.error;
          throw error;
      }
    },
  };

  if (__DEV__) {
    cache.$$typeof = CACHE_TYPE;
  }
  return cache;
}

let warnIfNonPrimitiveKey;
if (__DEV__) {
  warnIfNonPrimitiveKey = (key, methodName) => {
    warning(
      typeof key === 'string' ||
        typeof key === 'number' ||
        typeof key === 'boolean' ||
        key === undefined ||
        key === null,
      '%s: Invalid key type. Expected a string, number, symbol, or boolean, ' +
        'but instead received: %s' +
        '\n\nTo use non-primitive values as keys, you must pass a hash ' +
        'function as the second argument to createResource().',
      methodName,
      key,
    );
  };
}

type primitive = string | number | boolean | void | null;
type ResourceReader<K, V> = (Cache, K) => V;

type Resource<K, V> = ResourceReader<K, V> & {
  preload(cache: Cache, key: K): void,
};

// These declarations are used to express function overloading. I wish there
// were a more elegant way to do this in the function definition itself.

// Primitive keys do not request a hash function.
declare function createResource<V, K: primitive, H: primitive>(
  loadResource: (K) => Promise<V>,
  hash?: (K) => H,
): Resource<K, V>;

// Non-primitive keys *do* require a hash function.
// eslint-disable-next-line no-redeclare
declare function createResource<V, K: mixed, H: primitive>(
  loadResource: (K) => Promise<V>,
  hash: (K) => H,
): Resource<K, V>;

// eslint-disable-next-line no-redeclare
export function createResource<V, K, H: primitive>(
  loadResource: K => Promise<V>,
  hash: K => H,
): Resource<K, V> {
  // The read function itself serves as the resource type.
  function read(cache, key) {
    if (__DEV__) {
      warning(
        isCache(cache),
        'read(): The first argument must be a cache. Instead received: %s',
        cache,
      );
    }
    if (hash === undefined) {
      if (__DEV__) {
        warnIfNonPrimitiveKey(key, 'read');
      }
      return cache.read(read, key, loadResource, key);
    }
    const hashedKey = hash(key);
    return cache.read(read, hashedKey, loadResource, key);
  }
  read.preload = function(cache, key) {
    if (__DEV__) {
      warning(
        isCache(cache),
        'preload(): The first argument must be a cache. Instead received: %s',
        cache,
      );
    }
    if (hash === undefined) {
      if (__DEV__) {
        warnIfNonPrimitiveKey(key, 'preload');
      }
      cache.preload(read, key, loadResource, key);
      return;
    }
    const hashedKey = hash(key);
    cache.preload(read, hashedKey, loadResource, key);
  };
  return read;
}

// Global cache has no eviction policy (except for, ya know, a browser refresh).
const globalCache = createCache(noop);
export const SimpleCache = React.createContext(globalCache);
