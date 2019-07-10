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
  SimpleMemoComponent,
  ForwardRef,
} from 'shared/ReactWorkTags';
import type {EventPriority} from 'shared/ReactTypes';
import type {
  ReactDOMEventResponder,
  ReactDOMEventResponderInstance,
  ReactDOMResponderContext,
  ReactDOMResponderEvent,
  ReactDOMEventResponderHook,
} from 'shared/ReactDOMTypes';
import type {DOMTopLevelEventType} from 'events/TopLevelEventTypes';
import {
  batchedEventUpdates,
  discreteUpdates,
  flushDiscreteUpdatesIfNeeded,
} from 'events/ReactGenericBatching';
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

type EventObjectType = $Shape<PartialEventObject>;

type EventQueue = {
  events: Array<EventObjectType>,
  eventPriority: EventPriority,
};

type PartialEventObject = {
  target: Element | Document,
  type: string,
};

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
const rootEventTypesToEventComponentInstances: Map<
  DOMTopLevelEventType | string,
  Set<ReactDOMEventResponderInstance>,
> = new Map();
const ownershipChangeListeners: Set<ReactDOMEventResponderInstance> = new Set();
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
let currentInstance: null | ReactDOMEventResponderInstance = null;
let currentEventQueue: null | EventQueue = null;
let currentTimerIDCounter = 0;
let currentDocument: null | Document = null;

const eventResponderContext: ReactDOMResponderContext = {
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
  isTargetWithinResponder(target: Element | Document): boolean {
    validateResponderContext();
    if (target != null) {
      let fiber = getClosestInstanceFromNode(target);
      const currentFiber = ((currentInstance: any): ReactDOMEventResponderInstance)
        .currentFiber;

      while (fiber !== null) {
        if (fiber === currentFiber || fiber.alternate === currentFiber) {
          return true;
        }
        fiber = fiber.return;
      }
    }
    return false;
  },
  isTargetWithinResponderScope(target: Element | Document): boolean {
    validateResponderContext();

    if (target != null) {
      let fiber = getClosestInstanceFromNode(target);
      const currentFiber = ((currentInstance: any): ReactDOMEventResponderInstance)
        .currentFiber;
      while (fiber !== null) {
        if (fiber === currentFiber || fiber.alternate === currentFiber) {
          return true;
        }
        if (isFiberValidEventResponderNode(fiber)) {
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

    let node = childFiber;
    while (node !== null) {
      if (node === parentFiber) {
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
      let rootEventComponents = rootEventTypesToEventComponentInstances.get(
        rootEventType,
      );
      let rootEventTypesSet = ((currentInstance: any): ReactDOMEventResponderInstance)
        .rootEventTypes;
      if (rootEventTypesSet !== null) {
        rootEventTypesSet.delete(rootEventType);
      }
      if (rootEventComponents !== undefined) {
        rootEventComponents.delete(
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
    return releaseOwnershipForEventComponentInstance(
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
    let focusScopeFiber = ((eventResponderInstance.currentFiber: any): Fiber);
    if (deep) {
      let deepNode = focusScopeFiber;
      while (deepNode !== null) {
        if (isFiberValidEventResponderNode(deepNode)) {
          const eventHooks = ((deepNode: any).dependencies: any).events;
          for (let i = 0; i < eventHooks.length; i++) {
            if (eventHooks[i].responder === currentResponder) {
              focusScopeFiber = deepNode;
            }
          }
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
  isTargetWithinNodeOfType(
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
};

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

function getActiveDocument(): Document {
  return ((currentDocument: any): Document);
}

function releaseOwnershipForEventComponentInstance(
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

function createEventQueue(): EventQueue {
  return {
    events: [],
    eventPriority: ContinuousEvent,
  };
}

function processEvent(event: $Shape<PartialEventObject>): void {
  const type = event.type;
  const listener = ((eventListeners.get(event): any): (
    $Shape<PartialEventObject>,
  ) => void);
  invokeGuardedCallbackAndCatchFirstError(type, listener, undefined, event);
}

function processEvents(events: Array<EventObjectType>): void {
  for (let i = 0, length = events.length; i < length; i++) {
    processEvent(events[i]);
  }
}

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

function validateEventTargetTypesForResponder(
  eventType: string,
  responder: ReactDOMEventResponder,
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

function validateOwnership(
  eventResponderInstance: ReactDOMEventResponderInstance,
): boolean {
  return globalOwner === null || globalOwner === eventResponderInstance;
}

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
  // - Bubble target phase
  // - Root phase

  const capturedResponders = new Set();
  const responderEvent = createDOMResponderEvent(
    topLevelType,
    nativeEvent,
    nativeEventTarget,
    isPassiveEvent,
    isPassiveSupported,
  );

  let node = ((targetFiber: any): null | Fiber);
  while (node !== null) {
    const {dependencies} = node;
    if (isFiberValidEventResponderNode(node)) {
      const eventHooks = (((dependencies: any).events: any): Array<
        ReactDOMEventResponderHook,
      >);
      const localResponders = [];
      for (let i = 0; i < eventHooks.length; i++) {
        const {instance, ref} = eventHooks[i];
        const responderTarget = ref.current;
        node = ((((instance: any): ReactDOMEventResponderInstance)
          .currentFiber: any): Fiber);
        if (
          instance !== null &&
          responderTarget !== null &&
          validateOwnership(instance)
        ) {
          const responder = instance.responder;
          if (
            !capturedResponders.has(responder) &&
            validateEventTargetTypesForResponder(eventType, responder)
          ) {
            responderEvent.responderTarget = ((responderTarget: any):
              | Document
              | Element);
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

function triggerOwnershipListeners(): void {
  const listeningInstances = Array.from(ownershipChangeListeners);
  const previousInstance = currentInstance;
  currentEventQueue = createEventQueue();
  try {
    for (let i = 0; i < listeningInstances.length; i++) {
      const instance = listeningInstances[i];
      const {props, responder, state} = instance;
      currentInstance = instance;
      const onOwnershipChange = ((responder: any): ReactDOMEventResponder)
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

export function mountDOMEventResponder(
  eventResponderInstance: ReactDOMEventResponderInstance,
) {
  const responder = ((eventResponderInstance.responder: any): ReactDOMEventResponder);
  if (responder.onOwnershipChange !== undefined) {
    ownershipChangeListeners.add(eventResponderInstance);
  }
  const onMount = responder.onMount;
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

export function unmountDOMEventResponder(
  eventResponderInstance: ReactDOMEventResponderInstance,
): void {
  const responder = ((eventResponderInstance.responder: any): ReactDOMEventResponder);
  const onUnmount = responder.onUnmount;
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
  if (responder.onOwnershipChange !== undefined) {
    ownershipChangeListeners.delete(eventResponderInstance);
  }
  const rootEventTypesSet = eventResponderInstance.rootEventTypes;
  if (rootEventTypesSet !== null) {
    const rootEventTypes = Array.from(rootEventTypesSet);

    for (let i = 0; i < rootEventTypes.length; i++) {
      const topLevelEventType = rootEventTypes[i];
      let rootEventComponentInstances = rootEventTypesToEventComponentInstances.get(
        topLevelEventType,
      );
      if (rootEventComponentInstances !== undefined) {
        rootEventComponentInstances.delete(eventResponderInstance);
      }
    }
  }
}

function validateResponderContext(): void {
  invariant(
    currentEventQueue && currentInstance,
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
    currentTimers = null;
    currentEventQueue = createEventQueue();
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
    }
  }
}

export function addRootEventTypesForComponentInstance(
  eventResponderInstance: ReactDOMEventResponderInstance,
  rootEventTypes: Array<string>,
): void {
  for (let i = 0; i < rootEventTypes.length; i++) {
    const rootEventType = rootEventTypes[i];
    registerRootEventType(rootEventType, eventResponderInstance);
  }
}

function registerRootEventType(
  rootEventType: string,
  eventResponderInstance: ReactDOMEventResponderInstance,
): void {
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
