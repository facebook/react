/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

/**
 * Monkeypatch `useMemoCache` into `react`. The default export will be
 * used for Rollup to generate synthetic named exports.
 */
export default function patchUseMemoCache(reactSource: string) {
  return `\
    import React from "${reactSource}";

    const REACT_MEMOCACHE_SENTINEL = Symbol.for('react.memocache_sentinel');

    function useMemoCache(i) {
      "use no forget";
      const $ = new Array(i).fill(REACT_MEMOCACHE_SENTINEL)
      $._ = REACT_MEMOCACHE_SENTINEL
      const ref = React.useRef($);
      return ref.current;
    };

    useMemoCache.read = function (memoCache, index) {
      const value = memoCache[index];
      if (value === REACT_MEMOCACHE_SENTINEL) {
        throw new Error('useMemoCache.read: read before write');
      }
      return value;
    };

    // Utility functions
    function isWriteable(desc) {
      return (desc.writable || desc.set) && desc.configurable;
    }
    function getOrInsertDefault(m, k) {
      const entry = m.get(k);
      if (entry) {
        return { existed: true, entry };
      }
      else {
        const newEntry = new Map();
        m.set(k, newEntry);
        return { existed: false, entry: newEntry };
      }
    }
    function buildMakeReadOnly(logger, skippedClasses, isInROMode) {
      // All saved proxys
      const savedROObjects = new WeakMap();
      // Overwrites an object property with its proxy and saves its original value
      function addProperty(obj, key, prop, savedEntries) {
        const proxy = {
          get() {
            // read from backing cache entry
            return makeReadOnly(savedEntries.get(key).savedVal);
          },
          set(newVal) {
            if (isInROMode()) {
              logger("FORGET_MUTATE_IMMUT", key, newVal);
            }
            // update backing cache entry
            savedEntries.get(key).savedVal = newVal;
          },
        };
        if (prop.configurable != null) {
          proxy.configurable = prop.configurable;
        }
        if (prop.enumerable != null) {
          proxy.enumerable = prop.enumerable;
        }
        savedEntries.set(key, { savedVal: obj[key], getter: proxy.get });
        Object.defineProperty(obj, key, proxy);
      }
      // Changes an object to be read-only, returns its input
      function makeReadOnly(o) {
        if (typeof o !== "object" || o == null) {
          return o;
        }
        else if (skippedClasses.includes(o.constructor.name)) {
          return o;
        }
        const { existed, entry: cache } = getOrInsertDefault(savedROObjects, o);
        for (const [k, entry] of cache.entries()) {
          const currentProp = Object.getOwnPropertyDescriptor(o, k);
          if (currentProp && !isWriteable(currentProp)) {
            continue;
          }
          const currentPropGetter = currentProp?.get;
          const cachedGetter = entry.getter;
          if (currentPropGetter !== cachedGetter) {
            // cache is currently holding an old property
            //  - it may have been deleted
            //  - it may have been deleted + re-set
            //  (meaning that new value is not proxied,
            //   and the current proxied value is stale)
            cache.delete(k);
            if (!currentProp && isInROMode()) {
              logger("FORGET_DELETE_PROP_IMMUT", k);
            }
            else if (currentProp) {
              if (isInROMode()) {
                logger("FORGET_CHANGE_PROP_IMMUT", k);
              }
              addProperty(o, k, currentProp, cache);
            }
          }
        }
        for (const [k, prop] of Object.entries(Object.getOwnPropertyDescriptors(o))) {
          if (!cache.has(k) && isWriteable(prop)) {
            if (isInROMode() && existed) {
              logger("FORGET_ADD_PROP_IMMUT", k);
            }
            addProperty(o, k, prop, cache);
          }
        }
        return o;
      }
      return makeReadOnly;
    }
    
    useMemoCache.makeReadOnly = buildMakeReadOnly(
      console.log,
      [
        // some immutVals have a transitive reference to global (e.g. LexicalEditor)
        'Window',
        'Storage', // useBrowserStorage
        // some immutVals (e.g. ref.current) have a ref to DOM nodes (e.g. BaseDOMContainer)
        //  - since FiberNodes -should- be interior mutable, this is safe
        'FiberNode',
      ],
      () => true, // always read-only
    );

    React.unstable_useMemoCache = React.useMemoCache = useMemoCache;

    export default React;
  `;
}
