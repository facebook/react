/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import warningWithoutStack from 'shared/warningWithoutStack';

function noop() {}

const Empty = 0;
const Pending = 1;
const Resolved = 2;
const Rejected = 3;

type EmptyRecord<K> = {|
  status: 0,
  suspender: null,
  key: K,
  value: null,
  error: null,
  next: any, // TODO: (issue #12941)
  previous: any, // TODO: (issue #12941)
  /**
   * Proper types would be something like this:
   * next: Record<K, V> | null,
   * previous: Record<K, V> | null,
   */
|};

type PendingRecord<K, V> = {|
  status: 1,
  suspender: Promise<V>,
  key: K,
  value: null,
  error: null,
  next: any, // TODO: (issue #12941)
  previous: any, // TODO: (issue #12941)
  /**
   * Proper types would be something like this:
   * next: Record<K, V> | null,
   * previous: Record<K, V> | null,
   */
|};

type ResolvedRecord<K, V> = {|
  status: 2,
  suspender: null,
  key: K,
  value: V,
  error: null,
  next: any, // TODO: (issue #12941)
  previous: any, // TODO: (issue #12941)
  /**
   * Proper types would be something like this:
   * next: Record<K, V> | null,
   * previous: Record<K, V> | null,
   */
|};

type RejectedRecord<K> = {|
  status: 3,
  suspender: null,
  key: K,
  value: null,
  error: Error,
  next: any, // TODO: (issue #12941)
  previous: any, // TODO: (issue #12941)
  /**
   * Proper types would be something like this:
   * next: Record<K, V> | null,
   * previous: Record<K, V> | null,
   */
|};

type Record<K, V> =
  | EmptyRecord<K>
  | PendingRecord<K, V>
  | ResolvedRecord<K, V>
  | RejectedRecord<K>;

type RecordCache<K, V> = {|
  map: Map<K, Record<K, V>>,
  head: Record<K, V> | null,
  tail: Record<K, V> | null,
  size: number,
|};

// TODO: How do you express this type with Flow?
type ResourceMap = Map<any, RecordCache<any, any>>;
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

// TODO: Make this configurable per resource
const MAX_SIZE = 500;
const PAGE_SIZE = 50;

function createRecord<K>(key: K): EmptyRecord<K> {
  return {
    status: Empty,
    suspender: null,
    key,
    value: null,
    error: null,
    next: null,
    previous: null,
  };
}

function createRecordCache<K, V>(): RecordCache<K, V> {
  return {
    map: new Map(),
    head: null,
    tail: null,
    size: 0,
  };
}

export function createCache(invalidator: () => mixed): Cache {
  const resourceMap: ResourceMap = new Map();

  function accessRecord<K, V>(resourceType: any, key: K): Record<K, V> {
    if (__DEV__) {
      warningWithoutStack(
        typeof resourceType !== 'string' && typeof resourceType !== 'number',
        'Invalid resourceType: Expected a symbol, object, or function, but ' +
          'instead received: %s. Strings and numbers are not permitted as ' +
          'resource types.',
        resourceType,
      );
    }

    let recordCache = resourceMap.get(resourceType);
    if (recordCache === undefined) {
      recordCache = createRecordCache();
      resourceMap.set(resourceType, recordCache);
    }
    const map = recordCache.map;

    let record = map.get(key);
    if (record === undefined) {
      // This record does not already exist. Create a new one.
      record = createRecord(key);
      map.set(key, record);
      if (recordCache.size >= MAX_SIZE) {
        // The cache is already at maximum capacity. Remove PAGE_SIZE least
        // recently used records.
        // TODO: We assume the max capcity is greater than zero. Otherwise warn.
        const tail = recordCache.tail;
        if (tail !== null) {
          let newTail = tail;
          for (let i = 0; i < PAGE_SIZE && newTail !== null; i++) {
            recordCache.size -= 1;
            map.delete(newTail.key);
            newTail = newTail.previous;
          }
          recordCache.tail = newTail;
          if (newTail !== null) {
            newTail.next = null;
          }
        }
      }
    } else {
      // This record is already cached. Remove it from its current position in
      // the list. We'll add it to the front below.
      const previous = record.previous;
      const next = record.next;
      if (previous !== null) {
        previous.next = next;
      } else {
        recordCache.head = next;
      }
      if (next !== null) {
        next.previous = previous;
      } else {
        recordCache.tail = previous;
      }
      recordCache.size -= 1;
    }

    // Add the record to the front of the list.
    const head = recordCache.head;
    const newHead = record;
    recordCache.head = newHead;
    newHead.previous = null;
    newHead.next = head;
    if (head !== null) {
      head.previous = newHead;
    } else {
      recordCache.tail = newHead;
    }
    recordCache.size += 1;

    return newHead;
  }

  function load<K, V>(emptyRecord: EmptyRecord<K>, suspender: Promise<V>) {
    const pendingRecord: PendingRecord<K, V> = (emptyRecord: any);
    pendingRecord.status = Pending;
    pendingRecord.suspender = suspender;
    suspender.then(
      value => {
        // Resource loaded successfully.
        const resolvedRecord: ResolvedRecord<K, V> = (pendingRecord: any);
        resolvedRecord.status = Resolved;
        resolvedRecord.suspender = null;
        resolvedRecord.value = value;
      },
      error => {
        // Resource failed to load. Stash the error for later so we can throw it
        // the next time it's requested.
        const rejectedRecord: RejectedRecord<K> = (pendingRecord: any);
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
      const record: Record<K, V> = accessRecord(resourceType, key);
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
      const record: Record<K, V> = accessRecord(resourceType, key);
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
    warningWithoutStack(
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

type Resource<K, V> = {|
  read(Cache, K): V,
  preload(cache: Cache, key: K): void,
|};

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
  const resource = {
    read(cache, key) {
      if (__DEV__) {
        warningWithoutStack(
          isCache(cache),
          'read(): The first argument must be a cache. Instead received: %s',
          cache,
        );
      }
      if (hash === undefined) {
        if (__DEV__) {
          warnIfNonPrimitiveKey(key, 'read');
        }
        return cache.read(resource, key, loadResource, key);
      }
      const hashedKey = hash(key);
      return cache.read(resource, hashedKey, loadResource, key);
    },
    preload(cache, key) {
      if (__DEV__) {
        warningWithoutStack(
          isCache(cache),
          'preload(): The first argument must be a cache. Instead received: %s',
          cache,
        );
      }
      if (hash === undefined) {
        if (__DEV__) {
          warnIfNonPrimitiveKey(key, 'preload');
        }
        cache.preload(resource, key, loadResource, key);
        return;
      }
      const hashedKey = hash(key);
      cache.preload(resource, hashedKey, loadResource, key);
    },
  };
  return resource;
}

// Global cache has no eviction policy (except for, ya know, a browser refresh).
const globalCache = createCache(noop);
export const ReactCache = React.createContext(globalCache);
