/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  EventComponent,
  HostComponent,
  FunctionComponent,
} from 'shared/ReactWorkTags';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import {
  batchedEventUpdates,
  discreteUpdates,
  flushDiscreteUpdatesIfNeeded,
} from 'events/ReactGenericBatching';
import type {
  ReactEventResponder,
  ReactEventComponentInstance,
} from 'shared/ReactTypes';
import type {
  ReactNativeEventResponderEventType,
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
  isHook: boolean,
  instance: ReactNativeEventComponentInstance,
  func: () => void,
  id: number,
  timeStamp: number,
|};

type EventQueue = {
  events: Array<EventObjectType>,
  eventPriority: EventPriority,
};

type ReactNativeEventResponder = ReactEventResponder<
  ReactNativeEventResponderEventType,
  ReactNativeResponderEvent,
  ReactNativeResponderContext,
>;

type ReactNativeEventComponentInstance = ReactEventComponentInstance<
  ReactNativeEventResponderEventType,
  ReactNativeResponderEvent,
  ReactNativeResponderContext,
>;

const {measureInWindow} = nativeFabricUIManager;

const activeTimeouts: Map<number, ResponderTimeout> = new Map();
const rootEventTypesToEventComponentInstances: Map<
  ReactNativeEventResponderEventType | string,
  Set<ReactNativeEventComponentInstance>,
> = new Map();
const targetEventTypeCached: Map<
  Array<ReactNativeEventResponderEventType>,
  Set<ReactNativeEventResponderEventType>,
> = new Map();
const ownershipChangeListeners: Set<
  ReactNativeEventComponentInstance,
> = new Set();
const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
const eventListeners:
  | WeakMap
  | Map<
      $Shape<PartialEventObject>,
      ($Shape<PartialEventObject>) => void,
    > = new PossiblyWeakMap();

let globalOwner = null;
let continueLocalPropagation = false;

let currentTimeStamp = 0;
let currentTimers = new Map();
let currentInstance: null | ReactNativeEventComponentInstance = null;
let currentEventQueue: null | EventQueue = null;
let currentTimerIDCounter = 0;
let currentlyInHook = false;

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
  addRootEventTypes(
    rootEventTypes: Array<ReactNativeEventResponderEventType>,
  ): void {
    validateResponderContext();
    for (let i = 0; i < rootEventTypes.length; i++) {
      const rootEventType = rootEventTypes[i];
      const eventComponentInstance = ((currentInstance: any): ReactNativeEventComponentInstance);
      registerRootEventType(rootEventType, eventComponentInstance);
    }
  },
  removeRootEventTypes(
    rootEventTypes: Array<ReactNativeEventResponderEventType>,
  ): void {
    validateResponderContext();
    for (let i = 0; i < rootEventTypes.length; i++) {
      const rootEventType = rootEventTypes[i];

      let rootEventComponents = rootEventTypesToEventComponentInstances.get(
        rootEventType,
      );
      let rootEventTypesSet = ((currentInstance: any): ReactNativeEventComponentInstance)
        .rootEventTypes;
      if (rootEventTypesSet !== null) {
        rootEventTypesSet.delete(rootEventType);
      }
      if (rootEventComponents !== undefined) {
        rootEventComponents.delete(
          ((currentInstance: any): ReactNativeEventComponentInstance),
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
      isHook: currentlyInHook,
      instance: ((currentInstance: any): ReactNativeEventComponentInstance),
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
      const {isHook, instance, func, id, timeStamp} = timersArr[i];
      currentInstance = instance;
      currentTimeStamp = timeStamp + delay;
      currentlyInHook = isHook;
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
  topLevelType: ReactNativeEventResponderEventType,
  nativeEvent: ReactFaricEvent,
  target: null | ReactNativeEventTarget,
): ReactNativeResponderEvent {
  return {
    currentTarget: target,
    nativeEvent,
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
  const previouslyInHook = currentlyInHook;
  currentEventQueue = createEventQueue();
  try {
    for (let i = 0; i < listeningInstances.length; i++) {
      const instance = listeningInstances[i];
      const {isHook, props, responder, state} = instance;
      currentInstance = instance;
      currentlyInHook = isHook;
      const onOwnershipChange = ((responder: any): ReactNativeEventResponder)
        .onOwnershipChange;
      if (onOwnershipChange !== undefined) {
        onOwnershipChange(eventResponderContext, props, state);
      }
    }
    processEventQueue();
  } finally {
    currentInstance = previousInstance;
    currentlyInHook = previouslyInHook;
  }
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
function releaseOwnershipForEventComponentInstance(
  eventComponentInstance: ReactNativeEventComponentInstance,
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

function getFabricTargetEventTypesSet(
  eventTypes: Array<ReactNativeEventResponderEventType>,
): Set<ReactNativeEventResponderEventType> {
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
function shouldSkipEventComponent(
  eventResponderInstance: ReactNativeEventComponentInstance,
  responder: ReactNativeEventResponder,
  propagatedEventResponders: null | Set<ReactNativeEventResponder>,
  isHook: boolean,
): boolean {
  if (propagatedEventResponders !== null && !isHook) {
    if (propagatedEventResponders.has(responder)) {
      return true;
    }
    propagatedEventResponders.add(responder);
  }
  if (globalOwner && globalOwner !== eventResponderInstance) {
    return true;
  }
  return false;
}

function checkForLocalPropagationContinuation(
  responder: ReactNativeEventResponder,
  propagatedEventResponders: Set<ReactNativeEventResponder>,
): void {
  if (continueLocalPropagation === true) {
    propagatedEventResponders.delete(responder);
    continueLocalPropagation = false;
  }
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
function handleTargetEventResponderInstance(
  topLevelType: ReactNativeEventResponderEventType,
  responderEvent: ReactNativeResponderEvent,
  eventComponentInstance: ReactNativeEventComponentInstance,
  hookComponentResponderValidation: null | Set<ReactNativeEventResponder>,
  propagatedEventResponders: null | Set<ReactNativeEventResponder>,
): void {
  const responder = eventComponentInstance.responder;
  const targetEventTypes = responder.targetEventTypes;
  // Validate the target event type exists on the responder
  if (targetEventTypes !== undefined) {
    const targetEventTypesSet = getFabricTargetEventTypesSet(targetEventTypes);
    if (targetEventTypesSet.has(topLevelType)) {
      if (hookComponentResponderValidation !== null) {
        hookComponentResponderValidation.add(responder);
      }
      const {isHook, props, state} = eventComponentInstance;
      const eventListener = responder.onEvent;
      if (eventListener !== undefined) {
        if (
          shouldSkipEventComponent(
            eventComponentInstance,
            ((responder: any): ReactNativeEventResponder),
            propagatedEventResponders,
            isHook,
          )
        ) {
          return;
        }
        currentInstance = eventComponentInstance;
        currentlyInHook = isHook;
        eventListener(responderEvent, eventResponderContext, props, state);
        if (!isHook) {
          checkForLocalPropagationContinuation(
            responder,
            ((propagatedEventResponders: any): Set<ReactNativeEventResponder>),
          );
        }
      }
    }
  }
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
function traverseAndHandleEventResponderInstances(
  topLevelType: ReactNativeEventResponderEventType,
  targetFiber: null | Fiber,
  nativeEvent: ReactFaricEvent,
): void {
  // Trigger event responders in this order:
  // - Bubble target phase
  // - Root phase

  const responderEvent = createFabricResponderEvent(
    topLevelType,
    nativeEvent,
    targetFiber !== null
      ? ((targetFiber.stateNode: any): ReactNativeEventTarget)
      : null,
  );
  const propagatedEventResponders: Set<ReactNativeEventResponder> = new Set();

  // We use this to know if we should check add hooks. If there are
  // no event targets, then we don't add the hook forms.
  const hookComponentResponderValidation = new Set();

  // Bubbled event phases have the notion of local propagation.
  // This means that the propgation chain can be stopped part of the the way
  // through processing event component instances.
  let node = targetFiber;
  while (node !== null) {
    const {dependencies, stateNode, tag} = node;
    if (tag === HostComponent) {
      responderEvent.currentTarget = stateNode;
    } else if (tag === EventComponent) {
      const eventComponentInstance = stateNode;
      // Switch to the current fiber tree
      node = eventComponentInstance.currentFiber;
      handleTargetEventResponderInstance(
        topLevelType,
        responderEvent,
        eventComponentInstance,
        hookComponentResponderValidation,
        propagatedEventResponders,
      );
    } else if (tag === FunctionComponent && dependencies !== null) {
      const events = dependencies.events;
      if (events !== null) {
        for (let i = 0; i < events.length; i++) {
          const eventComponentInstance = events[i];
          if (
            hookComponentResponderValidation.has(
              eventComponentInstance.responder,
            )
          ) {
            handleTargetEventResponderInstance(
              topLevelType,
              responderEvent,
              eventComponentInstance,
              null,
              null,
            );
          }
        }
      }
    }
    node = node.return;
  }
  // Reset currentTarget to be null
  responderEvent.currentTarget = null;
  // Root phase
  const rootEventInstances = rootEventTypesToEventComponentInstances.get(
    topLevelType,
  );
  if (rootEventInstances !== undefined) {
    const rootEventComponentInstances = Array.from(rootEventInstances);

    for (let i = 0; i < rootEventComponentInstances.length; i++) {
      const rootEventComponentInstance = rootEventComponentInstances[i];
      const {isHook, props, responder, state} = rootEventComponentInstance;
      const onRootEvent = responder.onRootEvent;
      if (onRootEvent !== undefined) {
        if (
          shouldSkipEventComponent(
            rootEventComponentInstance,
            responder,
            null,
            isHook,
          )
        ) {
          continue;
        }
        currentInstance = rootEventComponentInstance;
        currentlyInHook = isHook;
        onRootEvent(responderEvent, eventResponderContext, props, state);
      }
    }
  }
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
export function dispatchEventForResponderEventSystem(
  topLevelType: ReactNativeEventResponderEventType,
  targetFiber: null | Fiber,
  nativeEvent: ReactFaricEvent,
): void {
  const previousEventQueue = currentEventQueue;
  const previousInstance = currentInstance;
  const previousTimers = currentTimers;
  const previousTimeStamp = currentTimeStamp;
  const previouslyInHook = currentlyInHook;
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
    currentlyInHook = previouslyInHook;
  }
}

// TODO this function is almost an exact copy of the DOM version, we should
// somehow share the logic
export function mountEventResponder(
  eventComponentInstance: ReactNativeEventComponentInstance,
) {
  const responder = ((eventComponentInstance.responder: any): ReactNativeEventResponder);
  if (responder.onOwnershipChange !== undefined) {
    ownershipChangeListeners.add(eventComponentInstance);
  }
  const onMount = responder.onMount;
  if (onMount !== undefined) {
    let {isHook, props, state} = eventComponentInstance;
    currentEventQueue = createEventQueue();
    currentInstance = eventComponentInstance;
    currentlyInHook = isHook;
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
  eventComponentInstance: ReactNativeEventComponentInstance,
): void {
  const responder = ((eventComponentInstance.responder: any): ReactNativeEventResponder);
  const onUnmount = responder.onUnmount;
  if (onUnmount !== undefined) {
    let {isHook, props, state} = eventComponentInstance;
    currentEventQueue = createEventQueue();
    currentInstance = eventComponentInstance;
    currentlyInHook = isHook;
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
  rootEventType: ReactNativeEventResponderEventType,
  eventComponentInstance: ReactNativeEventComponentInstance,
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
  eventComponentInstance: ReactNativeEventComponentInstance,
  rootEventTypes: Array<ReactNativeEventResponderEventType>,
): void {
  for (let i = 0; i < rootEventTypes.length; i++) {
    const rootEventType = rootEventTypes[i];
    registerRootEventType(rootEventType, eventComponentInstance);
  }
}
