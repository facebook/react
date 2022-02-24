/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import type {PropagationPhases} from './legacy-events/PropagationPhases';

import {getFiberCurrentPropsFromNode} from './legacy-events/EventPluginUtils';

/**
 * Get a list of listeners for a specific event, in-order.
 * For React Native we treat the props-based function handlers
 * as the first-class citizens, and they are always executed first
 * for both capture and bubbling phase.
 *
 * We need "phase" propagated to this point to support the HostComponent
 * EventEmitter API, which does not mutate the name of the handler based
 * on phase (whereas prop handlers are registered as `onMyEvent` and `onMyEvent_Capture`).
 *
 * Additionally, we do NOT want CustomEvent events dispatched through
 * the EventEmitter directly in JS to be emitted to prop handlers. This
 * may change in the future. OTOH, native events emitted into React Native
 * will be emitted both to the prop handler function and to imperative event
 * listeners.
 */
export default function getListeners(
  inst: Fiber,
  registrationName: string,
  phase: PropagationPhases,
  isCustomEvent: boolean,
): Array<Function> | null {
  // Previously, there was only one possible listener for an event:
  // the onEventName property in props.
  // Now, it is also possible to have N listeners
  // for a specific event on a node. Thus, we accumulate all of the listeners,
  // including the props listener, and return a function that calls them all in
  // order, starting with the handler prop and then the listeners in order.
  // We return either a non-empty array or null.
  let listeners = null;

  const stateNode = inst.stateNode;

  if (stateNode === null) {
    return null;
  }

  // If null: Work in progress (ex: onload events in incremental mode).
  if (!isCustomEvent) {
    const props = getFiberCurrentPropsFromNode(stateNode);
    if (props === null) {
      // Work in progress.
      return null;
    }
    const listener = props[registrationName];

    if (listener && typeof listener !== 'function') {
      throw new Error(
        `Expected \`${registrationName}\` listener to be a function, instead got a value of \`${typeof listener}\` type.`,
      );
    }

    if (listener) {
      if (listeners === null) {
        listeners = [];
      }
      listeners.push(listener);
    }
  }

  // Get imperative event listeners for this event
  if (
    stateNode.canonical &&
    stateNode.canonical._eventListeners &&
    stateNode.canonical._eventListeners[registrationName] &&
    stateNode.canonical._eventListeners[registrationName].length > 0
  ) {
    const eventListeners =
      stateNode.canonical._eventListeners[registrationName];
    const requestedPhaseIsCapture = phase === 'captured';

    eventListeners.forEach(listenerObj => {
      // Make sure phase of listener matches requested phase
      const isCaptureEvent =
        listenerObj.options.capture != null && listenerObj.options.capture;
      if (isCaptureEvent !== requestedPhaseIsCapture) {
        return;
      }

      // Only call once?
      // If so, we ensure that it's only called once by setting a flag
      // and by removing it from eventListeners once it is called (but only
      // when it's actually been executed).
      if (listeners === null) {
        listeners = [];
      }
      if (listenerObj.options.once) {
        listeners.push(function() {
          const args = Array.prototype.slice.call(arguments);

          // Guard against function being called more than once in
          // case there are somehow multiple in-flight references to
          // it being processed
          if (!listenerObj.invalidated) {
            listenerObj.listener.apply(null, args);
            listenerObj.invalidated = true;
          }

          // Remove from the event listener once it's been called
          stateNode.canonical.removeEventListener_unstable(
            registrationName,
            listenerObj.listener,
            listenerObj.capture,
          );
        });
      } else {
        listeners.push(listenerObj.listener);
      }
    });
  }

  return listeners;
}
