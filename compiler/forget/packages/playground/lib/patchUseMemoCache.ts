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

    React.useMemoCache = useMemoCache;

    export default React;
  `;
}
