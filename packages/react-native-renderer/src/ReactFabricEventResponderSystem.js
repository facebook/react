/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  HostComponent,
  FunctionComponent,
  MemoComponent,
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

type EventQueueItem = {|
  listeners: Array<(val: any) => void>,
  value: any,
|};
type EventQueue = Array<EventQueueItem>;

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

type ReactNativeEventResponder = ReactEventResponder<
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

let globalOwner = null;

let currentTimeStamp = 0;
let currentTimers = new Map();
let currentInstance: null | ReactNativeEventResponderInstance = null;
let currentEventQueue: null | EventQueue = null;
let currentEventQueuePriority: EventPriority = ContinuousEvent;
let currentTimerIDCounter = 0;

const eventResponderContext: ReactNativeResponderContext = {
  dispatchEvent(
    eventProp: string,
    eventValue: any,
    eventPriority: EventPriority,
  ): void {
    validateResponderContext();
    validateEventValue(eventValue);
    if (eventPriority < currentEventQueuePriority) {
      currentEventQueuePriority = eventPriority;
    }
    const responderInstance = ((currentInstance: any): ReactNativeEventResponderInstance);
    const target = responderInstance.fiber;
    const responder = responderInstance.responder;
    const listeners = collectListeners(eventProp, responder, target);
    if (listeners.length !== 0) {
      ((currentEventQueue: any): EventQueue).push(
        createEventQueueItem(eventValue, listeners),
      );
    }
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

      let rootEventResponders = rootEventTypesToEventResponderInstances.get(
        rootEventType,
      );
      let rootEventTypesSet = ((currentInstance: any): ReactNativeEventResponderInstance)
        .rootEventTypes;
      if (rootEventTypesSet !== null) {
        rootEventTypesSet.delete(rootEventType);
      }
      if (rootEventResponders !== undefined) {
        rootEventResponders.delete(
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

function createEventQueueItem(
  value: any,
  listeners: Array<(val: any) => void>,
): EventQueueItem {
  return {
    value,
    listeners,
  };
}

function validateEventValue(eventValue: any): void {
  if (typeof eventValue === 'object' && eventValue !== null) {
    const {target, type, timeStamp} = eventValue;

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
    eventValue.preventDefault = () => {
      if (__DEV__) {
        showWarning('preventDefault()');
      }
    };
    eventValue.stopPropagation = () => {
      if (__DEV__) {
        showWarning('stopPropagation()');
      }
    };
    eventValue.isDefaultPrevented = () => {
      if (__DEV__) {
        showWarning('isDefaultPrevented()');
      }
    };
    eventValue.isPropagationStopped = () => {
      if (__DEV__) {
        showWarning('isPropagationStopped()');
      }
    };
    // $FlowFixMe: we don't need value, Flow thinks we do
    Object.defineProperty(eventValue, 'nativeEvent', {
      get() {
        if (__DEV__) {
          showWarning('nativeEvent');
        }
      },
    });
  }
}

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
  currentEventQueuePriority = ContinuousEvent;
  try {
    for (let i = 0; i < timersArr.length; i++) {
      const {instance, func, id, timeStamp} = timersArr[i];
      currentInstance = instance;
      currentEventQueue = [];
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
    responderTarget: target,
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
function processEventQueue(): void {
  const eventQueue = ((currentEventQueue: any): EventQueue);
  if (eventQueue.length === 0) {
    return;
  }
  switch (currentEventQueuePriority) {
    case DiscreteEvent: {
      flushDiscreteUpdatesIfNeeded(currentTimeStamp);
      discreteUpdates(() => {
        batchedEventUpdates(processEvents, eventQueue);
      });
      break;
    }
    case UserBlockingEvent: {
      if (enableUserBlockingEvents) {
        runWithPriority(
          UserBlockingPriority,
          batchedEventUpdates.bind(null, processEvents, eventQueue),
        );
      } else {
        batchedEventUpdates(processEvents, eventQueue);
      }
      break;
    }
    case ContinuousEvent: {
      batchedEventUpdates(processEvents, eventQueue);
      break;
    }
  }
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
function releaseOwnershipForEventResponderInstance(
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
function collectListeners(
  eventProp: string,
  eventResponder: ReactNativeEventResponder,
  target: Fiber,
): Array<(any) => void> {
  const eventListeners = [];
  let node = target.return;
  nodeTraversal: while (node !== null) {
    switch (node.tag) {
      case HostComponent: {
        const dependencies = node.dependencies;

        if (dependencies !== null) {
          const respondersMap = dependencies.responders;

          if (respondersMap !== null && respondersMap.has(eventResponder)) {
            break nodeTraversal;
          }
        }
        break;
      }
      case FunctionComponent:
      case MemoComponent:
      case ForwardRef: {
        const dependencies = node.dependencies;

        if (dependencies !== null) {
          const listeners = dependencies.listeners;

          if (listeners !== null) {
            for (
              let s = 0, listenersLength = listeners.length;
              s < listenersLength;
              s++
            ) {
              const listener = listeners[s];
              const {responder, props} = listener;
              const listenerFunc = props[eventProp];

              if (
                responder === eventResponder &&
                typeof listenerFunc === 'function'
              ) {
                eventListeners.push(listenerFunc);
              }
            }
          }
        }
      }
    }
    node = node.return;
  }
  return eventListeners;
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
function processEvents(eventQueue: EventQueue): void {
  for (let i = 0, length = eventQueue.length; i < length; i++) {
    const {value, listeners} = eventQueue[i];
    for (let s = 0, length2 = listeners.length; s < length2; s++) {
      const listener = listeners[s];
      const type =
        typeof value === 'object' && value !== null ? value.type : '';
      invokeGuardedCallbackAndCatchFirstError(type, listener, undefined, value);
    }
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

function validateResponderTargetEventTypes(
  eventType: string,
  responder: ReactNativeEventResponder,
): boolean {
  const {targetEventTypes} = responder;
  // Validate the target event type exists on the responder
  if (targetEventTypes !== null) {
    return responderEventTypesContainType(targetEventTypes, eventType);
  }
  return false;
}

function validateOwnership(
  responderInstance: ReactNativeEventResponderInstance,
): boolean {
  return globalOwner === null || globalOwner === responderInstance;
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
function traverseAndHandleEventResponderInstances(
  eventType: string,
  targetFiber: null | Fiber,
  nativeEvent: ReactFaricEvent,
): void {
  // Trigger event responders in this order:
  // - Bubble target responder phase
  // - Root responder phase

  const responderEvent = createFabricResponderEvent(
    eventType,
    nativeEvent,
    targetFiber !== null
      ? ((targetFiber.stateNode: any): ReactNativeEventTarget)
      : null,
  );
  const visitedResponders = new Set();
  let node = targetFiber;
  while (node !== null) {
    const {dependencies, tag} = node;
    if (tag === HostComponent && dependencies !== null) {
      const respondersMap = dependencies.responders;
      if (respondersMap !== null) {
        const responderInstances = Array.from(respondersMap.values());
        for (let i = 0, length = responderInstances.length; i < length; i++) {
          const responderInstance = responderInstances[i];

          if (validateOwnership(responderInstance)) {
            const {props, responder, state, target} = responderInstance;
            if (
              !visitedResponders.has(responder) &&
              validateResponderTargetEventTypes(eventType, responder)
            ) {
              const onEvent = responder.onEvent;
              visitedResponders.add(responder);
              if (onEvent !== null) {
                currentInstance = responderInstance;
                responderEvent.responderTarget = ((target: any): ReactNativeEventTarget);
                onEvent(responderEvent, eventResponderContext, props, state);
              }
            }
          }
        }
      }
    }
    node = node.return;
  }
  // Root phase
  const rootEventResponderInstances = rootEventTypesToEventResponderInstances.get(
    eventType,
  );
  if (rootEventResponderInstances !== undefined) {
    const responderInstances = Array.from(rootEventResponderInstances);

    for (let i = 0; i < responderInstances.length; i++) {
      const responderInstance = responderInstances[i];
      if (!validateOwnership(responderInstance)) {
        continue;
      }
      const {props, responder, state, target} = responderInstance;
      const onRootEvent = responder.onRootEvent;
      if (onRootEvent !== null) {
        currentInstance = responderInstance;
        responderEvent.responderTarget = ((target: any): ReactNativeEventTarget);
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
  const previousEventQueuePriority = currentEventQueuePriority;
  currentTimers = null;
  currentEventQueue = [];
  currentEventQueuePriority = ContinuousEvent;
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
    currentEventQueuePriority = previousEventQueuePriority;
  }
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
function triggerOwnershipListeners(): void {
  const listeningInstances = Array.from(ownershipChangeListeners);
  const previousInstance = currentInstance;
  const previousEventQueuePriority = currentEventQueuePriority;
  const previousEventQueue = currentEventQueue;
  try {
    for (let i = 0; i < listeningInstances.length; i++) {
      const instance = listeningInstances[i];
      const {props, responder, state} = instance;
      currentInstance = instance;
      currentEventQueuePriority = ContinuousEvent;
      currentEventQueue = [];
      const onOwnershipChange = ((responder: any): ReactNativeEventResponder)
        .onOwnershipChange;
      if (onOwnershipChange !== null) {
        onOwnershipChange(eventResponderContext, props, state);
      }
    }
    processEventQueue();
  } finally {
    currentInstance = previousInstance;
    currentEventQueue = previousEventQueue;
    currentEventQueuePriority = previousEventQueuePriority;
  }
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
export function mountEventResponder(
  responder: ReactNativeEventResponder,
  responderInstance: ReactNativeEventResponderInstance,
  props: Object,
  state: Object,
) {
  if (responder.onOwnershipChange !== null) {
    ownershipChangeListeners.add(responderInstance);
  }
  const onMount = responder.onMount;
  if (onMount !== null) {
    currentEventQueuePriority = ContinuousEvent;
    currentInstance = responderInstance;
    currentEventQueue = [];
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
export function unmountEventResponder(
  responderInstance: ReactNativeEventResponderInstance,
): void {
  const responder = ((responderInstance.responder: any): ReactNativeEventResponder);
  const onUnmount = responder.onUnmount;
  if (onUnmount !== null) {
    let {props, state} = responderInstance;
    currentEventQueue = [];
    currentEventQueuePriority = ContinuousEvent;
    currentInstance = responderInstance;
    try {
      onUnmount(eventResponderContext, props, state);
      processEventQueue();
    } finally {
      currentEventQueue = null;
      currentInstance = null;
      currentTimers = null;
    }
  }
  releaseOwnershipForEventResponderInstance(responderInstance);
  if (responder.onOwnershipChange !== null) {
    ownershipChangeListeners.delete(responderInstance);
  }
  const rootEventTypesSet = responderInstance.rootEventTypes;
  if (rootEventTypesSet !== null) {
    const rootEventTypes = Array.from(rootEventTypesSet);

    for (let i = 0; i < rootEventTypes.length; i++) {
      const topLevelEventType = rootEventTypes[i];
      let rootEventResponderInstances = rootEventTypesToEventResponderInstances.get(
        topLevelEventType,
      );
      if (rootEventResponderInstances !== undefined) {
        rootEventResponderInstances.delete(responderInstance);
      }
    }
  }
}

function registerRootEventType(
  rootEventType: string,
  responderInstance: ReactNativeEventResponderInstance,
) {
  let rootEventResponderInstances = rootEventTypesToEventResponderInstances.get(
    rootEventType,
  );
  if (rootEventResponderInstances === undefined) {
    rootEventResponderInstances = new Set();
    rootEventTypesToEventResponderInstances.set(
      rootEventType,
      rootEventResponderInstances,
    );
  }
  let rootEventTypesSet = responderInstance.rootEventTypes;
  if (rootEventTypesSet === null) {
    rootEventTypesSet = responderInstance.rootEventTypes = new Set();
  }
  invariant(
    !rootEventTypesSet.has(rootEventType),
    'addRootEventTypes() found a duplicate root event ' +
      'type of "%s". This might be because the event type exists in the event responder "rootEventTypes" ' +
      'array or because of a previous addRootEventTypes() using this root event type.',
    rootEventType,
  );
  rootEventTypesSet.add(rootEventType);
  rootEventResponderInstances.add(responderInstance);
}

export function addRootEventTypesForResponderInstance(
  responderInstance: ReactNativeEventResponderInstance,
  rootEventTypes: Array<string>,
): void {
  for (let i = 0; i < rootEventTypes.length; i++) {
    const rootEventType = rootEventTypes[i];
    registerRootEventType(rootEventType, responderInstance);
  }
}
