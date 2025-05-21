/**
 * Copyright (c) Meta Platforms, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import ReactSharedInternals from 'shared/ReactSharedInternals';

const UNTERMINATED = 0;
const TERMINATED = 1;
const ERRORED = 2;

type UnterminatedCacheNode<T> = {
  s: 0,
  v: void,
  o: null | WeakMap<Function | Object, CacheNode<T>>,
  p: null | Map<string | number | null | void | symbol | boolean, CacheNode<T>>,
};

type TerminatedCacheNode<T> = {
  s: 1,
  v: T,
  o: null | WeakMap<Function | Object, CacheNode<T>>,
  p: null | Map<string | number | null | void | symbol | boolean, CacheNode<T>>,
};

type ErroredCacheNode<T> = {
  s: 2,
  v: mixed,
  o: null | WeakMap<Function | Object, CacheNode<T>>,
  p: null | Map<string | number | null | void | symbol | boolean, CacheNode<T>>,
};

type CacheNode<T> =
  | TerminatedCacheNode<T>
  | UnterminatedCacheNode<T>
  | ErroredCacheNode<T>;

function createCacheRoot<T>(): WeakMap<Function | Object, CacheNode<T>> {
  return new WeakMap();
}

function createCacheNode<T>(): CacheNode<T> {
  return {
    s: UNTERMINATED, // status, represents whether the cached computation returned a value or threw an error
    v: undefined, // value, either the cached result or an error, depending on s
    o: null, // object cache, a WeakMap where non-primitive arguments are stored
    p: null, // primitive cache, a regular Map where primitive arguments are stored.
  };
}

export function cache<A: Iterable<mixed>, T>(fn: (...A) => T): (...A) => T {
  return function () {
    const dispatcher = ReactSharedInternals.A;
    if (!dispatcher) {
      // If there is no dispatcher, then we treat this as not being cached.
      // $FlowFixMe[incompatible-call]: We don't want to use rest arguments since we transpile the code.
      return fn.apply(null, arguments);
    }
    const fnMap: WeakMap<any, CacheNode<T>> = dispatcher.getCacheForType(
      createCacheRoot,
    );
    const fnNode = fnMap.get(fn);
    let cacheNode: CacheNode<T>;
    if (fnNode === undefined) {
      cacheNode = createCacheNode();
      fnMap.set(fn, cacheNode);
    } else {
      cacheNode = fnNode;
    }
    for (let i = 0, l = arguments.length; i < l; i++) {
      const arg = arguments[i];
      if (
        typeof arg === 'function' ||
        (typeof arg === 'object' && arg !== null)
      ) {
        // Objects go into a WeakMap
        let objectCache = cacheNode.o;
        if (objectCache === null) {
          cacheNode.o = objectCache = new WeakMap();
        }
        const objectNode = objectCache.get(arg);
        if (objectNode === undefined) {
          cacheNode = createCacheNode();
          objectCache.set(arg, cacheNode);
        } else {
          cacheNode = objectNode;
        }
      } else {
        // Primitives go into a regular Map
        let primitiveCache = cacheNode.p;
        if (primitiveCache === null) {
          cacheNode.p = primitiveCache = new Map();
        }
        const primitiveNode = primitiveCache.get(arg);
        if (primitiveNode === undefined) {
          cacheNode = createCacheNode();
          primitiveCache.set(arg, cacheNode);
        } else {
          cacheNode = primitiveNode;
        }
      }
    }
    if (cacheNode.s === TERMINATED) {
      return cacheNode.v;
    }
    if (cacheNode.s === ERRORED) {
      throw cacheNode.v;
    }
    try {
      // $FlowFixMe[incompatible-call]: We don't want to use rest arguments since we transpile the code.
      const result = fn.apply(null, arguments);
      const terminatedNode: TerminatedCacheNode<T> = (cacheNode: any);
      terminatedNode.s = TERMINATED;
      terminatedNode.v = result;
      return result;
    } catch (error) {
      // We store the first error that's thrown and rethrow it.
      const erroredNode: ErroredCacheNode<T> = (cacheNode: any);
      erroredNode.s = ERRORED;
      erroredNode.v = error;
      throw error;
    }
  };
}
