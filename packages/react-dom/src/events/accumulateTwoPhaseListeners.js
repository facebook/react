/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactFiber.old';
import type {DOMTopLevelEventType} from 'legacy-events/TopLevelEventTypes';
import type {ReactSyntheticEvent} from 'legacy-events/ReactSyntheticEventType';

import {
  HostComponent,
  ScopeComponent,
} from 'react-reconciler/src/ReactWorkTags';
import {
  enableUseEventAPI,
  enableScopeAPI,
  enableModernEventSystem,
} from 'shared/ReactFeatureFlags';

import getListener from './getListener';
import {getListenersFromTarget} from '../client/ReactDOMComponentTree';
import {reactScopeListenerStore} from './DOMModernPluginEventSystem';

export default function accumulateTwoPhaseListeners(
  event: ReactSyntheticEvent,
  accumulateUseEventListeners?: boolean,
): void {
  const phasedRegistrationNames = event.dispatchConfig.phasedRegistrationNames;
  const dispatchListeners = [];
  const dispatchInstances: Array<Fiber | null> = [];
  const dispatchCurrentTargets = [];

  const {bubbled, captured} = phasedRegistrationNames;
  // If we are not handling EventTarget only phase, then we're doing the
  // usual two phase accumulation using the React fiber tree to pick up
  // all relevant useEvent and on* prop events.
  let instance = event._targetInst;
  let lastHostComponent = null;

  // Accumulate all instances and listeners via the target -> root path.
  while (instance !== null) {
    const {stateNode, tag} = instance;
    // Handle listeners that are on HostComponents (i.e. <div>)
    if (tag === HostComponent && stateNode !== null) {
      const currentTarget = stateNode;
      lastHostComponent = currentTarget;
      // For useEvent listenrs
      if (
        enableModernEventSystem &&
        enableUseEventAPI &&
        accumulateUseEventListeners
      ) {
        // useEvent event listeners
        const targetType = event.type;
        const listeners = getListenersFromTarget(currentTarget);

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
                dispatchInstances.unshift(instance);
                dispatchCurrentTargets.unshift(currentTarget);
              } else {
                dispatchListeners.push(callback);
                dispatchInstances.push(instance);
                dispatchCurrentTargets.push(currentTarget);
              }
            }
          }
        }
      }
      // Standard React on* listeners, i.e. onClick prop
      if (captured !== null) {
        const captureListener = getListener(instance, captured);
        if (captureListener != null) {
          // Capture listeners/instances should go at the start, so we
          // unshift them to the start of the array.
          dispatchListeners.unshift(captureListener);
          dispatchInstances.unshift(instance);
          dispatchCurrentTargets.unshift(currentTarget);
        }
      }
      if (bubbled !== null) {
        const bubbleListener = getListener(instance, bubbled);
        if (bubbleListener != null) {
          // Bubble listeners/instances should go at the end, so we
          // push them to the end of the array.
          dispatchListeners.push(bubbleListener);
          dispatchInstances.push(instance);
          dispatchCurrentTargets.push(currentTarget);
        }
      }
    }
    if (
      enableModernEventSystem &&
      enableUseEventAPI &&
      enableScopeAPI &&
      accumulateUseEventListeners &&
      tag === ScopeComponent &&
      lastHostComponent !== null
    ) {
      const reactScope = stateNode.methods;
      const eventTypeMap = reactScopeListenerStore.get(reactScope);
      if (eventTypeMap !== undefined) {
        const type = ((event.type: any): DOMTopLevelEventType);
        const listeners = eventTypeMap.get(type);
        if (listeners !== undefined) {
          const captureListeners = Array.from(listeners.captured);
          const bubbleListeners = Array.from(listeners.bubbled);
          const lastCurrentTarget = ((lastHostComponent: any): Element);

          for (let i = 0; i < captureListeners.length; i++) {
            const listener = captureListeners[i];
            const {callback} = listener;
            dispatchListeners.unshift(callback);
            dispatchInstances.unshift(instance);
            dispatchCurrentTargets.unshift(lastCurrentTarget);
          }
          for (let i = 0; i < bubbleListeners.length; i++) {
            const listener = bubbleListeners[i];
            const {callback} = listener;
            dispatchListeners.push(callback);
            dispatchInstances.push(instance);
            dispatchCurrentTargets.push(lastCurrentTarget);
          }
        }
      }
    }
    instance = instance.return;
  }

  // To prevent allocation to the event unless we actually
  // have listeners we check the length of one of the arrays.
  if (dispatchListeners.length > 0) {
    event._dispatchListeners = dispatchListeners;
    event._dispatchInstances = dispatchInstances;
    event._dispatchCurrentTargets = dispatchCurrentTargets;
  }
}
