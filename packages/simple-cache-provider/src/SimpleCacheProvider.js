/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React from 'react';
import {createLRU} from './LRU';

import warningWithoutStack from 'shared/warningWithoutStack';
import {scheduleWork} from 'react-scheduler';

type Thenable<T> = {
  then(resolve: (T) => mixed, reject: (mixed) => mixed): mixed,
};

type Suspender = {
  then(resolve: () => mixed, reject: () => mixed): mixed,
};

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

type PendingResult = {|
  status: 0,
  value: Suspender,
|};

type UnobservableResult<V> = {|
  status: 1,
  value: V,
|};

type ResolvedResult<V> = {|
  status: 2,
  value: V,
|};

type RejectedResult = {|
  status: 3,
  value: mixed,
|};

type Result<V> =
  | PendingResult
  | UnobservableResult<V>
  | ResolvedResult<V>
  | RejectedResult;

type Resource<I, V> = {
  read(I): V,
};

type LRU<AddEntry, T> = {
  add: AddEntry,
  update(entry: $Call<AddEntry, T>, newValue: T): void,
  access(entry: $Call<AddEntry, T>): T,
  purge(): void,
};

type MapByResource<T> = Map<any, Map<any, T>>;

type CacheImplementation = {
  purge(): void,
  set<I, V>(resource: any, input: I, value: V): void,
  invalidate<I>(resource: any, input: I): void,
  accessResult<I, K, V>(
    fetch: (I) => V,
    input: I,
    resource: any,
    key: K,
  ): Result<V>,
  commitChangeSet(changeSet: ChangeSet): void,
};

type ChangeSet = {
  results: MapByResource<Result<any>>,
  changedBits: number,
};

const Pending = 0;
const Unobservable = 1;
const Resolved = 2;
const Rejected = 3;

const never = {then() {}};

function identityHashFn(input) {
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
  return input;
}

function calculateBitForKey(key: string | number) {
  if (typeof key === 'string') {
    // Hash the first 6 characters. Consider that some ids share a
    // common prefix.
    let hashCode = 0;
    for (let i = 0; i < key.length && i < 6; i++) {
      hashCode = (hashCode << (5 - hashCode)) + (key.charCodeAt(i) | 0);
    }
    return 1 << hashCode % 31;
  } else {
    // Assume it's a number
    // TODO: Warn for keys that are neither numbers nor strings
    const absoluteValue = (key ^ (key >> 31)) - (key >> 31);
    return 1 << absoluteValue % 31;
  }
}

function calculateChangeSetBits(a: ChangeSet | null, b: ChangeSet): number {
  return b.changedBits;
}

function createCacheImplementation<AddEntry>(
  lru: LRU<AddEntry, any>,
  updateChangeSet: ((ChangeSet | null) => ChangeSet | null) => void,
) {
  // An LRU-managed map of results. When the result is evicted from the LRU, it
  // is also deleted from this map. An entry can be evicted whenever, but
  // mutations can only be applied in the commit phase.
  const entries: MapByResource<$Call<AddEntry, Result<any>>> = new Map();

  // A map of subscriptions. Each subscription belongs to an entry in the
  // `entries` map, although not every entry has a correspdonding subscription.
  // If an entry was found to be unreachable in the UI, its subscription is
  // disposed. The next time it is observed, a new subscription is created.
  const subscriptions: MapByResource<Subscription | Thenable<any>> = new Map();

  function scheduleChange(resource, key, result) {
    const changedBits = calculateBitForKey(key);

    updateChangeSet(baseChangeSet => {
      if (baseChangeSet === null) {
        const resultsForKey = new Map([[key, result]]);
        const results = new Map([[resource, resultsForKey]]);
        return {
          results,
          changedBits,
        };
      } else {
        const results = new Map(baseChangeSet.results);
        const resultsForKey = new Map(results.get(resource));
        results.set(resource, resultsForKey);
        resultsForKey.set(key, result);
        return {
          results,
          changedBits: changedBits | baseChangeSet.changedBits,
        };
      }
    });
  }

  function commitChangeSet(changeSet: ChangeSet) {
    const results = changeSet.results;

    // Apply the changes to the cache.
    results.forEach((resultsForResource, resource) => {
      const entriesForResource = entries.get(resource);
      resultsForResource.forEach((result, key) => {
        if (entriesForResource !== undefined) {
          const entry = entriesForResource.get(key);
          if (entry !== undefined) {
            // Update the entry and move it to the head of the LRU.
            lru.update(entry, result);
            lru.access(entry);
          } else {
            // Usually a result should already have a corresponding entry, but if it
            // does not, create a new one.
            addResultToCache(result, resource, key);
          }
        } else {
          addResultToCache(result, resource, key);
        }
      });
    });

    // The following code may throw (`unsubscribe` is a user-provided function),
    // in which case subsequent subscriptions may not be disposed. It's not so
    // bad, though, because we can clean them up during the next update.

    // If a subscription was updated, but it was not used during the render
    // phase then it must not have any consumers.
    // TODO: Wrap this in `scheduleWork`
    results.forEach((resultsForResource, resource) => {
      const subscriptionsForResource = subscriptions.get(resource);
      if (subscriptionsForResource !== undefined) {
        resultsForResource.forEach((result, key) => {
          if (result.status !== Resolved) {
            const subscription = subscriptionsForResource.get(key);
            if (subscription !== undefined) {
              // This subscription has no consumers. Unsubscribe.
              subscriptionsForResource.delete(key);
              if (subscriptionsForResource.size === 0) {
                subscriptions.delete(resource);
              }
              unsubscribe(subscription);
            }
          }
        });
      }
    });
  }

  function resumeAll(resumes) {
    for (let i = 0; i < resumes.length; i++) {
      const resume = resumes[i];
      resume();
    }
  }

  function ensureSubscription<I, K, V>(
    result: Result<V>,
    fetch: I => V,
    input: I,
    resource: any,
    key: K,
  ) {
    let subscriptionsForResource = subscriptions.get(resource);
    if (subscriptionsForResource === undefined) {
      subscriptionsForResource = new Map();
      subscriptions.set(resource, subscriptionsForResource);
    }
    const existingSubscription = subscriptionsForResource.get(key);
    if (existingSubscription !== undefined) {
      // There's already a matching subscription. Do not create a new one;
      // there cannot be more than one subscription per key.
      return;
    }

    let initialResult = result;
    const thenableOrObservable = fetch(input);

    // Check if the return value is a promise or an observable. Because
    // promises are more common, we'll assume it's a promise *unless* it's
    // an observable.
    let subscription;
    if (typeof thenableOrObservable.subscribe === 'function') {
      const observable: Observable<V> = (thenableOrObservable: any);

      let resumes = null;
      subscription = observable.subscribe({
        next(value: V) {
          if (
            initialResult !== null &&
            initialResult.status === Pending &&
            initialResult.status === Pending
          ) {
            // This is the initial value.
            const unobservableResult: UnobservableResult<
              V,
            > = (initialResult: any);
            initialResult = null;
            unobservableResult.status = Unobservable;
            unobservableResult.value = value;
            if (resumes !== null) {
              // Ping React to resume rendering.
              const r = resumes;
              resumes = null;
              resumeAll(r);
            }
          } else {
            // This is an update.
            const newResult: UnobservableResult<V> = {
              status: Unobservable,
              value,
            };
            scheduleChange(resource, key, newResult);
          }
        },
        error(error: mixed) {
          if (initialResult !== null && initialResult.status === Pending) {
            // This is the initial value.
            const rejectedResult: RejectedResult = (initialResult: any);
            initialResult = null;
            rejectedResult.status = Rejected;
            rejectedResult.value = error;
            if (resumes !== null) {
              // Ping React to resume rendering.
              const r = resumes;
              resumes = null;
              resumeAll(r);
            }
          } else {
            // This is an update.
            const newResult: RejectedResult = {
              status: Rejected,
              value: error,
            };
            scheduleChange(resource, key, newResult);
          }
        },
        complete() {
          initialResult = null;
        },
      });

      if (result.status === Pending) {
        // The result is still pending. Create a thenable that resolves on the
        // initial value. We'll throw this to tell React to suspend the render.
        const pendingResult: PendingResult = (result: any);
        const suspender = {
          then(resume) {
            if (result.status === Pending) {
              if (resumes === null) {
                resumes = [resume];
              } else {
                resumes.push(resume);
              }
            } else {
              resume();
            }
          },
        };
        pendingResult.value = suspender;
      }
    } else {
      // This is a thenable.
      const thenable: Thenable<V> = (thenableOrObservable: any);
      subscription = thenable;
      thenable.then(
        value => {
          if (initialResult !== null && initialResult.status === Pending) {
            // This is the initial value.
            const unobservableResult: UnobservableResult<
              V,
            > = (initialResult: any);
            initialResult = null;
            unobservableResult.status = Unobservable;
            unobservableResult.value = value;
          } else {
            // This is an update.
            const newResult: UnobservableResult<V> = {
              status: Unobservable,
              value,
            };
            scheduleChange(resource, key, newResult);
          }
        },
        error => {
          if (initialResult !== null && initialResult.status === Pending) {
            // This is the initial value.
            const rejectedResult: RejectedResult = (initialResult: any);
            initialResult = null;
            rejectedResult.status = Rejected;
            rejectedResult.value = error;
          } else {
            // This is an update.
            const newResult: RejectedResult = {
              status: Rejected,
              value: error,
            };
            scheduleChange(resource, key, newResult);
          }
        },
      );
      if (initialResult !== null && initialResult.status === Pending) {
        // The record is still pending. Stash the thenable on the result.
        // We'll throw this to tell React to suspend the render.
        const pendingResult: PendingResult = (initialResult: any);
        pendingResult.value = thenable;
      }
    }

    subscriptionsForResource.set(key, subscription);
  }

  function addResultToCache<K, V>(result: Result<V>, resource: any, key: K) {
    const entry = lru.add(
      result,
      deleteResultFromCache.bind(null, resource, key),
    );
    let entriesForResource = entries.get(resource);
    if (entriesForResource === undefined) {
      entriesForResource = new Map();
      entries.set(resource, entriesForResource);
    }
    entriesForResource.set(key, entry);
  }

  function deleteResultFromCache<K>(resource: any, key: K) {
    let entriesForResource = entries.get(resource);
    if (entriesForResource !== undefined) {
      entriesForResource.delete(key);
      if (entriesForResource.size === 0) {
        entries.delete(resource);
      }
    }
    let subscriptionsForResource = subscriptions.get(resource);
    if (subscriptionsForResource !== undefined) {
      const subscription = subscriptionsForResource.get(key);
      if (subscription !== undefined) {
        subscriptionsForResource.delete(key);
        if (subscriptionsForResource.size === 0) {
          subscriptions.delete(resource);
        }
        unsubscribe(subscription);
      }
    }
  }

  function unsubscribe<V>(subscription: Subscription | Thenable<V>) {
    if (typeof subscription.unsubscribe === 'function') {
      const sub: Subscription = (subscription: any);
      sub.unsubscribe();
    }
  }

  function accessResult<I, K, V>(
    fetch: I => V,
    input: I,
    resource: any,
    key: K,
  ) {
    // Before reading from the cache, first check if there's a pending change
    // for this key.
    const observedBits = calculateBitForKey(key);
    const changeSet = ChangeSetContext.unstable_read(observedBits);
    let result;
    if (changeSet !== null) {
      const resultsPerResource = changeSet.results.get(resource);
      if (resultsPerResource !== undefined) {
        result = resultsPerResource.get(key);
      }
    }
    if (result !== undefined) {
      // This key has pending change. If the cache already includes a matching
      // value, disregard it and use the pending value instead.
      const entriesForResource = entries.get(resource);
      if (entriesForResource !== undefined) {
        const entry = entriesForResource.get(key);
        if (entry !== undefined) {
          // Found a matching entry. Move to the head of the LRU, but don't use
          // the cached value.
          lru.access(entry);
        } else {
          // No matching entry was found. It's ok to add it to the cache
          // immediately instead of waiting for the change to commit.
          addResultToCache(result, resource, key);
        }
      } else {
        addResultToCache(result, resource, key);
      }
    } else {
      // This key does not have a pending change. Check the cache.
      const entriesForResource = entries.get(resource);
      if (entriesForResource !== undefined) {
        const entry = entriesForResource.get(key);
        if (entry !== undefined) {
          // Found a matching entry.
          result = lru.access(entry);
        } else {
          // No matching entry was found. Add it to the cache.
          const pendingResult: PendingResult = (result = {
            status: Pending,
            value: never,
          });
          addResultToCache(pendingResult, resource, key);
        }
      } else {
        const pendingResult: PendingResult = (result = {
          status: Pending,
          value: never,
        });
        addResultToCache(pendingResult, resource, key);
      }
    }

    // Ensure the result has a matching subscription
    ensureSubscription(result, fetch, input, resource, key);

    return result;
  }

  function purge() {
    return lru.purge();
  }

  function set<I, V>(resource: any, input: I, value: V) {
    const key = resource._hashInput(input);
    const newResult: UnobservableResult<V> = {
      status: Unobservable,
      value,
    };
    scheduleChange(resource, key, newResult);
  }

  function invalidate(resource: any, input: I) {
    const key = resource._hashInput(input);

    const pendingResult: PendingResult = {
      status: Pending,
      value: never,
    };

    // Dispose of the existing subscription.
    let subscriptionsForResource = subscriptions.get(resource);
    if (subscriptionsForResource !== undefined) {
      const subscription = subscriptionsForResource.get(key);
      if (subscription !== undefined) {
        subscriptionsForResource.delete(key);
        if (subscriptionsForResource.size === 0) {
          subscriptions.delete(resource);
        }
        unsubscribe(subscription);
      }
    }

    scheduleChange(resource, key, pendingResult);
  }

  return {
    purge,
    set,
    invalidate,
    accessResult,
    commitChangeSet,
  };
}

// The initial change set is empty.
let globalChangeSet = null;
const ChangeSetContext = React.createContext(
  globalChangeSet,
  calculateChangeSetBits,
);

function updateGlobalChangeSet(updateFn) {
  const newChangeSet = updateFn(globalChangeSet);
  globalChangeSet = newChangeSet;
  if (newChangeSet !== null) {
    ChangeSetContext.unstable_set(globalChangeSet, () => {
      globalCache._implementation.commitChangeSet(newChangeSet);
    });
  }
}

function ReactDataCache(lru, updateChangeSet) {
  this._implementation = createCacheImplementation(lru, updateChangeSet);
}
ReactDataCache.prototype.purge = function() {
  this._implementation.purge();
};
ReactDataCache.prototype.set = function(resource, input, value) {
  this._implementation.set(resource, input, value);
};
ReactDataCache.prototype.invalidate = function(resource, input) {
  this._implementation.invalidate(resource, input);
};

const DEFAULT_LIMIT = 256;
const globalLRU = createLRU(DEFAULT_LIMIT);
export const globalCache = new ReactDataCache(globalLRU, updateGlobalChangeSet);

const CacheContext = React.createContext(globalCache);

// TODO: This is not part of the public API. Only exists for testing. Move to a
// separate file.
export class CacheProvider extends React.Component {
  state = {
    cache: null,
    changeSet: null,
  };
  componentDidMount() {
    const lru = createLRU(DEFAULT_LIMIT);
    const cache = new ReactDataCache(lru, this.updateChangeSet);
    scheduleWork(() => this.setState({cache}));
  }
  updateChangeSet = updateFn => {
    this.setState(prevState => ({
      changeSet: updateFn(prevState.changeSet),
    }));
  };
  componentDidUpdate(prevProps, prevState) {
    const cache = this.state.cache;
    const prevCache = prevState.cache;
    const changeSet = this.state.changeSet;
    const prevChangeSet = prevState.changeSet;
    if (changeSet !== prevChangeSet || cache !== prevCache) {
      this.changeSetEffect(cache, changeSet);
    }
  }
  changeSetEffect(cache, changeSet) {
    if (cache !== null && changeSet !== null) {
      cache._implementation.commitChangeSet(changeSet);
    }
  }
  render() {
    const cache = this.state.cache;
    if (cache === null) {
      return null;
    }
    return (
      <CacheContext.Provider value={cache}>
        <ChangeSetContext.Provider value={this.state.changeSet}>
          {this.props.children}
        </ChangeSetContext.Provider>
      </CacheContext.Provider>
    );
  }
}

export function createResource<I, K: string | number, V>(
  fetch: I => Thenable<V> | Observable<V>,
  maybeHashInput?: I => K,
): Resource<I, V> {
  const hashInput: I => K =
    maybeHashInput !== undefined ? maybeHashInput : (identityHashFn: any);

  const resource = {
    read(input: I): V {
      const key = hashInput(input);
      const cache = CacheContext.unstable_read();
      const impl = cache._implementation;
      const result: Result<V> = impl.accessResult(fetch, input, resource, key);
      switch (result.status) {
        case Pending: {
          const suspender = result.value;
          throw suspender;
        }
        case Unobservable: {
          const resolvedResult: ResolvedResult<V> = (result: any);
          resolvedResult.status = Resolved;
          const value = resolvedResult.value;
          return value;
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
      const key = hashInput(input);
      const cache = CacheContext.unstable_read();
      const impl = cache._implementation;
      impl.accessResult(fetch, input, resource, key);
    },

    _hashInput: hashInput,
  };
  return resource;
}

export function useCache() {
  return CacheContext.unstable_read();
}

export function setGlobalCacheLimit(limit: number) {
  globalLRU.setLimit(limit);
}
