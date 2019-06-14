/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AnyNativeEvent} from 'events/PluginModuleType';
import {EventComponent} from 'shared/ReactWorkTags';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import {
  batchedEventUpdates,
  discreteUpdates,
  flushDiscreteUpdatesIfNeeded,
} from 'events/ReactGenericBatching';
import type {
  ReactEventComponentInstance,
  EventPriority,
} from 'shared/ReactTypes';
import type {
  TopLevelEventType,
  ReactFabricEventResponder,
  ReactFabricResponderContext,
  ReactFabricResponderEvent,
} from './ReactNativeTypes';
import {
  ContinuousEvent,
  UserBlockingEvent,
  DiscreteEvent,
} from 'shared/ReactTypes';
import {invokeGuardedCallbackAndCatchFirstError} from 'shared/ReactErrorUtils';
import {enableUserBlockingEvents} from 'shared/ReactFeatureFlags';

// Intentionally not named imports because Rollup would use dynamic dispatch for
// CommonJS interop named imports.
import * as Scheduler from 'scheduler';
const {
  unstable_UserBlockingPriority: UserBlockingPriority,
  unstable_runWithPriority: runWithPriority,
} = Scheduler;

type EventObjectType = $Shape<PartialEventObject>;

type PartialEventObject = {
  target: Element | Document,
  type: string,
};

type EventQueue = {
  events: Array<EventObjectType>,
  eventPriority: EventPriority,
};

const targetEventTypeCached: Map<
  Array<TopLevelEventType>,
  Set<TopLevelEventType>,
> = new Map();
const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
const eventListeners:
  | WeakMap
  | Map<
      $Shape<PartialEventObject>,
      ($Shape<PartialEventObject>) => void,
    > = new PossiblyWeakMap();

const responderOwners: Map<
  ReactFabricEventResponder,
  ReactEventComponentInstance,
> = new Map();
let globalOwner = null;

let currentTimeStamp = 0;
let currentTimers = new Map();
let currentInstance: null | ReactEventComponentInstance = null;
let currentEventQueue: null | EventQueue = null;
// let currentTimerIDCounter = 0;

const eventResponderContext: ReactFabricResponderContext = {};

function createFabricResponderEvent(
  topLevelType: TopLevelEventType,
  nativeEvent: AnyNativeEvent,
  target: null | Fiber,
): ReactFabricResponderEvent {
  const responderEvent = {
    nativeEvent,
    target,
    type: topLevelType,
  };
  if (__DEV__) {
    Object.freeze(responderEvent);
  }
  return responderEvent;
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
function createEventQueue(): EventQueue {
  return {
    events: [],
    eventPriority: ContinuousEvent,
  };
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
function processEventQueue(): void {
  const {events, eventPriority} = ((currentEventQueue: any): EventQueue);

  if (events.length === 0) {
    return;
  }

  switch (eventPriority) {
    case DiscreteEvent: {
      flushDiscreteUpdatesIfNeeded(currentTimeStamp);
      discreteUpdates(() => {
        batchedEventUpdates(processEvents, events);
      });
      break;
    }
    case UserBlockingEvent: {
      if (enableUserBlockingEvents) {
        runWithPriority(
          UserBlockingPriority,
          batchedEventUpdates.bind(null, processEvents, events),
        );
      } else {
        batchedEventUpdates(processEvents, events);
      }
      break;
    }
    case ContinuousEvent: {
      batchedEventUpdates(processEvents, events);
      break;
    }
  }
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
function processEvent(event: $Shape<PartialEventObject>): void {
  const type = event.type;
  const listener = ((eventListeners.get(event): any): (
    $Shape<PartialEventObject>,
  ) => void);
  invokeGuardedCallbackAndCatchFirstError(type, listener, undefined, event);
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
function processEvents(events: Array<EventObjectType>): void {
  for (let i = 0, length = events.length; i < length; i++) {
    processEvent(events[i]);
  }
}

function getFabricTargetEventTypesSet(
  eventTypes: Array<TopLevelEventType>,
): Set<TopLevelEventType> {
  let cachedSet = targetEventTypeCached.get(eventTypes);

  if (cachedSet === undefined) {
    cachedSet = new Set();
    for (let i = 0; i < eventTypes.length; i++) {
      cachedSet.add(eventTypes[i]);
    }
    targetEventTypeCached.set(eventTypes, cachedSet);
  }
  return cachedSet;
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
function getTargetEventResponderInstances(
  topLevelType: TopLevelEventType,
  targetFiber: null | Fiber,
): Array<ReactEventComponentInstance> {
  const eventResponderInstances = [];
  let node = targetFiber;
  while (node !== null) {
    // Traverse up the fiber tree till we find event component fibers.
    if (node.tag === EventComponent) {
      const eventComponentInstance = node.stateNode;
      const responder = eventComponentInstance.responder;
      const targetEventTypes = responder.targetEventTypes;
      // Validate the target event type exists on the responder
      if (targetEventTypes !== undefined) {
        const targetEventTypesSet = getFabricTargetEventTypesSet(
          targetEventTypes,
        );
        if (targetEventTypesSet.has(topLevelType)) {
          eventResponderInstances.push(eventComponentInstance);
        }
      }
    }
    node = node.return;
  }
  return eventResponderInstances;
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
function shouldSkipEventComponent(
  eventResponderInstance: ReactEventComponentInstance,
  propagatedEventResponders: null | Set<ReactFabricEventResponder>,
): boolean {
  const responder = ((eventResponderInstance.responder: any): ReactFabricEventResponder);
  if (propagatedEventResponders !== null && responder.stopLocalPropagation) {
    if (propagatedEventResponders.has(responder)) {
      return true;
    }
    propagatedEventResponders.add(responder);
  }
  if (globalOwner && globalOwner !== eventResponderInstance) {
    return true;
  }
  if (
    responderOwners.has(responder) &&
    responderOwners.get(responder) !== eventResponderInstance
  ) {
    return true;
  }
  return false;
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
function traverseAndHandleEventResponderInstances(
  topLevelType: TopLevelEventType,
  targetFiber: null | Fiber,
  nativeEvent: AnyNativeEvent,
): void {
  // Trigger event responders in this order:
  // - Capture target phase
  // - Bubble target phase
  // - Root phase

  const targetEventResponderInstances = getTargetEventResponderInstances(
    topLevelType,
    targetFiber,
  );
  const responderEvent = createFabricResponderEvent(
    topLevelType,
    nativeEvent,
    targetFiber,
  );
  const propagatedEventResponders: Set<ReactFabricEventResponder> = new Set();
  let length = targetEventResponderInstances.length;
  let i;

  // Captured and bubbled event phases have the notion of local propagation.
  // This means that the propgation chain can be stopped part of the the way
  // through processing event component instances. The major difference to other
  // events systems is that the stopping of propgation is localized to a single
  // phase, rather than both phases.
  if (length > 0) {
    // Capture target phase
    for (i = length; i-- > 0; ) {
      const targetEventResponderInstance = targetEventResponderInstances[i];
      const {responder, props, state} = targetEventResponderInstance;
      const eventListener = ((responder: any): ReactFabricEventResponder)
        .onEventCapture;
      if (eventListener !== undefined) {
        if (
          shouldSkipEventComponent(
            targetEventResponderInstance,
            propagatedEventResponders,
          )
        ) {
          continue;
        }
        currentInstance = targetEventResponderInstance;
        eventListener(responderEvent, eventResponderContext, props, state);
      }
    }
    // We clean propagated event responders between phases.
    propagatedEventResponders.clear();
    // Bubble target phase
    for (i = 0; i < length; i++) {
      const targetEventResponderInstance = targetEventResponderInstances[i];
      const {responder, props, state} = targetEventResponderInstance;
      const eventListener = ((responder: any): ReactFabricEventResponder)
        .onEvent;
      if (eventListener !== undefined) {
        if (
          shouldSkipEventComponent(
            targetEventResponderInstance,
            propagatedEventResponders,
          )
        ) {
          continue;
        }
        currentInstance = targetEventResponderInstance;
        eventListener(responderEvent, eventResponderContext, props, state);
      }
    }
  }
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
export function dispatchEventForResponderEventSystem(
  topLevelType: TopLevelEventType,
  targetFiber: null | Fiber,
  nativeEvent: AnyNativeEvent,
): void {
  const previousEventQueue = currentEventQueue;
  const previousInstance = currentInstance;
  const previousTimers = currentTimers;
  const previousTimeStamp = currentTimeStamp;
  currentTimers = null;
  currentEventQueue = createEventQueue();
  // We might want to control timeStamp another way here
  currentTimeStamp = (nativeEvent: any).timeStamp;
  try {
    traverseAndHandleEventResponderInstances(
      topLevelType,
      targetFiber,
      nativeEvent,
    );
    processEventQueue();
  } finally {
    currentTimers = previousTimers;
    currentInstance = previousInstance;
    currentEventQueue = previousEventQueue;
    currentTimeStamp = previousTimeStamp;
  }
}
