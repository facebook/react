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
  EventComponent,
  HostComponent,
  FunctionComponent,
} from 'shared/ReactWorkTags';
import type {EventPriority} from 'shared/ReactTypes';
import type {
  ReactDOMEventResponder,
  ReactDOMEventComponentInstance,
  ReactDOMEventResponderEventType,
  ReactDOMResponderContext,
  ReactDOMResponderEvent,
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
  isHook: boolean,
  instance: ReactDOMEventComponentInstance,
  func: () => void,
  id: number,
  timeStamp: number,
|};

const activeTimeouts: Map<number, ResponderTimeout> = new Map();
const rootEventTypesToEventComponentInstances: Map<
  DOMTopLevelEventType | string,
  Set<ReactDOMEventComponentInstance>,
> = new Map();
const targetEventTypeCached: Map<
  Array<ReactDOMEventResponderEventType>,
  Set<string>,
> = new Map();
const ownershipChangeListeners: Set<ReactDOMEventComponentInstance> = new Set();
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
let currentInstance: null | ReactDOMEventComponentInstance = null;
let currentEventQueue: null | EventQueue = null;
let currentTimerIDCounter = 0;
let currentDocument: null | Document = null;
let currentlyInHook = false;

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
  isTargetWithinEventComponent(target: Element | Document): boolean {
    validateResponderContext();
    if (target != null) {
      let fiber = getClosestInstanceFromNode(target);
      const currentFiber = ((currentInstance: any): ReactDOMEventComponentInstance)
        .currentFiber;

      while (fiber !== null) {
        const stateNode = fiber.stateNode;
        if (fiber.tag === EventComponent && stateNode !== null) {
          // Switch to the current fiber tree
          fiber = stateNode.currentFiber;
        }
        if (fiber === currentFiber || stateNode === currentInstance) {
          return true;
        }
        fiber = fiber.return;
      }
    }
    return false;
  },
  isTargetWithinEventResponderScope(target: Element | Document): boolean {
    validateResponderContext();
    const componentInstance = ((currentInstance: any): ReactDOMEventComponentInstance);
    const responder = componentInstance.responder;

    if (target != null) {
      let fiber = getClosestInstanceFromNode(target);
      const currentFiber = ((currentInstance: any): ReactDOMEventComponentInstance)
        .currentFiber;
      while (fiber !== null) {
        const stateNode = fiber.stateNode;
        if (fiber.tag === EventComponent && stateNode !== null) {
          // Switch to the current fiber tree
          fiber = stateNode.currentFiber;
        }
        if (fiber === currentFiber || stateNode === currentInstance) {
          return true;
        }
        if (
          fiber.tag === EventComponent &&
          (stateNode === null || stateNode.responder === responder)
        ) {
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
  addRootEventTypes(
    rootEventTypes: Array<ReactDOMEventResponderEventType>,
  ): void {
    validateResponderContext();
    const activeDocument = getActiveDocument();
    listenToResponderEventTypesImpl(rootEventTypes, activeDocument);
    for (let i = 0; i < rootEventTypes.length; i++) {
      const rootEventType = rootEventTypes[i];
      const eventComponentInstance = ((currentInstance: any): ReactDOMEventComponentInstance);
      registerRootEventType(rootEventType, eventComponentInstance);
    }
  },
  removeRootEventTypes(
    rootEventTypes: Array<ReactDOMEventResponderEventType>,
  ): void {
    validateResponderContext();
    for (let i = 0; i < rootEventTypes.length; i++) {
      const rootEventType = rootEventTypes[i];
      let name = rootEventType;
      let passive = true;

      if (typeof rootEventType !== 'string') {
        const targetEventConfigObject = ((rootEventType: any): {
          name: string,
          passive?: boolean,
        });
        name = targetEventConfigObject.name;
        if (targetEventConfigObject.passive !== undefined) {
          passive = targetEventConfigObject.passive;
        }
      }

      const listeningName = generateListeningKey(
        ((name: any): string),
        passive,
      );
      let rootEventComponents = rootEventTypesToEventComponentInstances.get(
        listeningName,
      );
      let rootEventTypesSet = ((currentInstance: any): ReactDOMEventComponentInstance)
        .rootEventTypes;
      if (rootEventTypesSet !== null) {
        rootEventTypesSet.delete(listeningName);
      }
      if (rootEventComponents !== undefined) {
        rootEventComponents.delete(
          ((currentInstance: any): ReactDOMEventComponentInstance),
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
      ((currentInstance: any): ReactDOMEventComponentInstance),
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
      isHook: currentlyInHook,
      instance: ((currentInstance: any): ReactDOMEventComponentInstance),
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
  getFocusableElementsInScope(): Array<HTMLElement> {
    validateResponderContext();
    const focusableElements = [];
    const eventComponentInstance = ((currentInstance: any): ReactDOMEventComponentInstance);
    const child = ((eventComponentInstance.currentFiber: any): Fiber).child;

    if (child !== null) {
      collectFocusableElements(child, focusableElements);
    }
    return focusableElements;
  },
  getActiveDocument,
  objectAssign: Object.assign,
  getEventCurrentTarget(event: ReactDOMResponderEvent): Element {
    validateResponderContext();
    const target = event.target;
    let fiber = getClosestInstanceFromNode(target);
    let hostComponent = target;
    const currentResponder = ((currentInstance: any): ReactDOMEventComponentInstance)
      .responder;

    while (fiber !== null) {
      const stateNode = fiber.stateNode;
      if (
        fiber.tag === EventComponent &&
        (stateNode === null || stateNode.responder === currentResponder)
      ) {
        break;
      }
      if (fiber.tag === HostComponent) {
        hostComponent = fiber.stateNode;
      }
      fiber = fiber.return;
    }
    return ((hostComponent: any): Element);
  },
  getTimeStamp(): number {
    validateResponderContext();
    return currentTimeStamp;
  },
  isTargetWithinHostComponent(
    target: Element | Document,
    elementType: string,
    deep: boolean,
  ): boolean {
    validateResponderContext();
    let fiber = getClosestInstanceFromNode(target);
    const currentResponder = ((currentInstance: any): ReactDOMEventComponentInstance)
      .responder;

    while (fiber !== null) {
      const stateNode = fiber.stateNode;
      if (
        !deep &&
        (fiber.tag === EventComponent &&
          (stateNode === null || stateNode.responder === currentResponder))
      ) {
        return false;
      }
      if (fiber.tag === HostComponent && fiber.type === elementType) {
        return true;
      }
      fiber = fiber.return;
    }
    return false;
  },
  continueLocalPropagation() {
    validateResponderContext();
    continueLocalPropagation = true;
  },
  isRespondingToHook() {
    return currentlyInHook;
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
  eventComponentInstance: ReactDOMEventComponentInstance,
): boolean {
  if (globalOwner === eventComponentInstance) {
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

function getDOMTargetEventTypesSet(
  eventTypes: Array<ReactDOMEventResponderEventType>,
): Set<string> {
  let cachedSet = targetEventTypeCached.get(eventTypes);

  if (cachedSet === undefined) {
    cachedSet = new Set();
    for (let i = 0; i < eventTypes.length; i++) {
      const eventType = eventTypes[i];
      let name = eventType;
      let passive = true;

      if (typeof eventType !== 'string') {
        const targetEventConfigObject = ((eventType: any): {
          name: string,
          passive?: boolean,
        });
        name = targetEventConfigObject.name;
        if (targetEventConfigObject.passive !== undefined) {
          passive = targetEventConfigObject.passive;
        }
      }
      const listeningName = generateListeningKey(
        ((name: any): string),
        passive,
      );
      cachedSet.add(listeningName);
    }
    targetEventTypeCached.set(eventTypes, cachedSet);
  }
  return cachedSet;
}

function storeTargetEventResponderInstance(
  listeningName: string,
  eventComponentInstance: ReactDOMEventComponentInstance,
  eventResponderInstances: Array<ReactDOMEventComponentInstance>,
  eventComponentResponders: null | Set<ReactDOMEventResponder>,
): void {
  const responder = eventComponentInstance.responder;
  const targetEventTypes = responder.targetEventTypes;
  // Validate the target event type exists on the responder
  if (targetEventTypes !== undefined) {
    const targetEventTypesSet = getDOMTargetEventTypesSet(targetEventTypes);
    if (targetEventTypesSet.has(listeningName)) {
      eventResponderInstances.push(eventComponentInstance);
      if (eventComponentResponders !== null) {
        eventComponentResponders.add(responder);
      }
    }
  }
}

function getTargetEventResponderInstances(
  listeningName: string,
  targetFiber: null | Fiber,
): Array<ReactDOMEventComponentInstance> {
  // We use this to know if we should check add hooks. If there are
  // no event targets, then we don't add the hook forms.
  const eventComponentResponders = new Set();
  const eventResponderInstances = [];
  let node = targetFiber;
  while (node !== null) {
    // Traverse up the fiber tree till we find event component fibers.
    const tag = node.tag;
    const dependencies = node.dependencies;
    if (tag === EventComponent) {
      const eventComponentInstance = node.stateNode;
      // Switch to the current fiber tree
      node = eventComponentInstance.currentFiber;
      storeTargetEventResponderInstance(
        listeningName,
        eventComponentInstance,
        eventResponderInstances,
        eventComponentResponders,
      );
    } else if (tag === FunctionComponent && dependencies !== null) {
      const events = dependencies.events;
      if (events !== null) {
        for (let i = 0; i < events.length; i++) {
          const eventComponentInstance = events[i];
          if (eventComponentResponders.has(eventComponentInstance.responder)) {
            storeTargetEventResponderInstance(
              listeningName,
              eventComponentInstance,
              eventResponderInstances,
              null,
            );
          }
        }
      }
    }
    node = node.return;
  }
  return eventResponderInstances;
}

function getRootEventResponderInstances(
  listeningName: string,
): Array<ReactDOMEventComponentInstance> {
  const eventResponderInstances = [];
  const rootEventInstances = rootEventTypesToEventComponentInstances.get(
    listeningName,
  );
  if (rootEventInstances !== undefined) {
    const rootEventComponentInstances = Array.from(rootEventInstances);

    for (let i = 0; i < rootEventComponentInstances.length; i++) {
      const rootEventComponentInstance = rootEventComponentInstances[i];
      eventResponderInstances.push(rootEventComponentInstance);
    }
  }
  return eventResponderInstances;
}

function shouldSkipEventComponent(
  eventResponderInstance: ReactDOMEventComponentInstance,
  responder: ReactDOMEventResponder,
  propagatedEventResponders: null | Set<ReactDOMEventResponder>,
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
  responder: ReactDOMEventResponder,
  propagatedEventResponders: Set<ReactDOMEventResponder>,
): void {
  if (continueLocalPropagation === true) {
    propagatedEventResponders.delete(responder);
    continueLocalPropagation = false;
  }
}

function traverseAndHandleEventResponderInstances(
  topLevelType: DOMTopLevelEventType,
  targetFiber: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: EventTarget,
  eventSystemFlags: EventSystemFlags,
): void {
  const isPassiveEvent = (eventSystemFlags & IS_PASSIVE) !== 0;
  const isPassiveSupported = (eventSystemFlags & PASSIVE_NOT_SUPPORTED) === 0;
  const listeningName = generateListeningKey(
    ((topLevelType: any): string),
    isPassiveEvent || !isPassiveSupported,
  );

  // Trigger event responders in this order:
  // - Bubble target phase
  // - Root phase

  const targetEventResponderInstances = getTargetEventResponderInstances(
    listeningName,
    targetFiber,
  );
  const responderEvent = createDOMResponderEvent(
    ((topLevelType: any): string),
    nativeEvent,
    ((nativeEventTarget: any): Element | Document),
    isPassiveEvent,
    isPassiveSupported,
  );
  const propagatedEventResponders: Set<ReactDOMEventResponder> = new Set();
  let length = targetEventResponderInstances.length;
  let i;

  // Bubbled event phases have the notion of local propagation.
  // This means that the propgation chain can be stopped part of the the way
  // through processing event component instances. The major difference to other
  // events systems is that the stopping of propagation is localized to a single
  // phase, rather than both phases.
  if (length > 0) {
    // Bubble target phase
    for (i = 0; i < length; i++) {
      const targetEventResponderInstance = targetEventResponderInstances[i];
      const {isHook, props, responder, state} = targetEventResponderInstance;
      const eventListener = responder.onEvent;
      if (eventListener !== undefined) {
        if (
          shouldSkipEventComponent(
            targetEventResponderInstance,
            ((responder: any): ReactDOMEventResponder),
            propagatedEventResponders,
            isHook,
          )
        ) {
          continue;
        }
        currentInstance = targetEventResponderInstance;
        currentlyInHook = isHook;
        eventListener(responderEvent, eventResponderContext, props, state);
        if (!isHook) {
          checkForLocalPropagationContinuation(
            responder,
            propagatedEventResponders,
          );
        }
      }
    }
  }
  // Root phase
  const rootEventResponderInstances = getRootEventResponderInstances(
    listeningName,
  );
  length = rootEventResponderInstances.length;
  if (length > 0) {
    for (i = 0; i < length; i++) {
      const rootEventResponderInstance = rootEventResponderInstances[i];
      const {isHook, props, responder, state} = rootEventResponderInstance;
      const eventListener = responder.onRootEvent;
      if (eventListener !== undefined) {
        if (
          shouldSkipEventComponent(
            rootEventResponderInstance,
            responder,
            null,
            isHook,
          )
        ) {
          continue;
        }
        currentInstance = rootEventResponderInstance;
        currentlyInHook = isHook;
        eventListener(responderEvent, eventResponderContext, props, state);
      }
    }
  }
}

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
      const onOwnershipChange = ((responder: any): ReactDOMEventResponder)
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

export function mountEventResponder(
  eventComponentInstance: ReactDOMEventComponentInstance,
) {
  const responder = ((eventComponentInstance.responder: any): ReactDOMEventResponder);
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

export function unmountEventResponder(
  eventComponentInstance: ReactDOMEventComponentInstance,
): void {
  const responder = ((eventComponentInstance.responder: any): ReactDOMEventResponder);
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

function validateResponderContext(): void {
  invariant(
    currentEventQueue && currentInstance,
    'An event responder context was used outside of an event cycle. ' +
      'Use context.setTimeout() to use asynchronous responder context outside of event cycle .',
  );
}

export function dispatchEventForResponderEventSystem(
  topLevelType: DOMTopLevelEventType,
  targetFiber: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: EventTarget,
  eventSystemFlags: EventSystemFlags,
): void {
  if (enableFlareAPI) {
    const previousEventQueue = currentEventQueue;
    const previousInstance = currentInstance;
    const previousTimers = currentTimers;
    const previousTimeStamp = currentTimeStamp;
    const previousDocument = currentDocument;
    const previouslyInHook = currentlyInHook;
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
      currentlyInHook = previouslyInHook;
    }
  }
}

export function addRootEventTypesForComponentInstance(
  eventComponentInstance: ReactDOMEventComponentInstance,
  rootEventTypes: Array<ReactDOMEventResponderEventType>,
): void {
  for (let i = 0; i < rootEventTypes.length; i++) {
    const rootEventType = rootEventTypes[i];
    registerRootEventType(rootEventType, eventComponentInstance);
  }
}

function registerRootEventType(
  rootEventType: ReactDOMEventResponderEventType,
  eventComponentInstance: ReactDOMEventComponentInstance,
): void {
  let name = rootEventType;
  let passive = true;

  if (typeof rootEventType !== 'string') {
    const targetEventConfigObject = ((rootEventType: any): {
      name: string,
      passive?: boolean,
    });
    name = targetEventConfigObject.name;
    if (targetEventConfigObject.passive !== undefined) {
      passive = targetEventConfigObject.passive;
    }
  }

  const listeningName = generateListeningKey(((name: any): string), passive);
  let rootEventComponentInstances = rootEventTypesToEventComponentInstances.get(
    listeningName,
  );
  if (rootEventComponentInstances === undefined) {
    rootEventComponentInstances = new Set();
    rootEventTypesToEventComponentInstances.set(
      listeningName,
      rootEventComponentInstances,
    );
  }
  let rootEventTypesSet = eventComponentInstance.rootEventTypes;
  if (rootEventTypesSet === null) {
    rootEventTypesSet = eventComponentInstance.rootEventTypes = new Set();
  }
  invariant(
    !rootEventTypesSet.has(listeningName),
    'addRootEventTypes() found a duplicate root event ' +
      'type of "%s". This might be because the event type exists in the event responder "rootEventTypes" ' +
      'array or because of a previous addRootEventTypes() using this root event type.',
    name,
  );
  rootEventTypesSet.add(listeningName);
  rootEventComponentInstances.add(eventComponentInstance);
}

export function generateListeningKey(
  topLevelType: string,
  passive: boolean,
): string {
  // Create a unique name for this event, plus its properties. We'll
  // use this to ensure we don't listen to the same event with the same
  // properties again.
  const passiveKey = passive ? '_passive' : '_active';
  return `${topLevelType}${passiveKey}`;
}
