/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  FunctionComponent,
  SimpleMemoComponent,
  ForwardRef,
} from 'shared/ReactWorkTags';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import {
  batchedEventUpdates,
  discreteUpdates,
  flushDiscreteUpdatesIfNeeded,
} from 'events/ReactGenericBatching';
import type {
  ReactEventResponder,
  ReactEventResponderInstance,
  ReactEventResponderHook,
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

type ReactNativeEventResponder = ReactEventResponder<
  ReactNativeResponderEvent,
  ReactNativeResponderContext,
>;

type ReactNativeEventResponderInstance = ReactEventResponderInstance<
  ReactNativeResponderEvent,
  ReactNativeResponderContext,
>;

type ReactNativeEventResponderHook = ReactEventResponderHook<
  ReactNativeResponderEvent,
  ReactNativeResponderContext,
>;

const {measureInWindow} = nativeFabricUIManager;

const activeTimeouts: Map<number, ResponderTimeout> = new Map();
const rootEventTypesToEventComponentInstances: Map<
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
      const eventComponentInstance = ((currentInstance: any): ReactNativeEventResponderInstance);
      registerRootEventType(rootEventType, eventComponentInstance);
    }
  },
  removeRootEventTypes(rootEventTypes: Array<string>): void {
    validateResponderContext();
    for (let i = 0; i < rootEventTypes.length; i++) {
      const rootEventType = rootEventTypes[i];

      let rootEventComponents = rootEventTypesToEventComponentInstances.get(
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
    currentTarget: target,
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
      const {props, responder, state} = instance;
      currentInstance = instance;
      const onOwnershipChange = ((responder: any): ReactNativeEventResponder)
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
  eventComponentInstance: ReactNativeEventResponderInstance,
): boolean {
  if (globalOwner === eventComponentInstance) {
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
function validateEventTargetTypesForResponder(
  eventType: string,
  responder: ReactNativeEventResponder,
): boolean {
  const targetEventTypes = responder.targetEventTypes;
  // Validate the target event type exists on the responder
  if (targetEventTypes !== undefined) {
    for (let i = 0, len = targetEventTypes.length; i < len; i++) {
      if (targetEventTypes[i] === eventType) {
        return true;
      }
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
function isFiberValidEventResponderNode(fiber: Fiber): boolean {
  const {dependencies, tag} = fiber;

  if (
    (tag === FunctionComponent ||
      tag === ForwardRef ||
      tag === SimpleMemoComponent) &&
    dependencies !== null
  ) {
    const eventHooks = dependencies.events;
    if (eventHooks !== null) {
      return true;
    }
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

  const capturedResponders = new Set();
  const responderEvent = createFabricResponderEvent(
    eventType,
    nativeEvent,
    targetFiber !== null
      ? ((targetFiber.stateNode: any): ReactNativeEventTarget)
      : null,
  );

  let node = ((targetFiber: any): null | Fiber);
  while (node !== null) {
    const {dependencies} = node;
    if (isFiberValidEventResponderNode(node)) {
      const eventHooks = (((dependencies: any).events: any): Array<
        ReactNativeEventResponderHook,
      >);
      const localResponders = [];
      for (let i = 0; i < eventHooks.length; i++) {
        const {instance, ref} = eventHooks[i];
        const hasResponderTarget = ref !== null;
        const responderTarget = hasResponderTarget ? (ref: any).current : null;
        node = ((((instance: any): ReactNativeEventResponderInstance)
          .currentFiber: any): Fiber);
        if (
          instance !== null &&
          (!hasResponderTarget || responderTarget !== null) &&
          validateOwnership(instance)
        ) {
          const responder = instance.responder;
          if (
            !capturedResponders.has(responder) &&
            validateEventTargetTypesForResponder(eventType, responder)
          ) {
            responderEvent.responderTarget = ((responderTarget: any): ReactNativeEventTarget);
            localResponders.push(responder);
            const {props, state} = instance;
            const onEvent = responder.onEvent;
            if (onEvent !== undefined) {
              currentInstance = instance;
              onEvent(responderEvent, eventResponderContext, props, state);
            }
          }
        }
      }
      for (let i = 0; i < localResponders.length; i++) {
        capturedResponders.add(localResponders[i]);
      }
    }
    node = node.return;
  }
  // Root phase
  const rootEventInstances = rootEventTypesToEventComponentInstances.get(
    eventType,
  );
  if (rootEventInstances !== undefined) {
    const rootEventComponentInstances = Array.from(rootEventInstances);

    for (let i = 0; i < rootEventComponentInstances.length; i++) {
      const rootEventComponentInstance = rootEventComponentInstances[i];
      if (!validateOwnership(rootEventComponentInstance)) {
        continue;
      }
      const {props, responder, state} = rootEventComponentInstance;
      const onRootEvent = responder.onRootEvent;
      if (onRootEvent !== undefined) {
        currentInstance = rootEventComponentInstance;
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
  eventComponentInstance: ReactNativeEventResponderInstance,
) {
  const responder = ((eventComponentInstance.responder: any): ReactNativeEventResponder);
  if (responder.onOwnershipChange !== undefined) {
    ownershipChangeListeners.add(eventComponentInstance);
  }
  const onMount = responder.onMount;
  if (onMount !== undefined) {
    let {props, state} = eventComponentInstance;
    currentEventQueue = createEventQueue();
    currentInstance = eventComponentInstance;
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
  eventComponentInstance: ReactNativeEventResponderInstance,
): void {
  const responder = ((eventComponentInstance.responder: any): ReactNativeEventResponder);
  const onUnmount = responder.onUnmount;
  if (onUnmount !== undefined) {
    let {props, state} = eventComponentInstance;
    currentEventQueue = createEventQueue();
    currentInstance = eventComponentInstance;
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
    releaseOwnershipForEventComponentInstance(eventComponentInstance);
    processEventQueue();
  } finally {
    currentEventQueue = null;
  }
  if (responder.onOwnershipChange !== undefined) {
    ownershipChangeListeners.delete(eventComponentInstance);
  }
  const rootEventTypesSet = eventComponentInstance.rootEventTypes;
  if (rootEventTypesSet !== null) {
    const rootEventTypes = Array.from(rootEventTypesSet);

    for (let i = 0; i < rootEventTypes.length; i++) {
      const topLevelEventType = rootEventTypes[i];
      let rootEventComponentInstances = rootEventTypesToEventComponentInstances.get(
        topLevelEventType,
      );
      if (rootEventComponentInstances !== undefined) {
        rootEventComponentInstances.delete(eventComponentInstance);
      }
    }
  }
}

function registerRootEventType(
  rootEventType: string,
  eventComponentInstance: ReactNativeEventResponderInstance,
) {
  let rootEventComponentInstances = rootEventTypesToEventComponentInstances.get(
    rootEventType,
  );
  if (rootEventComponentInstances === undefined) {
    rootEventComponentInstances = new Set();
    rootEventTypesToEventComponentInstances.set(
      rootEventType,
      rootEventComponentInstances,
    );
  }
  let rootEventTypesSet = eventComponentInstance.rootEventTypes;
  if (rootEventTypesSet === null) {
    rootEventTypesSet = eventComponentInstance.rootEventTypes = new Set();
  }
  invariant(
    !rootEventTypesSet.has(rootEventType),
    'addRootEventTypes() found a duplicate root event ' +
      'type of "%s". This might be because the event type exists in the event responder "rootEventTypes" ' +
      'array or because of a previous addRootEventTypes() using this root event type.',
    rootEventType,
  );
  rootEventTypesSet.add(rootEventType);
  rootEventComponentInstances.add(eventComponentInstance);
}

export function addRootEventTypesForComponentInstance(
  eventComponentInstance: ReactNativeEventResponderInstance,
  rootEventTypes: Array<string>,
): void {
  for (let i = 0; i < rootEventTypes.length; i++) {
    const rootEventType = rootEventTypes[i];
    registerRootEventType(rootEventType, eventComponentInstance);
  }
}
