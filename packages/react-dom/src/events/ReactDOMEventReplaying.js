/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AnyNativeEvent} from 'legacy-events/PluginModuleType';
import type {Container, SuspenseInstance} from '../client/ReactDOMHostConfig';
import type {DOMTopLevelEventType} from 'legacy-events/TopLevelEventTypes';
import type {EventSystemFlags} from 'legacy-events/EventSystemFlags';

import {
  unstable_scheduleCallback as scheduleCallback,
  unstable_NormalPriority as NormalPriority,
} from 'scheduler';
import {attemptToDispatchEvent} from './ReactDOMEventListener';

// TODO: Upgrade this definition once we're on a newer version of Flow that
// has this definition built-in.
type PointerEvent = Event & {pointerId: number};

import {
  TOP_MOUSE_DOWN,
  TOP_MOUSE_UP,
  TOP_TOUCH_CANCEL,
  TOP_TOUCH_END,
  TOP_TOUCH_START,
  TOP_AUX_CLICK,
  TOP_DOUBLE_CLICK,
  TOP_POINTER_CANCEL,
  TOP_POINTER_DOWN,
  TOP_POINTER_UP,
  TOP_DRAG_END,
  TOP_DRAG_START,
  TOP_DROP,
  TOP_COMPOSITION_END,
  TOP_COMPOSITION_START,
  TOP_KEY_DOWN,
  TOP_KEY_PRESS,
  TOP_KEY_UP,
  TOP_INPUT,
  TOP_TEXT_INPUT,
  TOP_CLOSE,
  TOP_CANCEL,
  TOP_COPY,
  TOP_CUT,
  TOP_PASTE,
  TOP_CLICK,
  TOP_CHANGE,
  TOP_CONTEXT_MENU,
  TOP_RESET,
  TOP_SUBMIT,
  TOP_DRAG_ENTER,
  TOP_DRAG_LEAVE,
  TOP_MOUSE_OVER,
  TOP_MOUSE_OUT,
  TOP_POINTER_OVER,
  TOP_POINTER_OUT,
  TOP_GOT_POINTER_CAPTURE,
  TOP_LOST_POINTER_CAPTURE,
  TOP_FOCUS,
  TOP_BLUR,
  TOP_SELECTION_CHANGE,
} from './DOMTopLevelEventTypes';

type QueuedReplayableEvent = {|
  blockedOn: null | Container | SuspenseInstance,
  topLevelType: DOMTopLevelEventType,
  eventSystemFlags: EventSystemFlags,
  nativeEvent: AnyNativeEvent,
|};

let hasScheduledReplayAttempt = false;

// The queue of discrete events to be replayed.
let queuedDiscreteEvents: Array<QueuedReplayableEvent> = [];

export function hasQueuedDiscreteEvents(): boolean {
  return queuedDiscreteEvents.length > 0;
}

export function isReplayableDiscreteEvent(
  eventType: DOMTopLevelEventType,
): boolean {
  switch (eventType) {
    case TOP_MOUSE_DOWN:
    case TOP_MOUSE_UP:
    case TOP_TOUCH_CANCEL:
    case TOP_TOUCH_END:
    case TOP_TOUCH_START:
    case TOP_AUX_CLICK:
    case TOP_DOUBLE_CLICK:
    case TOP_POINTER_CANCEL:
    case TOP_POINTER_DOWN:
    case TOP_POINTER_UP:
    case TOP_DRAG_END:
    case TOP_DRAG_START:
    case TOP_DROP:
    case TOP_COMPOSITION_END:
    case TOP_COMPOSITION_START:
    case TOP_KEY_DOWN:
    case TOP_KEY_PRESS:
    case TOP_KEY_UP:
    case TOP_INPUT:
    case TOP_TEXT_INPUT:
    case TOP_CLOSE:
    case TOP_CANCEL:
    case TOP_COPY:
    case TOP_CUT:
    case TOP_PASTE:
    case TOP_CLICK:
    case TOP_CHANGE:
    case TOP_CONTEXT_MENU:
    case TOP_RESET:
    case TOP_SUBMIT:
      return true;
  }
  return false;
}

function createQueuedReplayableEvent(
  blockedOn: null | Container | SuspenseInstance,
  topLevelType: DOMTopLevelEventType,
  eventSystemFlags: EventSystemFlags,
  nativeEvent: AnyNativeEvent,
): QueuedReplayableEvent {
  return {
    blockedOn,
    topLevelType,
    eventSystemFlags,
    nativeEvent,
  };
}

export function queueDiscreteEvent(
  blockedOn: null | Container | SuspenseInstance,
  topLevelType: DOMTopLevelEventType,
  eventSystemFlags: EventSystemFlags,
  nativeEvent: AnyNativeEvent,
): void {
  queuedDiscreteEvents.push(
    createQueuedReplayableEvent(
      blockedOn,
      topLevelType,
      eventSystemFlags,
      nativeEvent,
    ),
  );
  if (blockedOn === null && queuedDiscreteEvents.length === 1) {
    // This probably shouldn't happen but some defensive coding might
    // help us get unblocked if we have a bug.
    replayUnblockedEvents();
  }
}

function replayUnblockedEvents() {
  hasScheduledReplayAttempt = false;
  while (queuedDiscreteEvents.length > 0) {
    let nextDiscreteEvent = queuedDiscreteEvents[0];
    if (nextDiscreteEvent.blockedOn !== null) {
      // We're still blocked.
      return;
    }
    let nextBlockedOn = attemptToDispatchEvent(
      nextDiscreteEvent.topLevelType,
      nextDiscreteEvent.eventSystemFlags,
      nextDiscreteEvent.nativeEvent,
    );
    if (nextBlockedOn !== null) {
      // We're still blocked. Try again later.
      nextDiscreteEvent.blockedOn = nextBlockedOn;
    } else {
      // We've successfully replayed the first event. Let's try the next one.
      queuedDiscreteEvents.shift();
    }
  }
}

export function retryIfBlockedOn(
  blockedOn: Container | SuspenseInstance,
): void {
  // Mark anything that was blocked on this as no longer blocked
  // and eligible for a replay.
  if (queuedDiscreteEvents.length < 1) {
    return;
  }
  let queuedEvent = queuedDiscreteEvents[0];
  if (queuedEvent.blockedOn === blockedOn) {
    queuedEvent.blockedOn = null;
    if (!hasScheduledReplayAttempt) {
      hasScheduledReplayAttempt = true;
      // Schedule a callback to attempt replaying as many events as are
      // now unblocked. This first might not actually be unblocked yet.
      // We could check it early to avoid scheduling an unnecessary callback.
      scheduleCallback(NormalPriority, replayUnblockedEvents);
    }
  }
  // This is a exponential search for each boundary that commits. I think it's
  // worth it because we expect very few discrete events to queue up and once
  // we are actually fully unblocked it will be fast to replay them.
  for (let i = 1; i < queuedDiscreteEvents.length; i++) {
    queuedEvent = queuedDiscreteEvents[i];
    if (queuedEvent.blockedOn === blockedOn) {
      queuedEvent.blockedOn = null;
    }
  }
}
