/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import is from 'shared/objectIs';
import {useSyncExternalStore} from 'use-sync-external-store';

// Intentionally not using named imports because Rollup uses dynamic
// dispatch for CommonJS interop named imports.
const {useMemo, useDebugValue} = React;

// Same as useSyncExternalStore, but supports selector and isEqual arguments.
export function useSyncExternalStoreExtra<Snapshot, Selection>(
  subscribe: (() => void) => () => void,
  getSnapshot: () => Snapshot,
  selector: (snapshot: Snapshot) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean,
): Selection {
  const getSnapshotWithMemoizedSelector = useMemo(() => {
    // Track the memoized state using closure variables that are local to this
    // memoized instance of a getSnapshot function. Intentionally not using a
    // useRef hook, because that state would be shared across all concurrent
    // copies of the hook/component.
    let hasMemo = false;
    let memoizedSnapshot;
    let memoizedSelection;
    return () => {
      const nextSnapshot = getSnapshot();

      if (!hasMemo) {
        // The first time the hook is called, there is no memoized result.
        hasMemo = true;
        memoizedSnapshot = nextSnapshot;
        const nextSelection = selector(nextSnapshot);
        memoizedSelection = nextSelection;
        return nextSelection;
      }

      // We may be able to reuse the previous invocation's result.
      const prevSnapshot: Snapshot = (memoizedSnapshot: any);
      const prevSelection: Selection = (memoizedSelection: any);

      if (is(prevSnapshot, nextSnapshot)) {
        // The snapshot is the same as last time. Reuse the previous selection.
        return prevSelection;
      }

      // The snapshot has changed, so we need to compute a new selection.
      memoizedSnapshot = nextSnapshot;
      const nextSelection = selector(nextSnapshot);

      // If a custom isEqual function is provided, use that to check if the data
      // has changed. If it hasn't, return the previous selection. That signals
      // to React that the selections are conceptually equal, and we can bail
      // out of rendering.
      if (isEqual !== undefined && isEqual(prevSelection, nextSelection)) {
        return prevSelection;
      }

      memoizedSelection = nextSelection;
      return nextSelection;
    };
  }, [getSnapshot, selector, isEqual]);
  const value = useSyncExternalStore(
    subscribe,
    getSnapshotWithMemoizedSelector,
  );
  useDebugValue(value);
  return value;
}
