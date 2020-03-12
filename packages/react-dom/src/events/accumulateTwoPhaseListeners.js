/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactSyntheticEvent} from 'legacy-events/ReactSyntheticEventType';

import getListener from 'legacy-events/getListener';
import {HostComponent} from 'shared/ReactWorkTags';

export default function accumulateTwoPhaseListeners(
  event: ReactSyntheticEvent,
): void {
  const phasedRegistrationNames = event.dispatchConfig.phasedRegistrationNames;
  if (phasedRegistrationNames == null) {
    return;
  }
  const {bubbled, captured} = phasedRegistrationNames;
  const dispatchListeners = [];
  const dispatchInstances = [];
  let node = event._targetInst;

  // Accumulate all instances and listeners via the target -> root path.
  while (node !== null) {
    // We only care for listeners that are on HostComponents (i.e. <div>)
    if (node.tag === HostComponent) {
      // Standard React on* listeners, i.e. onClick prop
      const captureListener = getListener(node, captured);
      if (captureListener != null) {
        // Capture listeners/instances should go at the start, so we
        // unshift them to the start of the array.
        dispatchListeners.unshift(captureListener);
        dispatchInstances.unshift(node);
      }
      const bubbleListener = getListener(node, bubbled);
      if (bubbleListener != null) {
        // Bubble listeners/instances should go at the end, so we
        // push them to the end of the array.
        dispatchListeners.push(bubbleListener);
        dispatchInstances.push(node);
      }
    }
    node = node.return;
  }
  // To prevent allocation to the event unless we actually
  // have listeners we check the length of one of the arrays.
  if (dispatchListeners.length > 0) {
    event._dispatchListeners = dispatchListeners;
    event._dispatchInstances = dispatchInstances;
  }
}
