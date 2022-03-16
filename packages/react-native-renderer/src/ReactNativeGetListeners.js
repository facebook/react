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
import {CustomEvent} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';

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
 * Native system events emitted into React Native
 * will be emitted both to the prop handler function and to imperative event
 * listeners.
 *
 * This will either return null, a single Function without an array, or
 * an array of 2+ items.
 */
export default function getListeners(
  inst: Fiber,
  registrationName: string,
  phase: PropagationPhases,
  dispatchToImperativeListeners: boolean,
): null | Function | Array<Function> {
  const stateNode = inst.stateNode;

  if (stateNode === null) {
    return null;
  }

  // If null: Work in progress (ex: onload events in incremental mode).
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

  // If there are no imperative listeners, early exit.
  if (
    !(
      dispatchToImperativeListeners &&
      stateNode.canonical &&
      stateNode.canonical._eventListeners
    )
  ) {
    return listener;
  }

  // Below this is the de-optimized path.
  // If you are using _eventListeners, we do not (yet)
  // expect this to be as performant as the props-only path.
  // If/when this becomes a bottleneck, it can be refactored
  // to avoid unnecessary closures and array allocations.
  //
  // Previously, there was only one possible listener for an event:
  // the onEventName property in props.
  // Now, it is also possible to have N listeners
  // for a specific event on a node. Thus, we accumulate all of the listeners,
  // including the props listener, and return a function that calls them all in
  // order, starting with the handler prop and then the listeners in order.
  // We return either a non-empty array or null.
  const listeners = [];
  if (listener) {
    listeners.push(listener);
  }

  // TODO: for now, all of these events get an `rn:` prefix to enforce
  // that the user knows they're only getting non-W3C-compliant events
  // through this imperative event API.
  // Events might not necessarily be noncompliant, but we currently have
  // no verification that /any/ events are compliant.
  // Thus, we prefix to ensure no collision with W3C event names.
  const requestedPhaseIsCapture = phase === 'captured';
  const mangledImperativeRegistrationName = requestedPhaseIsCapture
    ? 'rn:' + registrationName.replace(/Capture$/, '')
    : 'rn:' + registrationName;

  // Get imperative event listeners for this event
  if (
    stateNode.canonical._eventListeners[mangledImperativeRegistrationName] &&
    stateNode.canonical._eventListeners[mangledImperativeRegistrationName]
      .length > 0
  ) {
    const eventListeners =
      stateNode.canonical._eventListeners[mangledImperativeRegistrationName];

    eventListeners.forEach(listenerObj => {
      // Make sure phase of listener matches requested phase
      const isCaptureEvent =
        listenerObj.options.capture != null && listenerObj.options.capture;
      if (isCaptureEvent !== requestedPhaseIsCapture) {
        return;
      }

      // For now (this is an area of future optimization) we must wrap
      // all imperative event listeners in a function to unwrap the SyntheticEvent
      // and pass them an Event.
      // When this API is more stable and used more frequently, we can revisit.
      const listenerFnWrapper = function(syntheticEvent, ...args) {
        const eventInst = new CustomEvent(mangledImperativeRegistrationName, {
          detail: syntheticEvent.nativeEvent,
        });
        eventInst.isTrusted = true;
        // setSyntheticEvent is present on the React Native Event shim.
        // It is used to forward method calls on Event to the underlying SyntheticEvent.
        // $FlowFixMe
        eventInst.setSyntheticEvent(syntheticEvent);

        listenerObj.listener(eventInst, ...args);
      };

      // Only call once?
      // If so, we ensure that it's only called once by setting a flag
      // and by removing it from eventListeners once it is called (but only
      // when it's actually been executed).
      if (listenerObj.options.once) {
        listeners.push(function(...args) {
          // Remove from the event listener once it's been called
          stateNode.canonical.removeEventListener_unstable(
            mangledImperativeRegistrationName,
            listenerObj.listener,
            listenerObj.capture,
          );

          // Guard against function being called more than once in
          // case there are somehow multiple in-flight references to
          // it being processed
          if (!listenerObj.invalidated) {
            listenerObj.invalidated = true;
            listenerObj.listener(...args);
          }
        });
      } else {
        listeners.push(listenerFnWrapper);
      }
    });
  }

  if (listeners.length === 0) {
    return null;
  }
  if (listeners.length === 1) {
    return listeners[0];
  }

  return listeners;
}
