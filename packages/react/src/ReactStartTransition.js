/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import ReactCurrentBatchConfig from './ReactCurrentBatchConfig';

// This should stay in sync with the reconciler (ReactEventPriorities).
// Intentionally not using a shared module, because this crosses a package
// boundary: importing from a shared module would give a false sense of
// DRYness, because it's theoretically possible for for the renderer and
// the isomorphic package to be out of sync. We don't fully support that, but we
// should try (within reason) to be resilient.
//
// The value is an arbitrary transition lane. I picked a lane in the middle of
// the bitmask because it's unlikely to change meaning.
const TransitionEventPriority = 0b0000000000000001000000000000000;

export function startTransition(scope: () => void) {
  const prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = TransitionEventPriority;
  try {
    scope();
  } finally {
    ReactCurrentBatchConfig.transition = prevTransition;
  }
}
