/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {getEventPriority} from './ReactDOMEventListener';
import {DiscreteEventPriority} from 'react-reconciler/src/ReactEventPriorities';

function monkeyPatchDispatchEvent(): void {
  const originalDispatchEvent = window.EventTarget.prototype.dispatchEvent;
  if (!originalDispatchEvent) {
    return;
  }
  function patchedDispatchEvent(event: Event) {
    // If a custom event is dispatched inside a discrete event, we want the custom
    // event to have DiscreteEventPriority instead of DefaultEventPriority
    if (
      !window.eventPriorityOverride &&
      window.event &&
      getEventPriority(window.event.type) === DiscreteEventPriority
    ) {
      window.eventPriorityOverride = DiscreteEventPriority;
      try {
        originalDispatchEvent.call(this, event);
      } catch (ex) {
        window.eventPriorityOverride = null;
        throw ex;
      }
      window.eventPriorityOverride = null;
    } else {
      originalDispatchEvent.call(this, event);
    }
  }
  window.EventTarget.prototype.dispatchEvent = patchedDispatchEvent;
}

export default monkeyPatchDispatchEvent;
