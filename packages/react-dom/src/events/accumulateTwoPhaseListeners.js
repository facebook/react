/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {DOMTopLevelEventType} from 'legacy-events/TopLevelEventTypes';
import type {EventSystemFlags} from 'legacy-events/EventSystemFlags';
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

import getListener from 'legacy-events/getListener';
import {getListenersFromTarget} from '../client/ReactDOMComponentTree';
import {IS_TARGET_EVENT_ONLY} from 'legacy-events/EventSystemFlags';
import {
  eventTargetEventListenerStore,
  reactScopeListenerStore,
} from './DOMModernPluginEventSystem';

export default function accumulateTwoPhaseListeners(
  event: ReactSyntheticEvent,
  accumulateUseEventListeners?: boolean,
  eventSystemFlags?: EventSystemFlags,
  targetContainer?: null | EventTarget,
): void {
  const phasedRegistrationNames = event.dispatchConfig.phasedRegistrationNames;
  const dispatchListeners = [];
  const dispatchInstances = [];

  // For TargetEvent only accumulation, we do not traverse through
  // the React tree looking for managed React DOM elements that have
  // events. Instead we only check the EventTarget Store Map to see
  // if the container has listeners for the particular phase we're
  // interested in. This is because we attach the native event listener
  // only in the given phase.
  if (
    enableUseEventAPI &&
    accumulateUseEventListeners &&
    eventSystemFlags !== undefined &&
    eventSystemFlags & IS_TARGET_EVENT_ONLY &&
    targetContainer != null
  ) {
    const eventTypeMap = eventTargetEventListenerStore.get(targetContainer);
    if (eventTypeMap !== undefined) {
      const type = ((event.type: any): DOMTopLevelEventType);
      const listeners = eventTypeMap.get(type);
      if (listeners !== undefined) {
        const isCapturePhase = (event: any).eventPhase === 1;

        if (isCapturePhase) {
          const captureListeners = Array.from(listeners.captured);

          for (let i = captureListeners.length - 1; i >= 0; i--) {
            const listener = captureListeners[i];
            const {callback} = listener;
            dispatchListeners.push(callback);
            dispatchInstances.push(targetContainer);
          }
        } else {
          const bubbleListeners = Array.from(listeners.bubbled);

          for (let i = 0; i < bubbleListeners.length; i++) {
            const listener = bubbleListeners[i];
            const {callback} = listener;
            dispatchListeners.push(callback);
            dispatchInstances.push(targetContainer);
          }
        }
      }
    }
  } else {
    const {bubbled, captured} = phasedRegistrationNames;
    // If we are not handling EventTarget only phase, then we're doing the
    // usual two phase accumulation using the React fiber tree to pick up
    // all relevant useEvent and on* prop events.
    let node = event._targetInst;
    let lastHostComponent = null;

    // Accumulate all instances and listeners via the target -> root path.
    while (node !== null) {
      const {stateNode: instance, tag} = node;
      // Handle listeners that are on HostComponents (i.e. <div>)
      if (instance !== null && tag === HostComponent) {
        lastHostComponent = instance;
        // For useEvent listenrs
        if (
          enableModernEventSystem &&
          enableUseEventAPI &&
          accumulateUseEventListeners
        ) {
          // useEvent event listeners
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
      if (
        enableModernEventSystem &&
        enableUseEventAPI &&
        enableScopeAPI &&
        accumulateUseEventListeners &&
        tag === ScopeComponent &&
        lastHostComponent !== null
      ) {
        const reactScope = instance.methods;
        const eventTypeMap = reactScopeListenerStore.get(reactScope);
        if (eventTypeMap !== undefined) {
          const type = ((event.type: any): DOMTopLevelEventType);
          const listeners = eventTypeMap.get(type);
          if (listeners !== undefined) {
            const captureListeners = Array.from(listeners.captured);
            const bubbleListeners = Array.from(listeners.bubbled);

            for (let i = 0; i < captureListeners.length; i++) {
              const listener = captureListeners[i];
              const {callback} = listener;
              dispatchListeners.unshift(callback);
              dispatchInstances.unshift(((lastHostComponent: any): Element));
            }
            for (let i = 0; i < bubbleListeners.length; i++) {
              const listener = bubbleListeners[i];
              const {callback} = listener;
              dispatchListeners.push(callback);
              dispatchInstances.push(((lastHostComponent: any): Element));
            }
          }
        }
      }
      node = node.return;
    }
  }
  // To prevent allocation to the event unless we actually
  // have listeners we check the length of one of the arrays.
  if (dispatchListeners.length > 0) {
    event._dispatchListeners = dispatchListeners;
    event._dispatchInstances = dispatchInstances;
  }
}
