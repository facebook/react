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

export default function getListener(
  inst: Fiber,
  registrationName: string,
  phase: PropagationPhases,
): Function | null {
  // Previously, there was only one possible listener for an event:
  // the onEventName property in props.
  // Now, it is also possible to have N listeners
  // for a specific event on a node. Thus, we accumulate all of the listeners,
  // including the props listener, and return a function that calls them all in
  // order, starting with the handler prop and then the listeners in order.
  // We still return a single function or null.
  const listeners = [];

  const stateNode = inst.stateNode;
  // If null: Work in progress (ex: onload events in incremental mode).
  if (stateNode !== null) {
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
      listeners.push(listener);
    }
  }

  // Get imperative event listeners for this event
  if (stateNode.canonical && stateNode.canonical._eventListeners && stateNode.canonical._eventListeners[registrationName] && stateNode.canonical._eventListeners[registrationName].length > 0) {
    var toRemove = [];
    for (var listenerObj of stateNode.canonical._eventListeners[registrationName]) {
      // Make sure phase of listener matches requested phase
      const isCaptureEvent = listenerObj.options.capture != null && listenerObj.options.capture;
      if (isCaptureEvent !== (phase === 'captured')) {
        continue;
      }

      // Only call once?
      // If so, we ensure that it's only called once by setting a flag
      // and by removing it from eventListeners once it is called (but only
      // when it's actually been executed).
      if (listenerObj.options.once) {
        listeners.push(function () {
          var args = Array.prototype.slice.call(arguments);

          // Guard against function being called more than once in
          // case there are somehow multiple in-flight references to
          // it being processed
          if (!listenerObj.invalidated) {
            listenerObj.listener.apply(null, args);
            listenerObj.invalidated = true;
          }

          // Remove from the event listener once it's been called
          stateNode.canonical.removeEventListener_unstable(registrationName, listenerObj.listener, listenerObj.capture);
        });
      } else {
        listeners.push(listenerObj.listener);
      }
    }
  }

  if (listeners.length === 0) {
    return null;
  }

  if (listeners.length === 1) {
    return listeners[0];
  }

  // We need to call at least 2 event handlers
  return function () {
    // any arguments that are passed to the event handlers
    var args = Array.prototype.slice.call(arguments);

    for (var i = 0; i < listeners.length; i++) {
      listeners[i] && listeners[i].apply(null, args);
    }
  };
}
