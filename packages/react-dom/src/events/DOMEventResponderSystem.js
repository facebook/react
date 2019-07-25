/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

import {
  type EventSystemFlags,
  IS_PASSIVE,
  PASSIVE_NOT_SUPPORTED,
} from 'events/EventSystemFlags';
import type {AnyNativeEvent} from 'events/PluginModuleType';
import {
  HostComponent,
  FunctionComponent,
  MemoComponent,
  ForwardRef,
} from 'shared/ReactWorkTags';
import type {EventPriority} from 'shared/ReactTypes';
import type {
  ReactDOMEventResponder,
  ReactDOMEventResponderInstance,
  ReactDOMResponderContext,
  ReactDOMResponderEvent,
} from 'shared/ReactDOMTypes';
import type {DOMTopLevelEventType} from 'events/TopLevelEventTypes';
import {
  batchedEventUpdates,
  discreteUpdates,
  flushDiscreteUpdatesIfNeeded,
} from 'events/ReactGenericBatching';
import {enqueueStateRestore} from 'events/ReactControlledComponent';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import warning from 'shared/warning';
import {enableFlareAPI} from 'shared/ReactFeatureFlags';
import {invokeGuardedCallbackAndCatchFirstError} from 'shared/ReactErrorUtils';
import invariant from 'shared/invariant';
import {
  isFiberSuspenseAndTimedOut,
  getSuspenseFallbackChild,
} from 'react-reconciler/src/ReactFiberEvents';

import {getClosestInstanceFromNode} from '../client/ReactDOMComponentTree';
import {
  ContinuousEvent,
  UserBlockingEvent,
  DiscreteEvent,
} from 'shared/ReactTypes';
import {enableUserBlockingEvents} from 'shared/ReactFeatureFlags';

// Intentionally not named imports because Rollup would use dynamic dispatch for
// CommonJS interop named imports.
import * as Scheduler from 'scheduler';
const {
  unstable_UserBlockingPriority: UserBlockingPriority,
  unstable_runWithPriority: runWithPriority,
} = Scheduler;

export let listenToResponderEventTypesImpl;

export function setListenToResponderEventTypes(
  _listenToResponderEventTypesImpl: Function,
) {
  listenToResponderEventTypesImpl = _listenToResponderEventTypesImpl;
}

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
  instance: ReactDOMEventResponderInstance,
  func: () => void,
  id: number,
  timeStamp: number,
|};

const activeTimeouts: Map<number, ResponderTimeout> = new Map();
const rootEventTypesToEventResponderInstances: Map<
  DOMTopLevelEventType | string,
  Set<ReactDOMEventResponderInstance>,
> = new Map();
const ownershipChangeListeners: Set<ReactDOMEventResponderInstance> = new Set();

let globalOwner = null;

let currentTimeStamp = 0;
let currentTimers = new Map();
let currentInstance: null | ReactDOMEventResponderInstance = null;
let currentEventQueue: null | EventQueue = null;
let currentEventQueuePriority: EventPriority = ContinuousEvent;
let currentTimerIDCounter = 0;
let currentDocument: null | Document = null;

const eventResponderContext: ReactDOMResponderContext = {
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
    const responderInstance = ((currentInstance: any): ReactDOMEventResponderInstance);
    const target = responderInstance.fiber;
    const responder = responderInstance.responder;
    const listeners = collectListeners(eventProp, responder, target);
    if (listeners.length !== 0) {
      ((currentEventQueue: any): EventQueue).push(
        createEventQueueItem(eventValue, listeners),
      );
    }
  },
  isTargetWithinResponder(target: Element | Document): boolean {
    validateResponderContext();
    if (target != null) {
      let fiber = getClosestInstanceFromNode(target);
      const responderFiber = ((currentInstance: any): ReactDOMEventResponderInstance)
        .fiber;

      while (fiber !== null) {
        if (fiber === responderFiber || fiber.alternate === responderFiber) {
          return true;
        }
        fiber = fiber.return;
      }
    }
    return false;
  },
  isTargetWithinResponderScope(target: Element | Document): boolean {
    validateResponderContext();
    const componentInstance = ((currentInstance: any): ReactDOMEventResponderInstance);
    const responder = componentInstance.responder;

    if (target != null) {
      let fiber = getClosestInstanceFromNode(target);
      const responderFiber = ((currentInstance: any): ReactDOMEventResponderInstance)
        .fiber;

      while (fiber !== null) {
        if (fiber === responderFiber || fiber.alternate === responderFiber) {
          return true;
        }
        if (doesFiberHaveResponder(fiber, responder)) {
          return false;
        }
        fiber = fiber.return;
      }
    }
    return false;
  },
  isTargetWithinNode(
    childTarget: Element | Document,
    parentTarget: Element | Document,
  ): boolean {
    validateResponderContext();
    const childFiber = getClosestInstanceFromNode(childTarget);
    const parentFiber = getClosestInstanceFromNode(parentTarget);
    const parentAlternateFiber = parentFiber.alternate;

    let node = childFiber;
    while (node !== null) {
      if (node === parentFiber || node === parentAlternateFiber) {
        return true;
      }
      node = node.return;
    }
    return false;
  },
  addRootEventTypes(rootEventTypes: Array<string>): void {
    validateResponderContext();
    const activeDocument = getActiveDocument();
    listenToResponderEventTypesImpl(rootEventTypes, activeDocument);
    for (let i = 0; i < rootEventTypes.length; i++) {
      const rootEventType = rootEventTypes[i];
      const eventResponderInstance = ((currentInstance: any): ReactDOMEventResponderInstance);
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
      let rootEventTypesSet = ((currentInstance: any): ReactDOMEventResponderInstance)
        .rootEventTypes;
      if (rootEventTypesSet !== null) {
        rootEventTypesSet.delete(rootEventType);
      }
      if (rootEventResponders !== undefined) {
        rootEventResponders.delete(
          ((currentInstance: any): ReactDOMEventResponderInstance),
        );
      }
    }
  },
  hasOwnership(): boolean {
    validateResponderContext();
    return globalOwner === currentInstance;
  },
  requestGlobalOwnership(): boolean {
    validateResponderContext();
    if (globalOwner !== null) {
      return false;
    }
    globalOwner = currentInstance;
    triggerOwnershipListeners();
    return true;
  },
  releaseOwnership(): boolean {
    validateResponderContext();
    return releaseOwnershipForEventResponderInstance(
      ((currentInstance: any): ReactDOMEventResponderInstance),
    );
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
      instance: ((currentInstance: any): ReactDOMEventResponderInstance),
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
  getFocusableElementsInScope(deep: boolean): Array<HTMLElement> {
    validateResponderContext();
    const focusableElements = [];
    const eventResponderInstance = ((currentInstance: any): ReactDOMEventResponderInstance);
    const currentResponder = eventResponderInstance.responder;
    let focusScopeFiber = eventResponderInstance.fiber;
    if (deep) {
      let deepNode = focusScopeFiber.return;
      while (deepNode !== null) {
        if (doesFiberHaveResponder(deepNode, currentResponder)) {
          focusScopeFiber = deepNode;
        }
        deepNode = deepNode.return;
      }
    }
    const child = focusScopeFiber.child;

    if (child !== null) {
      collectFocusableElements(child, focusableElements);
    }
    return focusableElements;
  },
  getActiveDocument,
  objectAssign: Object.assign,
  getTimeStamp(): number {
    validateResponderContext();
    return currentTimeStamp;
  },
  isTargetWithinHostComponent(
    target: Element | Document,
    elementType: string,
  ): boolean {
    validateResponderContext();
    let fiber = getClosestInstanceFromNode(target);

    while (fiber !== null) {
      if (fiber.tag === HostComponent && fiber.type === elementType) {
        return true;
      }
      fiber = fiber.return;
    }
    return false;
  },
  enqueueStateRestore,
};

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

function collectFocusableElements(
  node: Fiber,
  focusableElements: Array<HTMLElement>,
): void {
  if (isFiberSuspenseAndTimedOut(node)) {
    const fallbackChild = getSuspenseFallbackChild(node);
    if (fallbackChild !== null) {
      collectFocusableElements(fallbackChild, focusableElements);
    }
  } else {
    if (isFiberHostComponentFocusable(node)) {
      focusableElements.push(node.stateNode);
    } else {
      const child = node.child;

      if (child !== null) {
        collectFocusableElements(child, focusableElements);
      }
    }
  }
  const sibling = node.sibling;

  if (sibling !== null) {
    collectFocusableElements(sibling, focusableElements);
  }
}

function createEventQueueItem(
  value: any,
  listeners: Array<(val: any) => void>,
): EventQueueItem {
  return {
    value,
    listeners,
  };
}

function doesFiberHaveResponder(
  fiber: Fiber,
  responder: ReactDOMEventResponder,
): boolean {
  if (fiber.tag === HostComponent) {
    const dependencies = fiber.dependencies;
    if (dependencies !== null) {
      const respondersMap = dependencies.responders;
      if (respondersMap !== null && respondersMap.has(responder)) {
        return true;
      }
    }
  }
  return false;
}

function getActiveDocument(): Document {
  return ((currentDocument: any): Document);
}

function releaseOwnershipForEventResponderInstance(
  eventResponderInstance: ReactDOMEventResponderInstance,
): boolean {
  if (globalOwner === eventResponderInstance) {
    globalOwner = null;
    triggerOwnershipListeners();
    return true;
  }
  return false;
}

function isFiberHostComponentFocusable(fiber: Fiber): boolean {
  if (fiber.tag !== HostComponent) {
    return false;
  }
  const {type, memoizedProps} = fiber;
  if (memoizedProps.tabIndex === -1 || memoizedProps.disabled) {
    return false;
  }
  if (memoizedProps.tabIndex === 0 || memoizedProps.contentEditable === true) {
    return true;
  }
  if (type === 'a' || type === 'area') {
    return !!memoizedProps.href && memoizedProps.rel !== 'ignore';
  }
  if (type === 'input') {
    return memoizedProps.type !== 'hidden' && memoizedProps.type !== 'file';
  }
  return (
    type === 'button' ||
    type === 'textarea' ||
    type === 'object' ||
    type === 'select' ||
    type === 'iframe' ||
    type === 'embed'
  );
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

function createDOMResponderEvent(
  topLevelType: string,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: Element | Document,
  passive: boolean,
  passiveSupported: boolean,
): ReactDOMResponderEvent {
  const {pointerType} = (nativeEvent: any);
  let eventPointerType = '';
  let pointerId = null;

  if (pointerType !== undefined) {
    eventPointerType = pointerType;
    pointerId = (nativeEvent: any).pointerId;
  } else if (nativeEvent.key !== undefined) {
    eventPointerType = 'keyboard';
  } else if (nativeEvent.button !== undefined) {
    eventPointerType = 'mouse';
  } else if ((nativeEvent: any).changedTouches !== undefined) {
    eventPointerType = 'touch';
  }

  return {
    nativeEvent: nativeEvent,
    passive,
    passiveSupported,
    pointerId,
    pointerType: eventPointerType,
    responderTarget: null,
    target: nativeEventTarget,
    type: topLevelType,
  };
}

function collectListeners(
  eventProp: string,
  eventResponder: ReactDOMEventResponder,
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
  responder: ReactDOMEventResponder,
): boolean {
  const {targetEventTypes} = responder;
  // Validate the target event type exists on the responder
  if (targetEventTypes !== null) {
    return responderEventTypesContainType(targetEventTypes, eventType);
  }
  return false;
}

function validateOwnership(
  responderInstance: ReactDOMEventResponderInstance,
): boolean {
  return globalOwner === null || globalOwner === responderInstance;
}

function traverseAndHandleEventResponderInstances(
  topLevelType: string,
  targetFiber: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: Document | Element,
  eventSystemFlags: EventSystemFlags,
): void {
  const isPassiveEvent = (eventSystemFlags & IS_PASSIVE) !== 0;
  const isPassiveSupported = (eventSystemFlags & PASSIVE_NOT_SUPPORTED) === 0;
  const isPassive = isPassiveEvent || !isPassiveSupported;
  const eventType = isPassive ? topLevelType : topLevelType + '_active';

  // Trigger event responders in this order:
  // - Bubble target responder phase
  // - Root responder phase

  const responderEvent = createDOMResponderEvent(
    topLevelType,
    nativeEvent,
    nativeEventTarget,
    isPassiveEvent,
    isPassiveSupported,
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
                responderEvent.responderTarget = ((target: any):
                  | Element
                  | Document);
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
        responderEvent.responderTarget = ((target: any): Element | Document);
        onRootEvent(responderEvent, eventResponderContext, props, state);
      }
    }
  }
}

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
      const onOwnershipChange = ((responder: any): ReactDOMEventResponder)
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

export function mountEventResponder(
  responder: ReactDOMEventResponder,
  responderInstance: ReactDOMEventResponderInstance,
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

export function unmountEventResponder(
  responderInstance: ReactDOMEventResponderInstance,
): void {
  const responder = ((responderInstance.responder: any): ReactDOMEventResponder);
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

function validateResponderContext(): void {
  invariant(
    currentInstance !== null,
    'An event responder context was used outside of an event cycle. ' +
      'Use context.setTimeout() to use asynchronous responder context outside of event cycle .',
  );
}

export function dispatchEventForResponderEventSystem(
  topLevelType: string,
  targetFiber: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: Document | Element,
  eventSystemFlags: EventSystemFlags,
): void {
  if (enableFlareAPI) {
    const previousEventQueue = currentEventQueue;
    const previousInstance = currentInstance;
    const previousTimers = currentTimers;
    const previousTimeStamp = currentTimeStamp;
    const previousDocument = currentDocument;
    const previousEventQueuePriority = currentEventQueuePriority;
    currentTimers = null;
    currentEventQueue = [];
    currentEventQueuePriority = ContinuousEvent;
    // nodeType 9 is DOCUMENT_NODE
    currentDocument =
      (nativeEventTarget: any).nodeType === 9
        ? ((nativeEventTarget: any): Document)
        : (nativeEventTarget: any).ownerDocument;
    // We might want to control timeStamp another way here
    currentTimeStamp = (nativeEvent: any).timeStamp;
    try {
      traverseAndHandleEventResponderInstances(
        topLevelType,
        targetFiber,
        nativeEvent,
        nativeEventTarget,
        eventSystemFlags,
      );
      processEventQueue();
    } finally {
      currentTimers = previousTimers;
      currentInstance = previousInstance;
      currentEventQueue = previousEventQueue;
      currentTimeStamp = previousTimeStamp;
      currentDocument = previousDocument;
      currentEventQueuePriority = previousEventQueuePriority;
    }
  }
}

export function addRootEventTypesForResponderInstance(
  responderInstance: ReactDOMEventResponderInstance,
  rootEventTypes: Array<string>,
): void {
  for (let i = 0; i < rootEventTypes.length; i++) {
    const rootEventType = rootEventTypes[i];
    registerRootEventType(rootEventType, responderInstance);
  }
}

function registerRootEventType(
  rootEventType: string,
  eventResponderInstance: ReactDOMEventResponderInstance,
): void {
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
  rootEventResponderInstances.add(eventResponderInstance);
}
