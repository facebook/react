/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {HostComponent} from 'shared/ReactWorkTags';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import {
  batchedEventUpdates,
  discreteUpdates,
  flushDiscreteUpdatesIfNeeded,
} from 'events/ReactGenericBatching';
import type {
  ReactEventResponderImpl,
  ReactEventResponderInstance,
} from 'shared/ReactTypes';
import type {
  ReactNativeResponderContext,
  ReactNativeResponderEvent,
  EventPriority,
  ReactNativeEventTarget,
  ReactFaricEvent,
} from './ReactNativeTypes';
import {
  ContinuousEvent,
  UserBlockingEvent,
  DiscreteEvent,
} from './ReactNativeTypes';
import {invokeGuardedCallbackAndCatchFirstError} from 'shared/ReactErrorUtils';
import {enableUserBlockingEvents} from 'shared/ReactFeatureFlags';
import warning from 'shared/warning';
import invariant from 'shared/invariant';

// Intentionally not named imports because Rollup would use dynamic dispatch for
// CommonJS interop named imports.
import * as Scheduler from 'scheduler';
const {
  unstable_UserBlockingPriority: UserBlockingPriority,
  unstable_runWithPriority: runWithPriority,
} = Scheduler;

type EventObjectType = $Shape<PartialEventObject>;

type PartialEventObject = {
  target: ReactNativeEventTarget,
  type: string,
};

type ResponderTimeout = {|
  id: TimeoutID,
  timers: Map<number, ResponderTimer>,
|};

type ResponderTimer = {|
  instance: ReactNativeEventResponderInstance,
  func: () => void,
  id: number,
  timeStamp: number,
|};

type EventQueue = {
  events: Array<EventObjectType>,
  eventPriority: EventPriority,
};

type ReactNativeEventResponderImpl = ReactEventResponderImpl<
  ReactNativeResponderEvent,
  ReactNativeResponderContext,
>;

type ReactNativeEventResponderInstance = ReactEventResponderInstance<
  ReactNativeResponderEvent,
  ReactNativeResponderContext,
>;

const {measureInWindow} = nativeFabricUIManager;

const activeTimeouts: Map<number, ResponderTimeout> = new Map();
const rootEventTypesToEventResponderInstances: Map<
  string,
  Set<ReactNativeEventResponderInstance>,
> = new Map();
const ownershipChangeListeners: Set<
  ReactNativeEventResponderInstance,
> = new Set();
const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
const eventListeners:
  | WeakMap
  | Map<
      $Shape<PartialEventObject>,
      ($Shape<PartialEventObject>) => void,
    > = new PossiblyWeakMap();

let globalOwner = null;

let currentTimeStamp = 0;
let currentTimers = new Map();
let currentInstance: null | ReactNativeEventResponderInstance = null;
let currentEventQueue: null | EventQueue = null;
let currentTimerIDCounter = 0;

const eventResponderContext: ReactNativeResponderContext = {
  dispatchEvent(
    possibleEventObject: Object,
    listener: ($Shape<PartialEventObject>) => void,
    eventPriority: EventPriority,
  ): void {
    validateResponderContext();
    const {target, type, timeStamp} = possibleEventObject;

    if (target == null || type == null || timeStamp == null) {
      throw new Error(
        'context.dispatchEvent: "target", "timeStamp", and "type" fields on event object are required.',
      );
    }
    const showWarning = name => {
      if (__DEV__) {
        warning(
          false,
          '%s is not available on event objects created from event responder modules (React Flare). ' +
            'Try wrapping in a conditional, i.e. `if (event.type !== "press") { event.%s }`',
          name,
          name,
        );
      }
    };
    possibleEventObject.preventDefault = () => {
      if (__DEV__) {
        showWarning('preventDefault()');
      }
    };
    possibleEventObject.stopPropagation = () => {
      if (__DEV__) {
        showWarning('stopPropagation()');
      }
    };
    possibleEventObject.isDefaultPrevented = () => {
      if (__DEV__) {
        showWarning('isDefaultPrevented()');
      }
    };
    possibleEventObject.isPropagationStopped = () => {
      if (__DEV__) {
        showWarning('isPropagationStopped()');
      }
    };
    // $FlowFixMe: we don't need value, Flow thinks we do
    Object.defineProperty(possibleEventObject, 'nativeEvent', {
      get() {
        if (__DEV__) {
          showWarning('nativeEvent');
        }
      },
    });

    const eventObject = ((possibleEventObject: any): $Shape<
      PartialEventObject,
    >);
    const eventQueue = ((currentEventQueue: any): EventQueue);
    eventQueue.eventPriority = eventPriority;
    eventListeners.set(eventObject, listener);
    eventQueue.events.push(eventObject);
  },
  isTargetWithinNode(
    childTarget: ReactNativeEventTarget,
    parentTarget: ReactNativeEventTarget,
  ) {
    validateResponderContext();
    const childFiber = getFiberFromTarget(childTarget);
    const parentFiber = getFiberFromTarget(parentTarget);

    let node = childFiber;
    while (node !== null) {
      if (node === parentFiber) {
        return true;
      }
      node = node.return;
    }
    return false;
  },
  getTargetBoundingRect(
    target: ReactNativeEventTarget,
    callback: ({
      left: number,
      right: number,
      top: number,
      bottom: number,
    }) => void,
  ) {
    measureInWindow(target.node, (x, y, width, height) => {
      callback({
        left: x,
        right: x + width,
        top: y,
        bottom: y + height,
      });
    });
  },
  addRootEventTypes(rootEventTypes: Array<string>): void {
    validateResponderContext();
    for (let i = 0; i < rootEventTypes.length; i++) {
      const rootEventType = rootEventTypes[i];
      const eventResponderInstance = ((currentInstance: any): ReactNativeEventResponderInstance);
      registerRootEventType(rootEventType, eventResponderInstance);
    }
  },
  removeRootEventTypes(rootEventTypes: Array<string>): void {
    validateResponderContext();
    for (let i = 0; i < rootEventTypes.length; i++) {
      const rootEventType = rootEventTypes[i];

      let rootEventComponents = rootEventTypesToEventResponderInstances.get(
        rootEventType,
      );
      let rootEventTypesSet = ((currentInstance: any): ReactNativeEventResponderInstance)
        .rootEventTypes;
      if (rootEventTypesSet !== null) {
        rootEventTypesSet.delete(rootEventType);
      }
      if (rootEventComponents !== undefined) {
        rootEventComponents.delete(
          ((currentInstance: any): ReactNativeEventResponderInstance),
        );
      }
    }
  },
  setTimeout(func: () => void, delay): number {
    validateResponderContext();
    if (currentTimers === null) {
      currentTimers = new Map();
    }
    let timeout = currentTimers.get(delay);

    const timerId = currentTimerIDCounter++;
    if (timeout === undefined) {
      const timers = new Map();
      const id = setTimeout(() => {
        processTimers(timers, delay);
      }, delay);
      timeout = {
        id,
        timers,
      };
      currentTimers.set(delay, timeout);
    }
    timeout.timers.set(timerId, {
      instance: ((currentInstance: any): ReactNativeEventResponderInstance),
      func,
      id: timerId,
      timeStamp: currentTimeStamp,
    });
    activeTimeouts.set(timerId, timeout);
    return timerId;
  },
  clearTimeout(timerId: number): void {
    validateResponderContext();
    const timeout = activeTimeouts.get(timerId);

    if (timeout !== undefined) {
      const timers = timeout.timers;
      timers.delete(timerId);
      if (timers.size === 0) {
        clearTimeout(timeout.id);
      }
    }
  },
  getTimeStamp(): number {
    validateResponderContext();
    return currentTimeStamp;
  },
};

function getFiberFromTarget(
  target: null | ReactNativeEventTarget,
): Fiber | null {
  if (target === null) {
    return null;
  }
  return ((target.canonical._internalInstanceHandle: any): Fiber) || null;
}

function processTimers(
  timers: Map<number, ResponderTimer>,
  delay: number,
): void {
  const timersArr = Array.from(timers.values());
  currentEventQueue = createEventQueue();
  try {
    for (let i = 0; i < timersArr.length; i++) {
      const {instance, func, id, timeStamp} = timersArr[i];
      currentInstance = instance;
      currentTimeStamp = timeStamp + delay;
      try {
        func();
      } finally {
        activeTimeouts.delete(id);
      }
    }
    processEventQueue();
  } finally {
    currentTimers = null;
    currentInstance = null;
    currentEventQueue = null;
    currentTimeStamp = 0;
  }
}

function createFabricResponderEvent(
  topLevelType: string,
  nativeEvent: ReactFaricEvent,
  target: null | ReactNativeEventTarget,
): ReactNativeResponderEvent {
  return {
    nativeEvent,
    responderTarget: null,
    target,
    type: topLevelType,
  };
}

function validateResponderContext(): void {
  invariant(
    currentEventQueue && currentInstance,
    'An event responder context was used outside of an event cycle. ' +
      'Use context.setTimeout() to use asynchronous responder context outside of event cycle .',
  );
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
function triggerOwnershipListeners(): void {
  const listeningInstances = Array.from(ownershipChangeListeners);
  const previousInstance = currentInstance;
  currentEventQueue = createEventQueue();
  try {
    for (let i = 0; i < listeningInstances.length; i++) {
      const instance = listeningInstances[i];
      const {props, impl, state} = instance;
      currentInstance = instance;
      const onOwnershipChange = ((impl: any): ReactNativeEventResponderImpl)
        .onOwnershipChange;
      if (onOwnershipChange !== undefined) {
        onOwnershipChange(eventResponderContext, props, state);
      }
    }
    processEventQueue();
  } finally {
    currentInstance = previousInstance;
  }
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
function releaseOwnershipForEventComponentInstance(
  eventResponderInstance: ReactNativeEventResponderInstance,
): boolean {
  if (globalOwner === eventResponderInstance) {
    globalOwner = null;
    triggerOwnershipListeners();
    return true;
  }
  return false;
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

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
function responderEventTypesContainType(
  eventTypes: Array<string>,
  type: string,
): boolean {
  for (let i = 0, len = eventTypes.length; i < len; i++) {
    if (eventTypes[i] === type) {
      return true;
    }
  }
  return false;
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
function validateOwnership(
  eventResponderInstance: ReactNativeEventResponderInstance,
): boolean {
  return globalOwner === null || globalOwner === eventResponderInstance;
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
function validateEventTargetTypes(
  eventType: string,
  responderImpl: ReactNativeEventResponderImpl,
): boolean {
  const targetEventTypes = responderImpl.targetEventTypes;
  // Validate the target event type exists on the responder
  if (targetEventTypes !== undefined) {
    return responderEventTypesContainType(targetEventTypes, eventType);
  }
  return false;
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
function traverseAndHandleEventResponderInstances(
  eventType: string,
  targetFiber: null | Fiber,
  nativeEvent: ReactFaricEvent,
): void {
  // Trigger event responders in this order:
  // - Bubble target phase
  // - Root phase

  const responderEvent = createFabricResponderEvent(
    eventType,
    nativeEvent,
    targetFiber !== null
      ? ((targetFiber.stateNode: any): ReactNativeEventTarget)
      : null,
  );
  // Once we visit a responder, we don't visit the same responder again.
  // This is a form of restricted local propagation between responders of
  // the same type.
  const visitedResponderImpls = new Set();

  let node = targetFiber;
  while (node !== null) {
    const {dependencies, stateNode, tag} = node;
    if (tag === HostComponent && dependencies !== null) {
      let responder = dependencies.firstResponder;
      while (responder !== null) {
        const {instance, next, impl} = responder;
        if (
          validateOwnership(instance) &&
          !visitedResponderImpls.has(impl) &&
          validateEventTargetTypes(eventType, impl)
        ) {
          visitedResponderImpls.add(impl);
          responderEvent.responderTarget = stateNode;
          const {props, state} = instance;
          const onEvent = impl.onEvent;
          if (onEvent !== undefined) {
            currentInstance = instance;
            onEvent(responderEvent, eventResponderContext, props, state);
          }
        }
        responder = next;
      }
    }
    node = node.return;
  }
  // Root phase
  const rootEventInstances = rootEventTypesToEventResponderInstances.get(
    eventType,
  );
  if (rootEventInstances !== undefined) {
    const rootEventResponderInstances = Array.from(rootEventInstances);

    for (let i = 0; i < rootEventResponderInstances.length; i++) {
      const rooteventResponderInstance = rootEventResponderInstances[i];
      if (!validateOwnership(rooteventResponderInstance)) {
        continue;
      }
      const {props, impl, state} = rooteventResponderInstance;
      const onRootEvent = impl.onRootEvent;
      if (onRootEvent !== undefined) {
        currentInstance = rooteventResponderInstance;
        responderEvent.responderTarget = null;
        onRootEvent(responderEvent, eventResponderContext, props, state);
      }
    }
  }
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
export function dispatchEventForResponderEventSystem(
  topLevelType: string,
  targetFiber: null | Fiber,
  nativeEvent: ReactFaricEvent,
): void {
  const previousEventQueue = currentEventQueue;
  const previousInstance = currentInstance;
  const previousTimers = currentTimers;
  const previousTimeStamp = currentTimeStamp;
  currentTimers = null;
  currentEventQueue = createEventQueue();
  // We might want to control timeStamp another way here
  currentTimeStamp = Date.now();
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

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
export function mountFabricEventResponder(
  eventResponderInstance: ReactNativeEventResponderInstance,
) {
  const impl = ((eventResponderInstance.impl: any): ReactNativeEventResponderImpl);
  if (impl.onOwnershipChange !== undefined) {
    ownershipChangeListeners.add(eventResponderInstance);
  }
  const onMount = impl.onMount;
  if (onMount !== undefined) {
    let {props, state} = eventResponderInstance;
    currentEventQueue = createEventQueue();
    currentInstance = eventResponderInstance;
    try {
      onMount(eventResponderContext, props, state);
      processEventQueue();
    } finally {
      currentEventQueue = null;
      currentInstance = null;
      currentTimers = null;
    }
  }
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
export function unmountFabricEventResponder(
  eventResponderInstance: ReactNativeEventResponderInstance,
): void {
  const impl = ((eventResponderInstance.impl: any): ReactNativeEventResponderImpl);
  const onUnmount = impl.onUnmount;
  if (onUnmount !== undefined) {
    let {props, state} = eventResponderInstance;
    currentEventQueue = createEventQueue();
    currentInstance = eventResponderInstance;
    try {
      onUnmount(eventResponderContext, props, state);
      processEventQueue();
    } finally {
      currentEventQueue = null;
      currentInstance = null;
      currentTimers = null;
    }
  }
  try {
    currentEventQueue = createEventQueue();
    releaseOwnershipForEventComponentInstance(eventResponderInstance);
    processEventQueue();
  } finally {
    currentEventQueue = null;
  }
  if (impl.onOwnershipChange !== undefined) {
    ownershipChangeListeners.delete(eventResponderInstance);
  }
  const rootEventTypesSet = eventResponderInstance.rootEventTypes;
  if (rootEventTypesSet !== null) {
    const rootEventTypes = Array.from(rootEventTypesSet);

    for (let i = 0; i < rootEventTypes.length; i++) {
      const topLevelEventType = rootEventTypes[i];
      let rootEventComponentInstances = rootEventTypesToEventResponderInstances.get(
        topLevelEventType,
      );
      if (rootEventComponentInstances !== undefined) {
        rootEventComponentInstances.delete(eventResponderInstance);
      }
    }
  }
}

function registerRootEventType(
  rootEventType: string,
  eventResponderInstance: ReactNativeEventResponderInstance,
) {
  let rootEventComponentInstances = rootEventTypesToEventResponderInstances.get(
    rootEventType,
  );
  if (rootEventComponentInstances === undefined) {
    rootEventComponentInstances = new Set();
    rootEventTypesToEventResponderInstances.set(
      rootEventType,
      rootEventComponentInstances,
    );
  }
  let rootEventTypesSet = eventResponderInstance.rootEventTypes;
  if (rootEventTypesSet === null) {
    rootEventTypesSet = eventResponderInstance.rootEventTypes = new Set();
  }
  invariant(
    !rootEventTypesSet.has(rootEventType),
    'addRootEventTypes() found a duplicate root event ' +
      'type of "%s". This might be because the event type exists in the event responder "rootEventTypes" ' +
      'array or because of a previous addRootEventTypes() using this root event type.',
    rootEventType,
  );
  rootEventTypesSet.add(rootEventType);
  rootEventComponentInstances.add(eventResponderInstance);
}

export function addRootEventTypesForComponentInstance(
  eventResponderInstance: ReactNativeEventResponderInstance,
  rootEventTypes: Array<string>,
): void {
  for (let i = 0; i < rootEventTypes.length; i++) {
    const rootEventType = rootEventTypes[i];
    registerRootEventType(rootEventType, eventResponderInstance);
  }
}
