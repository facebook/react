/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {restoreStateIfNeeded} from './ReactControlledComponent';

// Used as a way to call batchedUpdates when we don't have a reference to
// the renderer. Such as when we're dispatching events or if third party
// libraries need to call batchedUpdates. Eventually, this API will go away when
// everything is batched by default. We'll then have a similar API to opt-out of
// scheduled work and instead do synchronous work.

// Defaults
let _batchUpdatesWithoutFlushing;
let _syncUpdates;
let _flushBatchedUpdates;
_batchUpdatesWithoutFlushing = _syncUpdates = _flushBatchedUpdates = function(
  fn,
  bookkeeping,
) {
  return fn(bookkeeping);
};

let isBatching = false;
export function batchedUpdates(fn, bookkeeping) {
  if (isBatching) {
    // If we are currently inside another batch, we need to wait until it
    // fully completes before restoring state.
    return fn(bookkeeping);
  }
  isBatching = true;
  try {
    return _batchUpdatesWithoutFlushing(fn, bookkeeping);
  } finally {
    // Here we wait until all updates have propagated, which is important
    // when using controlled components within layers:
    // https://github.com/facebook/react/issues/1698
    // Then we restore state of any controlled component.
    isBatching = false;
    _flushBatchedUpdates();
    restoreStateIfNeeded();
  }
}

export function syncUpdates(fn, a, b, c, d) {
  return _syncUpdates(fn, a, b, c, d);
}

export const injection = {
  injectRenderer(renderer) {
    _batchUpdatesWithoutFlushing = renderer.batchUpdatesWithoutFlushing;
    _syncUpdates = renderer.syncUpdates;
    _flushBatchedUpdates = renderer.flushBatchedUpdates;
  },
};
