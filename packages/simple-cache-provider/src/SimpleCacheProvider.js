/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import invariant from 'fbjs/lib/invariant';

function noop() {}
function identity<T>(t: T): T {
  return t;
}

type Status = 0 | 1 | 2;

const Empty = 0;
const Resolved = 1;
const Rejected = 2;

type Record<V> = {|
  status: Status,
  suspender: Promise<V> | null,
  value: V | null,
  error: Error | null,
|};

type RecordCache<K, V> = Map<K, Record<V>>;
// TODO: How do you express this type with Flow?
type ResourceCache = Map<any, RecordCache<any, any>>;
type Cache = {|
  $$typeof: Symbol | number,
  invalidate(): void,
  read<K, V>(resourceType: mixed, key: K, miss: (K) => Promise<V>): V,
  preload<K, V>(resourceType: mixed, key: K, miss: (K) => Promise<V>): void,
|};

const hasSymbol = typeof Symbol === 'function' && Symbol.for;
const CACHE_TYPE = hasSymbol ? Symbol('simple-cache-provider.cache') : 0xcac4e;

function isCache(value) {
  return (
    // $FlowFixMe - Flow doesn't like that I'm accessing
    value !== null && typeof value === 'object' && value.$$typeof === CACHE_TYPE
  );
}

export function createCache(invalidator: () => mixed): Cache {
  const resourceCache: ResourceCache = new Map();

  function getRecord<K, V>(resourceType: any, key: K): Record<V> {
    const typeofResourceType = typeof resourceType;
    invariant(
      typeofResourceType !== 'string' && typeofResourceType !== 'number',
      'Invalid resourceType: Expected a symbol, object, or function, but ' +
        'instead received: %s. Strings and numbers are not permitted as ' +
        'resource types.',
      resourceType,
    );

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

  function load<K, V>(record: Record<V>, key: K, miss: K => Promise<V>) {
    const suspender = miss(key);
    record.suspender = suspender;
    suspender.then(
      value => {
        // Resource loaded successfully.
        record.suspender = null;
        record.status = Resolved;
        record.value = value;
      },
      error => {
        // Resource failed to load. Stash the error for later so we can throw it
        // the next time it's requested.
        record.suspender = null;
        record.status = Rejected;
        record.error = error;
      },
    );
    return suspender;
  }

  return {
    $$typeof: CACHE_TYPE,
    invalidate() {
      invalidator();
    },
    preload<K, V>(resourceType: any, key: K, miss: K => Promise<V>): void {
      const record: Record<V> = getRecord(resourceType, key);
      const suspender = record.suspender;
      if (suspender !== null) {
        // There's already a pending request.
        return;
      }
      switch (record.status) {
        case Empty:
          // Warm the cache.
          load(record, key, miss);
          return;
        case Resolved:
        case Rejected:
          // The resource is already in the cache.
          return;
      }
    },
    read<K, V>(resourceType: any, key: K, miss: K => Promise<V>): V {
      const record: Record<V> = getRecord(resourceType, key);
      const suspender = record.suspender;
      if (suspender !== null) {
        // There's already a pending request.
        throw suspender;
      }
      switch (record.status) {
        case Empty:
          // Load the requested resource.
          throw load(record, key, miss);
        case Resolved:
          return ((record.value: any): V);
        case Rejected:
        default:
          // The requested resource previously failed loading.
          // TODO: When should we try again?
          throw record.error;
      }
    },
  };
}

type ResourceReader<K, V> = (Cache, K) => V;

type Resource<K, V> = ResourceReader<K, V> & {
  preload(cache: Cache, key: K): void,
};

export function createResource<K, V, H>(
  loadResource: K => Promise<V>,
  // $FlowFixMe: Flow complains that K !== H.
  hash?: K => H = identity,
): Resource<K, V> {
  // The read function itself serves as the resource type.
  function read(cache, key) {
    invariant(
      isCache(cache),
      'read(): The first argument must be a cache. Instead received: %s',
      cache,
    );
    const hashedKey = hash(key);
    return cache.read(read, hashedKey, h => loadResource(key));
  }
  read.preload = function(cache, key) {
    invariant(
      isCache(cache),
      'preload(): The first argument must be a cache. Instead received: %s',
      cache,
    );
    const hashedKey = hash(key);
    cache.preload(read, hashedKey, h => loadResource(key));
  };
  return read;
}

// Global cache has no eviction policy (except for, ya know, a browser refresh).
const globalCache = createCache(noop);
export const SimpleCache = React.createContext(globalCache);
