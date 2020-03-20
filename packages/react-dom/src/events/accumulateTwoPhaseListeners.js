/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactSyntheticEvent} from 'legacy-events/ReactSyntheticEventType';

import {HostComponent} from 'shared/ReactWorkTags';
import {enableUseEventAPI} from 'shared/ReactFeatureFlags';

import getListener from 'legacy-events/getListener';
import {getListenersFromTarget} from '../client/ReactDOMComponentTree';

export default function accumulateTwoPhaseListeners(
  event: ReactSyntheticEvent,
  accumulateUseEventListeners?: boolean,
): void {
  const phasedRegistrationNames = event.dispatchConfig.phasedRegistrationNames;
  const dispatchListeners = [];
  const dispatchInstances = [];
  const {bubbled, captured} = phasedRegistrationNames;
  let node = event._targetInst;

  // Accumulate all instances and listeners via the target -> root path.
  while (node !== null) {
    // We only care for listeners that are on HostComponents (i.e. <div>)
    if (node.tag === HostComponent) {
      // For useEvent listenrs
      if (enableUseEventAPI && accumulateUseEventListeners) {
        // useEvent event listeners
        const instance = node.stateNode;
        const targetType = event.type;
        const listeners = getListenersFromTarget(instance);

        if (listeners !== null) {
          const listenersArr = Array.from(listeners);
          for (let i = 0; i < listenersArr.length; i++) {
            const listener = listenersArr[i];
            const {
              callback,
              event: {capture, type},
            } = listener;
            if (type === targetType) {
              if (capture === true) {
                dispatchListeners.unshift(callback);
                dispatchInstances.unshift(node);
              } else {
                dispatchListeners.push(callback);
                dispatchInstances.push(node);
              }
            }
          }
        }
      }
      // Standard React on* listeners, i.e. onClick prop
      if (captured !== null) {
        const captureListener = getListener(node, captured);
        if (captureListener != null) {
          // Capture listeners/instances should go at the start, so we
          // unshift them to the start of the array.
          dispatchListeners.unshift(captureListener);
          dispatchInstances.unshift(node);
        }
      }
      if (bubbled !== null) {
        const bubbleListener = getListener(node, bubbled);
        if (bubbleListener != null) {
          // Bubble listeners/instances should go at the end, so we
          // push them to the end of the array.
          dispatchListeners.push(bubbleListener);
          dispatchInstances.push(node);
        }
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
