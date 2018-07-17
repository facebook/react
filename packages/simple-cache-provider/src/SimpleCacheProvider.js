/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';

import invariant from 'shared/invariant';
import warningWithoutStack from 'shared/warningWithoutStack';

const Empty = 0;
const Pending = 1;
const Resolved = 2;
const Rejected = 3;

type Subscription = {
  unsubscribe(): mixed,
};

type Observer<T> = {
  next(value: T): mixed,
  error(error: mixed): mixed,
  complete(): mixed,
};

type Observable<T> = {
  subscribe(observer: Observer<T>): Subscription,
};

type EmptyRecord<I> = {|
  status: 0,
  input: I,
  value: null,
|};

type PendingRecord<I, V> = {|
  status: 1,
  input: I,
  value: Promise<V>,
|};

type ResolvedRecord<I, V> = {|
  status: 2,
  input: I,
  value: V,
|};

type RejectedRecord<I> = {|
  status: 3,
  input: I,
  value: mixed,
|};

type NonEmptyRecord<I, V> =
  | PendingRecord<I, V>
  | ResolvedRecord<I, V>
  | RejectedRecord<I>;

type Record<I, V> =
  | EmptyRecord<I>
  | PendingRecord<I, V>
  | ResolvedRecord<I, V>
  | RejectedRecord<I>;

type EmptySubscriptionRecord = {|
  status: 0,
  value: null,
  needsUpdate: boolean,
  subscription: Subscription | null,
  cache: Cache | null,
|};

type PendingSubscriptionRecord<V> = {|
  status: 1,
  value: Promise<V>,
  needsUpdate: boolean,
  subscription: Subscription | null,
  cache: Cache | null,
|};

type ResolvedSubscriptionRecord<V> = {|
  status: 2,
  value: V,
  needsUpdate: boolean,
  subscription: Subscription | null,
  cache: Cache | null,
|};

type RejectedSubscriptionRecord = {|
  status: 3,
  value: mixed,
  needsUpdate: boolean,
  subscription: Subscription | null,
  cache: Cache | null,
|};

type NonEmptySubscriptionRecord<V> =
  | PendingSubscriptionRecord<V>
  | ResolvedSubscriptionRecord<V>
  | RejectedSubscriptionRecord;

type SubscriptionRecord<V> =
  | EmptySubscriptionRecord
  | PendingSubscriptionRecord<V>
  | ResolvedSubscriptionRecord<V>
  | RejectedSubscriptionRecord;

const PromiseResourceTag = 0;
const ObservableResourceTag = 1;

type PromiseResource<I, K, V> = {
  // TODO: Get rid of `tag` once we can move to a separate context type
  // per resource
  tag: 0,
  read(I): V,
  preload(I): void,

  _preloadSnapshot(snapshot: Snapshot, input: I): void,
  _loadResource(I): Promise<V>,
  _hashInput?: I => K,
};

type ObservableResource<I, K, V> = {
  tag: 1,
  read(I): V,
  preload(I): void,

  _preloadSnapshot(snapshot: Snapshot, input: I): void,
  _loadResource(I): Observable<V>,
  _hashInput?: I => K,
};

type Resource<I, K, V> = PromiseResource<I, K, V> | ObservableResource<I, K, V>;

// TODO: How do you express this type with Flow?
type ResourceMap<T> = Map<Resource<any, any, any>, Map<any, T>>;

type Snapshot = {|
  resources: ResourceMap<Record<any, any>>,
  previousSnapshot: Snapshot | null,
|};

type Cache = {|
  preload<I, K, V>(resource: Resource<I, K, V>, input: I): void,
  refresh<I, K, V>(resource: Resource<I, K, V>, input: I): void,
  purge<I, K, V>(resource: Resource<I, K, V>): void,

  _subscriptionsMap: ResourceMap<SubscriptionRecord<any>>,
  _pendingChildSubscriptionsMap: ResourceMap<SubscriptionRecord<any>>,
|};

function createSnapshot(previousSnapshot: Snapshot | null): Snapshot {
  return {
    resources: new Map(),
    previousSnapshot,
  };
}

function ensureSubscription<I, K, V>(
  cache: Cache,
  subscriptionsMap: ResourceMap<SubscriptionRecord<any>>,
  resource: ObservableResource<I, K, V>,
  input: I,
  key: K,
  loadObservableResource: I => Observable<V>,
): NonEmptySubscriptionRecord<V> {
  // First check to see if a matching subscription already exists.
  let subscriptionRecords = subscriptionsMap.get(resource);
  if (subscriptionRecords === undefined) {
    subscriptionRecords = new Map();
    subscriptionsMap.set(resource, subscriptionRecords);
  }
  const alreadyExistingSubscriptionRecord = subscriptionRecords.get(key);
  if (
    alreadyExistingSubscriptionRecord &&
    alreadyExistingSubscriptionRecord.status !== Empty
  ) {
    // A matching subscription already exists. Reuse it.
    return alreadyExistingSubscriptionRecord;
  }

  // Create a new subscription.
  const subscriptionRecord: EmptySubscriptionRecord = {
    status: 0,
    value: null,
    needsUpdate: false,
    subscription: null,
    cache: null,
  };

  const observable = loadObservableResource(input);
  const promise = new Promise((resolve, reject) => {
    const subscription = observable.subscribe({
      next(value: V) {
        switch (subscriptionRecord.status) {
          case Empty:
          case Pending: {
            // TODO: Wrap in scheduleWork/requestIdleCallback
            resolve(value);
            break;
          }
          case Rejected:
          case Resolved: {
            const mountedCache = subscriptionRecord.cache;
            if (mountedCache === null) {
              // This subscription hasn't mounted yet. Once it does, we need
              // to schedule a re-render to display the latest value. Mark the
              // subscription as dirty.
              subscriptionRecord.needsUpdate = true;
            } else {
              // Schedule the cache to re-render.
              // TODO: Wrap in scheduleWork/requestIdleCallback
              mountedCache.refresh(resource, input);
            }
            break;
          }
        }
        const resolvedRecord: ResolvedSubscriptionRecord<
          V,
        > = (subscriptionRecord: any);
        resolvedRecord.status = Resolved;
        resolvedRecord.value = value;
      },
      error(error: mixed) {
        switch (subscriptionRecord.status) {
          case Empty:
          case Pending: {
            // TODO: Wrap in scheduleWork/requestIdleCallback
            reject(error);
            break;
          }
          case Rejected:
          case Resolved: {
            const mountedCache = subscriptionRecord.cache;
            if (cache === null) {
              // This subscription hasn't mounted yet. Once it does, we need
              // to schedule a re-render to display the latest value. Mark the
              // subscription as dirty.
              subscriptionRecord.needsUpdate = true;
            } else {
              // Schedule the cache to re-render.
              // TODO: Wrap in scheduleWork/requestIdleCallback
              mountedCache.refresh(resource, input);
            }
            break;
          }
        }
        const rejectedRecord: RejectedSubscriptionRecord = (subscriptionRecord: any);
        rejectedRecord.status = Rejected;
        rejectedRecord.value = error;
      },
      complete() {
        // If a subscription never produces a value, its promise
        // should never resolve.
        const sub = subscriptionRecord.subscription;
        if (sub !== null) {
          subscriptionRecord.subscription = null;
          sub.unsubscribe();
        }
      },
    });

    subscriptionRecord.subscription = subscription;
  });

  if (subscriptionRecord.status === Empty) {
    // Set the subscription to "pending" until the first value is received.
    const pendingSubscriptionRecord: PendingSubscriptionRecord<
      V,
    > = (subscriptionRecord: any);
    pendingSubscriptionRecord.status = Pending;
    pendingSubscriptionRecord.value = promise;

    // Add it to the map.
    subscriptionRecords.set(key, pendingSubscriptionRecord);
    return pendingSubscriptionRecord;
  } else {
    // The subscription produced a value synchronously. We can skip the
    // "pending" phase

    // Add it to the map.
    subscriptionRecords.set(key, subscriptionRecord);
    return subscriptionRecord;
  }
}

function disposeSubscriptionRecord<V>(
  subscriptionRecord: SubscriptionRecord<V>,
): void {
  const disposedSubscriptionRecord: EmptySubscriptionRecord = (subscriptionRecord: any);
  disposedSubscriptionRecord.cache = null;
  const subscription = disposedSubscriptionRecord.subscription;
  subscriptionRecord.subscription = null;
  if (subscription !== null) {
    subscription.unsubscribe();
  }
}

function setInResourceMap<T, I, K, V>(
  resourceMap: ResourceMap<T>,
  resource: Resource<I, K, V>,
  key: K,
  item: T,
): void {
  let items = resourceMap.get(resource);
  if (items === undefined) {
    items = new Map();
    resourceMap.set(resource, items);
  }
  items.set(key, item);
}

function getFromResourceMap<T, I, K, V>(
  resourceMap: ResourceMap<T>,
  resource: Resource<I, K, V>,
  key: K,
): T | void {
  const items = resourceMap.get(resource);
  return items !== undefined ? items.get(key) : undefined;
}

function hashInput<I, K, V>(resource: Resource<I, K, V>, input: I): K {
  let hash = resource._hashInput;
  if (hash === undefined) {
    if (__DEV__) {
      warningWithoutStack(
        typeof input === 'string' ||
          typeof input === 'number' ||
          typeof input === 'boolean' ||
          input === undefined ||
          input === null,
        'Invalid key type. Expected a string, number, symbol, or boolean, ' +
          'but instead received: %s' +
          '\n\nTo use non-primitive values as keys, you must pass a hash ' +
          'function as the second argument to createResource().',
        input,
      );
    }
    return (input: any);
  } else {
    return hash(input);
  }
}

function resolvePromiseRecord<I, K, V>(
  resource: PromiseResource<I, K, V>,
  record: EmptyRecord<I>,
  input: I,
): NonEmptyRecord<I, V> {
  const promiseResource: PromiseResource<I, K, V> = (resource: any);
  const promise = promiseResource._loadResource(input);
  // TODO: Wrap in scheduleWork/requestIdleCallback
  promise.then(
    value => {
      const resolvedRecord: ResolvedRecord<I, V> = (record: any);
      resolvedRecord.status = Resolved;
      resolvedRecord.value = value;
    },
    error => {
      const rejectedRecord: RejectedRecord<I> = (record: any);
      rejectedRecord.status = Rejected;
      rejectedRecord.value = error;
    },
  );
  if (record.status === Empty) {
    // Set the record to "pending" until the promise resolves.
    const pendingRecord: PendingRecord<I, V> = (record: any);
    pendingRecord.status = Pending;
    pendingRecord.value = promise;
    return pendingRecord;
  } else {
    // The promise is actually a synchronous thenable. We can skip the
    // "pending" phase
    return record;
  }
}

function resolveObservableRecord<I, K, V>(
  cache: Cache,
  resource: ObservableResource<I, K, V>,
  record: Record<I, V>,
  input: I,
  key: K,
): NonEmptyRecord<I, V> {
  const observableResource: ObservableResource<I, K, V> = (resource: any);
  const loadObservableResource = observableResource._loadResource;
  const subscriptionRecord = ensureSubscription(
    cache,
    cache._subscriptionsMap,
    observableResource,
    input,
    key,
    loadObservableResource,
  );
  const nonEmptyRecord = (record: any);
  nonEmptyRecord.status = subscriptionRecord.status;
  nonEmptyRecord.value = subscriptionRecord.value;
  return (nonEmptyRecord: NonEmptyRecord<I, V>);
}

function readNonEmptyRecord<I, K, V>(
  resource: Resource<I, K, V>,
  record: NonEmptyRecord<I, V>,
): V {
  switch (record.status) {
    case Pending: {
      const pendingRecord: PendingRecord<I, V> = (record: any);
      throw pendingRecord.value;
    }
    case Resolved: {
      const resolvedRecord: ResolvedRecord<I, V> = (record: any);
      return resolvedRecord.value;
    }
    case Rejected: {
      const rejectedRecord: RejectedRecord<V> = (record: any);
      throw rejectedRecord.value;
    }
    default: {
      invariant(false, 'Record should not be empty.');
    }
  }
}

function accessRecord<I, K, V>(
  snapshot: Snapshot,
  resourceType: Resource<I, K, V>,
  input: I,
  key: K,
): Record<I, V> {
  const resources = snapshot.resources;

  let record;
  let records = resources.get(resourceType);
  if (records !== undefined) {
    record = records.get(key);
  } else {
    records = new Map();
    resources.set(resourceType, records);
  }

  if (record === undefined) {
    const previousSnapshot = snapshot.previousSnapshot;
    if (previousSnapshot !== null) {
      record = accessRecord(previousSnapshot, resourceType, input, key);
    } else {
      // Create a new record
      record = ({
        status: 0,
        input,
        value: null,
      }: EmptyRecord<I>);
    }
    records.set(key, record);
  }

  return record;
}

function snapshotHasNonEmptyRecord<I, K, V>(
  snapshot: Snapshot,
  resourceType: Resource<I, K, V>,
  key: K,
): boolean {
  const records = snapshot.resources.get(resourceType);
  if (records !== undefined) {
    const record = records.get(key);
    return record !== undefined && record.status !== Empty;
  }
  return false;
}

function refreshRecord<I, K, V>(
  snapshot: Snapshot,
  resourceType: Resource<I, K, V>,
  input: I,
  key: K,
): void {
  const resources = snapshot.resources;
  let records = resources.get(resourceType);
  if (records === undefined) {
    records = new Map();
    resources.set(resourceType, records);
  }
  // Create a new record
  const record: EmptyRecord<I> = {
    status: 0,
    input,
    value: null,
  };
  records.set(key, record);
}

// function preloadCache<I, K, V>(
//   cache: Cache,
//   resource: Resource<I, K, V>,
//   input: I,
// ): void {
//   const provider = cache._provider;
//   if (provider !== null) {
//     const key = hashInput(resource, input);
//     provider.preloadByKey(resource, key);
//   }
// }

export function createResource<I, K, V>(
  load: I => Promise<V>,
  hash?: I => K,
): PromiseResource<I, K, V> {
  const resource: PromiseResource<I, K, V> = {
    tag: PromiseResourceTag,

    read(input: I): V {
      const snapshot = SnapshotContext.unstable_read();
      const key = hashInput(resource, input);
      const record = accessRecord(snapshot, resource, input, key);
      if (record.status === Empty) {
        const nonEmptyRecord = resolvePromiseRecord(resource, record, input);
        return readNonEmptyRecord(resource, nonEmptyRecord);
      } else {
        return readNonEmptyRecord(resource, record);
      }
    },

    preload(input: I): void {
      const snapshot = SnapshotContext.unstable_read();
      resource._preloadSnapshot(snapshot, input);
    },

    // FIXME: The Provider component uses this method instead of `preload` in
    // order to pass the snapshot in as an argument instead of reading from
    // context. Reading from context only works for descendants of the Provider
    // — the Provider is not a descendant of itself. And we can't move this
    // method to the Provider because we don't know if the resource is an async
    // resource or an observable resource. But once React adds automatic
    // injection of root-level providers, we can switch to having a separate
    // context type per resource.
    _preloadSnapshot(snapshot: Snapshot, input: I): void {
      const key = hashInput(resource, input);
      const record = accessRecord(snapshot, resource, input, key);
      if (record.status === Empty) {
        resolvePromiseRecord(resource, record, input);
      }
    },

    _loadResource: load,
    _hashInput: hash,
  };
  return resource;
}

export function createObservableResource<I, K, V>(
  load: I => Observable<V>,
  hash?: I => K,
): ObservableResource<I, K, V> {
  const resource: ObservableResource<I, K, V> = {
    tag: ObservableResourceTag,

    read(input: I): V {
      const possiblyGlobalCache = CacheContext.unstable_read();
      invariant(
        possiblyGlobalCache !== globalCache,
        'An observable resource can only be read from inside a <Provider>.',
      );
      const cache: Cache = (possiblyGlobalCache: any);
      const snapshot = SnapshotContext.unstable_read();
      const key = hashInput(resource, input);
      const record = accessRecord(snapshot, resource, input, key);
      const nonEmptyRecord = resolveObservableRecord(
        cache,
        resource,
        record,
        input,
        key,
      );
      return readNonEmptyRecord(resource, nonEmptyRecord);
    },
    preload(input: I): void {
      const snapshot = SnapshotContext.unstable_read();
      resource._preloadSnapshot(snapshot, input);
    },

    // FIXME: (See corresponding comment in `createResource`)
    _preloadSnapshot(snapshot: Snapshot, input: I): void {
      const possiblyGlobalCache = CacheContext.unstable_read();
      if (possiblyGlobalCache === globalCache) {
        return;
      }
      const cache: Cache = (possiblyGlobalCache: any);
      const key = hashInput(resource, input);
      const record = accessRecord(snapshot, resource, input, key);
      resolveObservableRecord(cache, resource, record, input, key);
    },

    _loadResource: load,
    _hashInput: hash,
  };
  return resource;
}

const globalSnapshot: Snapshot = createSnapshot(null);
const globalCache: Cache = {
  preload<I, K, V>(resource: Resource<I, K, V>, input: I): void {},
  refresh<I, K, V>(resource: Resource<I, K, V>, input: I): void {},
  purge<I, K, V>(resource: Resource<I, K, V>): void {},

  _subscriptionsMap: new Map(),
  _pendingChildSubscriptionsMap: new Map(),
};

const CacheContext = React.createContext(globalCache);
const SnapshotContext = React.createContext(globalSnapshot);

type ProviderProps = {children?: React.Node};
type ProviderState = {snapshot: Snapshot};

export class Provider extends React.Component<ProviderProps, ProviderState> {
  state = {
    // During the initial mount, store values on the parent provider.
    snapshot: createSnapshot(SnapshotContext.unstable_read()),
  };

  cache: Cache = {
    preload: <I, K, V>(resource: Resource<I, K, V>, input: I): void => {
      this.setState(state => {
        resource._preloadSnapshot(state.snapshot, input);
        return null;
      });
    },

    refresh: <I, K, V>(resource: Resource<I, K, V>, input: I): void => {
      const key = hashInput(resource, input);
      // Create a new snapshot in the event handler, *not* in the updater.
      // function. The same snapshot must be reused across re-renders until the
      // update is complete, otherwise it'll keep restarting and never finish.
      const newSnapshot = createSnapshot(null);
      refreshRecord(newSnapshot, resource, input, key);
      this.setState(prevState => {
        newSnapshot.previousSnapshot = prevState.snapshot;
        return {snapshot: newSnapshot};
      });
    },

    purge: <I, K, V>(resource: Resource<I, K, V>): void => {
      const subscriptionsMap = this.cache._subscriptionsMap;
      if (subscriptionsMap !== null) {
        const subscriptionRecords = subscriptionsMap.get(resource);
        if (subscriptionRecords !== undefined) {
          subscriptionRecords.forEach(subscriptionRecord => {
            disposeSubscriptionRecord(subscriptionRecord);
          });
        }
      }
      // TODO: This clears the whole snapshot. Should only purge this resource.
      // Create a new snapshot in the event handler, *not* in the updater.
      // function. The same snapshot must be reused across re-renders until the
      // update is complete, otherwise it'll keep restarting and never finish.
      const newSnapshot = createSnapshot(null);
      this.setState(prevState => {
        newSnapshot.previousSnapshot = prevState.snapshot;
        return {snapshot: createSnapshot(null)};
      });
    },

    // During the initial mount, store subscriptions on the parent provider.
    _subscriptionsMap: CacheContext.unstable_read()
      ._pendingChildSubscriptionsMap,
    _pendingChildSubscriptionsMap: new Map(),
  };

  componentDidMount() {
    const finishedSnapshot = this.state.snapshot;
    const cache = this.cache;
    const subscriptionsMap = this.cache._subscriptionsMap;

    const newSubscriptionsMap: ResourceMap<SubscriptionRecord<any>> = new Map();

    // Ensure that every subscription has a matching record and dispose of the
    // ones that don't.
    subscriptionsMap.forEach(
      <I, K, V>(
        subscriptionRecords: Map<K, SubscriptionRecord<V>>,
        resource: Resource<I, K, V>,
      ) => {
        subscriptionRecords.forEach((subscriptionRecord, key) => {
          // Check if this subscription record is part of the latest snapshot
          const isInSnapshot = snapshotHasNonEmptyRecord(
            finishedSnapshot,
            resource,
            key,
          );
          if (isInSnapshot) {
            subscriptionRecord.cache = cache;
            setInResourceMap(
              newSubscriptionsMap,
              resource,
              key,
              subscriptionRecord,
            );
          } else {
            // Dispose of the subscription
            disposeSubscriptionRecord(subscriptionRecord);
          }
        });
      },
    );

    // Because on the initial mount we store subscriptions on the parent
    // provider, it's possible a sibling may have disposed of some of our
    // subscriptions. So we also need to iterate through the records and
    // ensure they have a matching subscription.
    finishedSnapshot.resources.forEach(
      <I, K, V>(records: Map<K, Record<I, V>>, resource: Resource<I, K, V>) => {
        if (resource.tag === ObservableResourceTag) {
          const observableResource: ObservableResource<
            I,
            K,
            V,
          > = (resource: any);
          records.forEach((record, key) => {
            ensureSubscription(
              this.cache,
              newSubscriptionsMap,
              observableResource,
              record.input,
              key,
              observableResource._loadResource,
            );
          });
        }
      },
    );

    this.cache._subscriptionsMap = newSubscriptionsMap;
  }

  componentDidUpdate(prevProps: ProviderProps, prevState: ProviderState) {
    const oldSnapshot = prevState.snapshot;
    const newSnapshot = this.state.snapshot;
    if (oldSnapshot === newSnapshot) {
      // No update.
      return;
    }

    // Iterate through the *old* snapshot's subscriptions. If it's not part of
    // the latest snapshot, dispose it.
    const subscriptionsMap = this.cache._subscriptionsMap;
    oldSnapshot.resources.forEach(
      <I, K, V>(
        oldRecords: Map<K, Record<I, V>>,
        resource: Resource<I, K, V>,
      ) => {
        if (resource.tag === ObservableResourceTag) {
          oldRecords.forEach((oldRecord, key) => {
            // Check if it's part of the *new* snapshot
            // TODO: This is where we would compare the changed bits
            const isInNewSnapshot = snapshotHasNonEmptyRecord(
              newSnapshot,
              resource,
              key,
            );
            if (!isInNewSnapshot) {
              // The subscription no longer has any matching consumers. We can
              // unmount it.
              const subscriptionRecord = getFromResourceMap(
                subscriptionsMap,
                resource,
                key,
              );
              if (subscriptionRecord !== undefined) {
                disposeSubscriptionRecord(subscriptionRecord);
              } else if (__DEV__) {
                warningWithoutStack(
                  false,
                  'Every mounted observable record must have a matching ' +
                    'subscription.',
                );
              }
            }
          });
        }
      },
    );
  }

  componentWillUnmount() {
    // Dispose mounted subscriptions.
    const subscriptionsMap = this.cache._subscriptionsMap;
    subscriptionsMap.forEach(
      <I, K, V>(
        subscriptionRecords: Map<K, SubscriptionRecord<V>>,
        resource: Resource<I, K, V>,
      ) => {
        subscriptionRecords.forEach((subscriptionRecord, key) => {
          // Check if this subscription record is part of the latest snapshot
          // Dispose of the subscription
          disposeSubscriptionRecord(subscriptionRecord);
        });
      },
    );

    // Dispose unmounted subscriptions.
    const pendingChildSubscriptionsMap = this.cache
      ._pendingChildSubscriptionsMap;
    if (pendingChildSubscriptionsMap !== null) {
      pendingChildSubscriptionsMap.forEach(
        <I, K, V>(
          subscriptionRecords: Map<K, SubscriptionRecord<V>>,
          resource: Resource<I, K, V>,
        ) => {
          subscriptionRecords.forEach((subscriptionRecord, key) => {
            // Check if this subscription record is part of the latest snapshot
            // Dispose of the subscription
            disposeSubscriptionRecord(subscriptionRecord);
          });
        },
      );
    }
  }

  render() {
    return (
      <SnapshotContext.Provider value={this.state.snapshot}>
        <CacheContext.Provider value={this.cache}>
          {this.props.children}
        </CacheContext.Provider>
      </SnapshotContext.Provider>
    );
  }
}

export function useCache() {
  const cache = CacheContext.unstable_read();
  if (__DEV__) {
    warningWithoutStack(
      cache !== globalCache,
      'useCache was called outside of a <Provider>. This will return the ' +
        'default cache, which does not support invalidation.',
    );
  }
  return cache;
}
