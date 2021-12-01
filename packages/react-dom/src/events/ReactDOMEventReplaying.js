/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AnyNativeEvent} from '../events/PluginModuleType';
import type {Container, SuspenseInstance} from '../client/ReactDOMHostConfig';
import type {DOMEventName} from '../events/DOMEventNames';
import type {EventSystemFlags} from './EventSystemFlags';
import type {FiberRoot} from 'react-reconciler/src/ReactInternalTypes';
import type {EventPriority} from 'react-reconciler/src/ReactEventPriorities';
import {dispatchEventForPluginEventSystem} from './DOMPluginEventSystem';
import getEventTarget from './getEventTarget';
import {isReplayingEvent, replayEventWrapper} from './replayedEvent';

import {
  enableSelectiveHydration,
  enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay,
} from 'shared/ReactFeatureFlags';
import {
  unstable_scheduleCallback as scheduleCallback,
  unstable_NormalPriority as NormalPriority,
} from 'scheduler';
import {
  getNearestMountedFiber,
  getContainerFromFiber,
  getSuspenseInstanceFromFiber,
} from 'react-reconciler/src/ReactFiberTreeReflection';
import {findInstanceBlockingEvent} from './ReactDOMEventListener';
import {
  getInstanceFromNode,
  getClosestInstanceFromNode,
} from '../client/ReactDOMComponentTree';
import {HostRoot, SuspenseComponent} from 'react-reconciler/src/ReactWorkTags';
import {isHigherEventPriority} from 'react-reconciler/src/ReactEventPriorities';

let _attemptSynchronousHydration: (fiber: Object) => void;

export function setAttemptSynchronousHydration(fn: (fiber: Object) => void) {
  _attemptSynchronousHydration = fn;
}

export function attemptSynchronousHydration(fiber: Object) {
  _attemptSynchronousHydration(fiber);
}

let attemptDiscreteHydration: (fiber: Object) => void;

export function setAttemptDiscreteHydration(fn: (fiber: Object) => void) {
  attemptDiscreteHydration = fn;
}

let attemptContinuousHydration: (fiber: Object) => void;

export function setAttemptContinuousHydration(fn: (fiber: Object) => void) {
  attemptContinuousHydration = fn;
}

let attemptHydrationAtCurrentPriority: (fiber: Object) => void;

export function setAttemptHydrationAtCurrentPriority(
  fn: (fiber: Object) => void,
) {
  attemptHydrationAtCurrentPriority = fn;
}

let getCurrentUpdatePriority: () => EventPriority;

export function setGetCurrentUpdatePriority(fn: () => EventPriority) {
  getCurrentUpdatePriority = fn;
}

let attemptHydrationAtPriority: <T>(priority: EventPriority, fn: () => T) => T;

export function setAttemptHydrationAtPriority(
  fn: <T>(priority: EventPriority, fn: () => T) => T,
) {
  attemptHydrationAtPriority = fn;
}

// TODO: Upgrade this definition once we're on a newer version of Flow that
// has this definition built-in.
type PointerEvent = Event & {
  pointerId: number,
  relatedTarget: EventTarget | null,
  ...
};

declare export class NullTarget {}
export const nullTarget: NullTarget = ({}: any);
export function isBlocked(
  blockedOn: NullTarget | null | Container | SuspenseInstance,
): Container | SuspenseInstance | void {
  if (blockedOn !== nullTarget && blockedOn !== null) {
    return ((blockedOn: any): Container | SuspenseInstance);
  }
}

type QueuedReplayableEvent = {|
  blockedOn: NullTarget | null | Container | SuspenseInstance,
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  nativeEvent: AnyNativeEvent,
  targetContainers: Array<EventTarget>,
|};

let hasScheduledReplayAttempt = false;

// The queue of discrete events to be replayed.
const queuedDiscreteEvents: Array<QueuedReplayableEvent> = [];

// Indicates if any continuous event targets are non-null for early bailout.
const hasAnyQueuedContinuousEvents: boolean = false;
// The last of each continuous event type. We only need to replay the last one
// if the last target was dehydrated.
let queuedFocus: null | QueuedReplayableEvent = null;
let queuedDrag: null | QueuedReplayableEvent = null;
let queuedMouse: null | QueuedReplayableEvent = null;
// For pointer events there can be one latest event per pointerId.
const queuedPointers: Map<number, QueuedReplayableEvent> = new Map();
const queuedPointerCaptures: Map<number, QueuedReplayableEvent> = new Map();
// We could consider replaying selectionchange and touchmoves too.

type QueuedHydrationTarget = {|
  blockedOn: NullTarget | null | Container | SuspenseInstance,
  target: Node,
  priority: EventPriority,
|};
const queuedExplicitHydrationTargets: Array<QueuedHydrationTarget> = [];

export function hasQueuedDiscreteEvents(): boolean {
  return queuedDiscreteEvents.length > 0;
}

export function hasQueuedContinuousEvents(): boolean {
  return hasAnyQueuedContinuousEvents;
}

const discreteReplayableEvents: Array<DOMEventName> = [
  'mousedown',
  'mouseup',
  'touchcancel',
  'touchend',
  'touchstart',
  'auxclick',
  'dblclick',
  'pointercancel',
  'pointerdown',
  'pointerup',
  'dragend',
  'dragstart',
  'drop',
  'compositionend',
  'compositionstart',
  'keydown',
  'keypress',
  'keyup',
  'input',
  'textInput', // Intentionally camelCase
  'copy',
  'cut',
  'paste',
  'click',
  'change',
  'contextmenu',
  'reset',
  'submit',
];

export function isDiscreteEventThatRequiresHydration(
  eventType: DOMEventName,
): boolean {
  return discreteReplayableEvents.indexOf(eventType) > -1;
}

function createQueuedReplayableEvent(
  blockedOn: NullTarget | null | Container | SuspenseInstance,
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
  nativeEvent: AnyNativeEvent,
): QueuedReplayableEvent {
  return {
    blockedOn,
    domEventName,
    eventSystemFlags,
    nativeEvent,
    targetContainers: [targetContainer],
  };
}

export function queueDiscreteEvent(
  blockedOn: NullTarget | null | Container | SuspenseInstance,
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
  nativeEvent: AnyNativeEvent,
): void {
  if (enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay) {
    return;
  }
  const queuedEvent = createQueuedReplayableEvent(
    blockedOn,
    domEventName,
    eventSystemFlags,
    targetContainer,
    nativeEvent,
  );
  queuedDiscreteEvents.push(queuedEvent);
  if (enableSelectiveHydration) {
    if (queuedDiscreteEvents.length === 1) {
      // If this was the first discrete event, we might be able to
      // synchronously unblock it so that preventDefault still works.
      let blockedOnInst;
      while ((blockedOnInst = isBlocked(queuedEvent.blockedOn))) {
        const fiber = getInstanceFromNode(blockedOnInst);
        if (fiber === null) {
          break;
        }
        attemptSynchronousHydration(fiber);
        blockedOnInst = isBlocked(queuedEvent.blockedOn);
        if (!blockedOnInst) {
          // We got unblocked by hydration. Let's try again.
          replayUnblockedEvents();
          // If we're reblocked, on an inner boundary, we might need
          // to attempt hydrating that one.
          continue;
        } else {
          // We're still blocked from hydration, we have to give up
          // and replay later.
          break;
        }
      }
    }
  }
}

// Resets the replaying for this type of continuous event to no event.
export function clearIfContinuousEvent(
  domEventName: DOMEventName,
  nativeEvent: AnyNativeEvent,
): void {
  switch (domEventName) {
    case 'focusin':
    case 'focusout':
      queuedFocus = null;
      break;
    case 'dragenter':
    case 'dragleave':
      queuedDrag = null;
      break;
    case 'mouseover':
    case 'mouseout':
      queuedMouse = null;
      break;
    case 'pointerover':
    case 'pointerout': {
      const pointerId = ((nativeEvent: any): PointerEvent).pointerId;
      queuedPointers.delete(pointerId);
      break;
    }
    case 'gotpointercapture':
    case 'lostpointercapture': {
      const pointerId = ((nativeEvent: any): PointerEvent).pointerId;
      queuedPointerCaptures.delete(pointerId);
      break;
    }
  }
}

function accumulateOrCreateContinuousQueuedReplayableEvent(
  existingQueuedEvent: null | QueuedReplayableEvent,
  blockedOn: NullTarget | null | Container | SuspenseInstance,
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
  nativeEvent: AnyNativeEvent,
): QueuedReplayableEvent {
  if (
    existingQueuedEvent === null ||
    existingQueuedEvent.nativeEvent !== nativeEvent
  ) {
    const queuedEvent = createQueuedReplayableEvent(
      blockedOn,
      domEventName,
      eventSystemFlags,
      targetContainer,
      nativeEvent,
    );
    const blockedOnInst = isBlocked(blockedOn);
    if (blockedOnInst) {
      const fiber = getInstanceFromNode(blockedOnInst);
      if (fiber !== null) {
        // Attempt to increase the priority of this target.
        attemptContinuousHydration(fiber);
      }
    }
    return queuedEvent;
  }
  // If we have already queued this exact event, then it's because
  // the different event systems have different DOM event listeners.
  // We can accumulate the flags, and the targetContainers, and
  // store a single event to be replayed.
  existingQueuedEvent.eventSystemFlags |= eventSystemFlags;
  const targetContainers = existingQueuedEvent.targetContainers;
  if (
    targetContainer !== null &&
    targetContainers.indexOf(targetContainer) === -1
  ) {
    targetContainers.push(targetContainer);
  }
  return existingQueuedEvent;
}

export function queueIfContinuousEvent(
  blockedOn: NullTarget | null | Container | SuspenseInstance,
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  targetContainer: EventTarget,
  nativeEvent: AnyNativeEvent,
): boolean {
  // These set relatedTarget to null because the replayed event will be treated as if we
  // moved from outside the window (no target) onto the target once it hydrates.
  // Instead of mutating we could clone the event.
  switch (domEventName) {
    case 'focusin': {
      const focusEvent = ((nativeEvent: any): FocusEvent);
      queuedFocus = accumulateOrCreateContinuousQueuedReplayableEvent(
        queuedFocus,
        blockedOn,
        domEventName,
        eventSystemFlags,
        targetContainer,
        focusEvent,
      );
      return true;
    }
    case 'dragenter': {
      const dragEvent = ((nativeEvent: any): DragEvent);
      queuedDrag = accumulateOrCreateContinuousQueuedReplayableEvent(
        queuedDrag,
        blockedOn,
        domEventName,
        eventSystemFlags,
        targetContainer,
        dragEvent,
      );
      return true;
    }
    case 'mouseover': {
      const mouseEvent = ((nativeEvent: any): MouseEvent);
      queuedMouse = accumulateOrCreateContinuousQueuedReplayableEvent(
        queuedMouse,
        blockedOn,
        domEventName,
        eventSystemFlags,
        targetContainer,
        mouseEvent,
      );
      return true;
    }
    case 'pointerover': {
      const pointerEvent = ((nativeEvent: any): PointerEvent);
      const pointerId = pointerEvent.pointerId;
      queuedPointers.set(
        pointerId,
        accumulateOrCreateContinuousQueuedReplayableEvent(
          queuedPointers.get(pointerId) || null,
          blockedOn,
          domEventName,
          eventSystemFlags,
          targetContainer,
          pointerEvent,
        ),
      );
      return true;
    }
    case 'gotpointercapture': {
      const pointerEvent = ((nativeEvent: any): PointerEvent);
      const pointerId = pointerEvent.pointerId;
      queuedPointerCaptures.set(
        pointerId,
        accumulateOrCreateContinuousQueuedReplayableEvent(
          queuedPointerCaptures.get(pointerId) || null,
          blockedOn,
          domEventName,
          eventSystemFlags,
          targetContainer,
          pointerEvent,
        ),
      );
      return true;
    }
  }
  return false;
}

function attemptExplicitHydrationTarget(
  queuedTarget: QueuedHydrationTarget,
): void {
  const targetInst = getClosestInstanceFromNode(queuedTarget.target);
  if (targetInst !== null) {
    const nearestMounted = getNearestMountedFiber(targetInst);
    if (nearestMounted !== null) {
      const tag = nearestMounted.tag;
      if (tag === SuspenseComponent) {
        const instance = getSuspenseInstanceFromFiber(nearestMounted);
        if (instance !== null) {
          // We're blocked on hydrating this boundary.
          // Increase its priority.
          queuedTarget.blockedOn = instance;
          attemptHydrationAtPriority(queuedTarget.priority, () => {
            attemptHydrationAtCurrentPriority(nearestMounted);
          });

          return;
        }
      } else if (tag === HostRoot) {
        const root: FiberRoot = nearestMounted.stateNode;
        if (root.isDehydrated) {
          queuedTarget.blockedOn = getContainerFromFiber(nearestMounted);
          // We don't currently have a way to increase the priority of
          // a root other than sync.
          return;
        }
      }
    }
  }
  queuedTarget.blockedOn = null;
}

export function queueExplicitHydrationTarget(target: Node): void {
  if (enableSelectiveHydration) {
    // TODO: This will read the priority if it's dispatched by the React
    // event system but not native events. Should read window.event.type, like
    // we do for updates (getCurrentEventPriority).
    const updatePriority = getCurrentUpdatePriority();
    const queuedTarget: QueuedHydrationTarget = {
      blockedOn: null,
      target: target,
      priority: updatePriority,
    };
    let i = 0;
    for (; i < queuedExplicitHydrationTargets.length; i++) {
      // Stop once we hit the first target with lower priority than
      if (
        !isHigherEventPriority(
          updatePriority,
          queuedExplicitHydrationTargets[i].priority,
        )
      ) {
        break;
      }
    }
    queuedExplicitHydrationTargets.splice(i, 0, queuedTarget);
    if (i === 0) {
      attemptExplicitHydrationTarget(queuedTarget);
    }
  }
}

function attemptReplayContinuousQueuedEvent(
  queuedEvent: QueuedReplayableEvent,
): boolean {
  const blockedOnInst = isBlocked(queuedEvent.blockedOn);
  if (blockedOnInst) {
    return false;
  }
  const targetContainers = queuedEvent.targetContainers;
  while (targetContainers.length > 0) {
    const targetContainer = targetContainers[0];
    const nextBlockedOn = findInstanceBlockingEvent(
      queuedEvent.domEventName,
      queuedEvent.eventSystemFlags,
      targetContainer,
      queuedEvent.nativeEvent,
    );
    const nextBlockedOnInst = isBlocked(nextBlockedOn);
    if (nextBlockedOnInst) {
      // We're still blocked. Try again later.
      const fiber = getInstanceFromNode(nextBlockedOnInst);
      if (fiber !== null) {
        attemptContinuousHydration(fiber);
      }
      queuedEvent.blockedOn = nextBlockedOn;
      return false;
    }
    replayEvent(queuedEvent, targetContainer, nextBlockedOn);
    // This target container was successfully dispatched. Try the next.
    targetContainers.shift();
  }
  return true;
}

function attemptReplayContinuousQueuedEventInMap(
  queuedEvent: QueuedReplayableEvent,
  key: number,
  map: Map<number, QueuedReplayableEvent>,
): void {
  if (attemptReplayContinuousQueuedEvent(queuedEvent)) {
    map.delete(key);
  }
}

function replayUnblockedEvents() {
  hasScheduledReplayAttempt = false;
  if (!enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay) {
    // First replay discrete events.
    while (queuedDiscreteEvents.length > 0) {
      const nextDiscreteEvent = queuedDiscreteEvents[0];
      const blockedOn = nextDiscreteEvent.blockedOn;
      const blockedOnInst = isBlocked(blockedOn);
      if (blockedOnInst) {
        // We're still blocked.
        // Increase the priority of this boundary to unblock
        // the next discrete event.
        const fiber = getInstanceFromNode(blockedOnInst);
        if (fiber !== null) {
          attemptDiscreteHydration(fiber);
        }
        break;
      }
      const targetContainers = nextDiscreteEvent.targetContainers;
      while (targetContainers.length > 0) {
        const targetContainer = targetContainers[0];
        const nextBlockedOn = findInstanceBlockingEvent(
          nextDiscreteEvent.domEventName,
          nextDiscreteEvent.eventSystemFlags,
          targetContainer,
          nextDiscreteEvent.nativeEvent,
        );
        const nextBlockedOnInst = isBlocked(nextBlockedOn);
        if (nextBlockedOnInst) {
          // We're still blocked. Try again later.
          nextDiscreteEvent.blockedOn = nextBlockedOnInst;
          break;
        }
        replayEvent(nextDiscreteEvent, targetContainer, nextBlockedOn);
        // This target container was successfully dispatched. Try the next.
        targetContainers.shift();
      }
      if (
        nextDiscreteEvent.blockedOn === null ||
        nextDiscreteEvent.blockedOn === nullTarget
      ) {
        // We've successfully replayed the first event. Let's try the next one.
        queuedDiscreteEvents.shift();
      }
    }
  }
  // Next replay any continuous events.
  if (queuedFocus !== null && attemptReplayContinuousQueuedEvent(queuedFocus)) {
    queuedFocus = null;
  }
  if (queuedDrag !== null && attemptReplayContinuousQueuedEvent(queuedDrag)) {
    queuedDrag = null;
  }
  if (queuedMouse !== null && attemptReplayContinuousQueuedEvent(queuedMouse)) {
    queuedMouse = null;
  }
  queuedPointers.forEach(attemptReplayContinuousQueuedEventInMap);
  queuedPointerCaptures.forEach(attemptReplayContinuousQueuedEventInMap);
}

function scheduleCallbackIfUnblocked(
  queuedEvent: QueuedReplayableEvent,
  unblocked: Container | SuspenseInstance,
) {
  if (queuedEvent.blockedOn === unblocked) {
    queuedEvent.blockedOn = null;
    if (!hasScheduledReplayAttempt) {
      hasScheduledReplayAttempt = true;
      // Schedule a callback to attempt replaying as many events as are
      // now unblocked. This first might not actually be unblocked yet.
      // We could check it early to avoid scheduling an unnecessary callback.
      scheduleCallback(NormalPriority, replayUnblockedEvents);
    }
  }
}

export function retryIfBlockedOn(
  unblocked: Container | SuspenseInstance,
): void {
  // Mark anything that was blocked on this as no longer blocked
  // and eligible for a replay.
  if (queuedDiscreteEvents.length > 0) {
    scheduleCallbackIfUnblocked(queuedDiscreteEvents[0], unblocked);
    // This is a exponential search for each boundary that commits. I think it's
    // worth it because we expect very few discrete events to queue up and once
    // we are actually fully unblocked it will be fast to replay them.
    for (let i = 1; i < queuedDiscreteEvents.length; i++) {
      const queuedEvent = queuedDiscreteEvents[i];
      if (queuedEvent.blockedOn === unblocked) {
        queuedEvent.blockedOn = null;
      }
    }
  }

  if (queuedFocus !== null) {
    scheduleCallbackIfUnblocked(queuedFocus, unblocked);
  }
  if (queuedDrag !== null) {
    scheduleCallbackIfUnblocked(queuedDrag, unblocked);
  }
  if (queuedMouse !== null) {
    scheduleCallbackIfUnblocked(queuedMouse, unblocked);
  }
  const unblock = queuedEvent =>
    scheduleCallbackIfUnblocked(queuedEvent, unblocked);
  queuedPointers.forEach(unblock);
  queuedPointerCaptures.forEach(unblock);

  for (let i = 0; i < queuedExplicitHydrationTargets.length; i++) {
    const queuedTarget = queuedExplicitHydrationTargets[i];
    if (queuedTarget.blockedOn === unblocked) {
      queuedTarget.blockedOn = null;
    }
  }

  while (queuedExplicitHydrationTargets.length > 0) {
    const nextExplicitTarget = queuedExplicitHydrationTargets[0];
    const blockedOnInst = isBlocked(nextExplicitTarget.blockedOn);
    if (blockedOnInst) {
      // We're still blocked.
      break;
    } else {
      attemptExplicitHydrationTarget(nextExplicitTarget);
      if (!isBlocked(nextExplicitTarget.blockedOn)) {
        // We're unblocked.
        queuedExplicitHydrationTargets.shift();
      }
    }
  }
}

function replayEvent(
  queuedEvent: QueuedReplayableEvent,
  targetContainer: EventTarget,
  targetInst: null | NullTarget | Container | SuspenseInstance,
) {
  const event = queuedEvent.nativeEvent;
  if (isReplayingEvent(event)) {
    // If an event reaches this codepath then it was recently unblocked.
    // If the event is unblocked then it should never hit this codepath again after
    // the initial unblocking since we'll just dispatch it directly without queueing it
    // for replay.
    throw new Error(
      'Attempting to replay event that is already replaying. ' +
        'This should never happen. This is a bug in React.',
    );
  }
  if (enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay) {
    const eventClone = new event.constructor(event.type, (event: any));
    replayEventWrapper(eventClone, () => {
      event.target.dispatchEvent(eventClone);
    });
  } else {
    replayEventWrapper(event, () => {
      dispatchEventForPluginEventSystem(
        queuedEvent.domEventName,
        queuedEvent.eventSystemFlags,
        event,
        targetInst === nullTarget
          ? null
          : getClosestInstanceFromNode(getEventTarget(queuedEvent.nativeEvent)),
        targetContainer,
      );
    });
  }
}
