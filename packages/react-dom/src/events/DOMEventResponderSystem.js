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
  EventTarget as EventTargetWorkTag,
  HostComponent,
} from 'shared/ReactWorkTags';
import type {
  ReactEventResponderEventType,
  ReactEventComponentInstance,
  ReactResponderContext,
  ReactResponderEvent,
  ReactResponderDispatchEventOptions,
} from 'shared/ReactTypes';
import type {DOMTopLevelEventType} from 'events/TopLevelEventTypes';
import {batchedUpdates, interactiveUpdates} from 'events/ReactGenericBatching';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import warning from 'shared/warning';
import {enableEventAPI} from 'shared/ReactFeatureFlags';
import {invokeGuardedCallbackAndCatchFirstError} from 'shared/ReactErrorUtils';
import invariant from 'shared/invariant';

import {getClosestInstanceFromNode} from '../client/ReactDOMComponentTree';

export let listenToResponderEventTypesImpl;

export function setListenToResponderEventTypes(
  _listenToResponderEventTypesImpl: Function,
) {
  listenToResponderEventTypesImpl = _listenToResponderEventTypesImpl;
}

type EventObjectType = $Shape<PartialEventObject>;

type EventQueue = {
  events: Array<EventObjectType>,
  discrete: boolean,
};

type PartialEventObject = {
  target: Element | Document,
  type: string,
};

type ResponderTimeout = {|
  id: TimeoutID,
  timers: Map<Symbol, ResponderTimer>,
|};

type ResponderTimer = {|
  instance: ReactEventComponentInstance,
  func: () => boolean,
  id: Symbol,
|};

const ROOT_PHASE = 0;
const BUBBLE_PHASE = 1;
const CAPTURE_PHASE = 2;
const activeTimeouts: Map<Symbol, ResponderTimeout> = new Map();
const rootEventTypesToEventComponentInstances: Map<
  DOMTopLevelEventType | string,
  Set<ReactEventComponentInstance>,
> = new Map();
const targetEventTypeCached: Map<
  Array<ReactEventResponderEventType>,
  Set<DOMTopLevelEventType>,
> = new Map();
const ownershipChangeListeners: Set<ReactEventComponentInstance> = new Set();
const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
const eventListeners:
  | WeakMap
  | Map<
      $Shape<PartialEventObject>,
      ($Shape<PartialEventObject>) => void,
    > = new PossiblyWeakMap();

let currentTimers = new Map();
let currentOwner = null;
let currentInstance: null | ReactEventComponentInstance = null;
let currentEventQueue: null | EventQueue = null;

const eventResponderContext: ReactResponderContext = {
  dispatchEvent(
    possibleEventObject: Object,
    listener: ($Shape<PartialEventObject>) => void,
    {discrete}: ReactResponderDispatchEventOptions,
  ): void {
    validateResponderContext();
    const {target, type} = possibleEventObject;

    if (target == null || type == null) {
      throw new Error(
        'context.dispatchEvent: "target" and "type" fields on event object are required.',
      );
    }
    if (__DEV__) {
      possibleEventObject.preventDefault = () => {
        // Update this warning when we have a story around dealing with preventDefault
        warning(
          false,
          'preventDefault() is no longer available on event objects created from event responder modules.',
        );
      };
      possibleEventObject.stopPropagation = () => {
        // Update this warning when we have a story around dealing with stopPropgation
        warning(
          false,
          'stopPropagation() is no longer available on event objects created from event responder modules.',
        );
      };
    }
    const eventObject = ((possibleEventObject: any): $Shape<
      PartialEventObject,
    >);
    const eventQueue = ((currentEventQueue: any): EventQueue);
    if (discrete) {
      eventQueue.discrete = true;
    }
    eventListeners.set(eventObject, listener);
    eventQueue.events.push(eventObject);
  },
  isPositionWithinTouchHitTarget(doc: Document, x: number, y: number): boolean {
    validateResponderContext();
    // This isn't available in some environments (JSDOM)
    if (typeof doc.elementFromPoint !== 'function') {
      return false;
    }
    const target = doc.elementFromPoint(x, y);
    if (target === null) {
      return false;
    }
    const childFiber = getClosestInstanceFromNode(target);
    if (childFiber === null) {
      return false;
    }
    const parentFiber = childFiber.return;
    if (parentFiber !== null && parentFiber.tag === EventTargetWorkTag) {
      const parentNode = ((target.parentNode: any): Element);
      // TODO find another way to do this without using the
      // expensive getBoundingClientRect.
      const {left, top, right, bottom} = parentNode.getBoundingClientRect();
      // Check if the co-ords intersect with the target element's rect.
      if (x > left && y > top && x < right && y < bottom) {
        return false;
      }
      return true;
    }
    return false;
  },
  isTargetWithinEventComponent(target: Element | Document): boolean {
    validateResponderContext();
    if (target != null) {
      let fiber = getClosestInstanceFromNode(target);
      while (fiber !== null) {
        if (fiber.stateNode === currentInstance) {
          return true;
        }
        fiber = fiber.return;
      }
    }
    return false;
  },
  isTargetWithinElement(
    childTarget: Element | Document,
    parentTarget: Element | Document,
  ): boolean {
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
    doc: Document,
    rootEventTypes: Array<ReactEventResponderEventType>,
  ): void {
    validateResponderContext();
    listenToResponderEventTypesImpl(rootEventTypes, doc);
    for (let i = 0; i < rootEventTypes.length; i++) {
      const rootEventType = rootEventTypes[i];
      const topLevelEventType =
        typeof rootEventType === 'string' ? rootEventType : rootEventType.name;
      let rootEventComponentInstances = rootEventTypesToEventComponentInstances.get(
        topLevelEventType,
      );
      if (rootEventComponentInstances === undefined) {
        rootEventComponentInstances = new Set();
        rootEventTypesToEventComponentInstances.set(
          topLevelEventType,
          rootEventComponentInstances,
        );
      }
      rootEventComponentInstances.add(
        ((currentInstance: any): ReactEventComponentInstance),
      );
    }
  },
  removeRootEventTypes(
    rootEventTypes: Array<ReactEventResponderEventType>,
  ): void {
    validateResponderContext();
    for (let i = 0; i < rootEventTypes.length; i++) {
      const rootEventType = rootEventTypes[i];
      const topLevelEventType =
        typeof rootEventType === 'string' ? rootEventType : rootEventType.name;
      let rootEventComponents = rootEventTypesToEventComponentInstances.get(
        topLevelEventType,
      );
      if (rootEventComponents !== undefined) {
        rootEventComponents.delete(
          ((currentInstance: any): ReactEventComponentInstance),
        );
      }
    }
  },
  hasOwnership(): boolean {
    validateResponderContext();
    return currentOwner === currentInstance;
  },
  requestOwnership(): boolean {
    validateResponderContext();
    if (currentOwner !== null) {
      return false;
    }
    currentOwner = currentInstance;
    triggerOwnershipListeners();
    return true;
  },
  releaseOwnership(): boolean {
    validateResponderContext();
    if (currentOwner !== currentInstance) {
      return false;
    }
    currentOwner = null;
    triggerOwnershipListeners();
    return false;
  },
  setTimeout(func: () => boolean, delay): Symbol {
    validateResponderContext();
    if (currentTimers === null) {
      currentTimers = new Map();
    }
    let timeout = currentTimers.get(delay);

    const timerId = Symbol();
    if (timeout === undefined) {
      const timers = new Map();
      const id = setTimeout(() => {
        processTimers(timers);
      }, delay);
      timeout = {
        id,
        timers,
      };
      currentTimers.set(delay, timeout);
    }
    timeout.timers.set(timerId, {
      instance: ((currentInstance: any): ReactEventComponentInstance),
      func,
      id: timerId,
    });
    activeTimeouts.set(timerId, timeout);
    return timerId;
  },
  clearTimeout(timerId: Symbol): void {
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
  getEventTargetsFromTarget(
    target: Element | Document,
    queryType?: Symbol | number,
    queryKey?: string,
  ): Array<{
    node: Element,
    props: null | Object,
  }> {
    validateResponderContext();
    const eventTargetHostComponents = [];
    let node = getClosestInstanceFromNode(target);
    // We traverse up the fiber tree from the target fiber, to the
    // current event component fiber. Along the way, we check if
    // the fiber has any children that are event targets. If there
    // are, we query them (optionally) to ensure they match the
    // specified type and key. We then push the event target props
    // along with the associated parent host component of that event
    // target.
    while (node !== null) {
      if (node.stateNode === currentInstance) {
        break;
      }
      let child = node.child;

      while (child !== null) {
        if (
          child.tag === EventTargetWorkTag &&
          queryEventTarget(child, queryType, queryKey)
        ) {
          const props = child.stateNode.props;
          let parent = child.return;

          if (parent !== null) {
            if (parent.stateNode === currentInstance) {
              break;
            }
            if (parent.tag === HostComponent) {
              eventTargetHostComponents.push({
                node: parent.stateNode,
                props,
              });
              break;
            }
            parent = parent.return;
          }
          break;
        }
        child = child.sibling;
      }
      node = node.return;
    }
    return eventTargetHostComponents;
  },
};

function processTimers(timers: Map<Symbol, ResponderTimer>): void {
  const timersArr = Array.from(timers.values());
  let shouldStopPropagation = false;
  currentEventQueue = createEventQueue();
  try {
    for (let i = 0; i < timersArr.length; i++) {
      const {instance, func, id} = timersArr[i];
      currentInstance = instance;
      try {
        if (!shouldStopPropagation) {
          shouldStopPropagation = func();
        }
      } finally {
        activeTimeouts.delete(id);
      }
    }
    processEventQueue();
  } finally {
    currentTimers = null;
    currentInstance = null;
    currentEventQueue = null;
  }
}

function queryEventTarget(
  child: Fiber,
  queryType: void | Symbol | number,
  queryKey: void | string,
): boolean {
  if (queryType !== undefined && child.type.type !== queryType) {
    return false;
  }
  if (queryKey !== undefined && child.key !== queryKey) {
    return false;
  }
  return true;
}

function createResponderEvent(
  topLevelType: string,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: Element | Document,
  eventSystemFlags: EventSystemFlags,
  phase: 0 | 1 | 2,
): ReactResponderEvent {
  const responderEvent = {
    nativeEvent: nativeEvent,
    target: nativeEventTarget,
    type: topLevelType,
    passive: (eventSystemFlags & IS_PASSIVE) !== 0,
    passiveSupported: (eventSystemFlags & PASSIVE_NOT_SUPPORTED) === 0,
    phase,
  };
  if (__DEV__) {
    Object.freeze(responderEvent);
  }
  return responderEvent;
}

function createEventQueue(): EventQueue {
  return {
    events: [],
    discrete: false,
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

export function processEventQueue(): void {
  const {events, discrete} = ((currentEventQueue: any): EventQueue);

  if (events.length === 0) {
    return;
  }
  if (discrete) {
    interactiveUpdates(() => {
      batchedUpdates(processEvents, events);
    });
  } else {
    batchedUpdates(processEvents, events);
  }
}

function getTargetEventTypes(
  eventTypes: Array<ReactEventResponderEventType>,
): Set<DOMTopLevelEventType> {
  let cachedSet = targetEventTypeCached.get(eventTypes);

  if (cachedSet === undefined) {
    cachedSet = new Set();
    for (let i = 0; i < eventTypes.length; i++) {
      const eventType = eventTypes[i];
      const topLevelEventType =
        typeof eventType === 'string' ? eventType : eventType.name;
      cachedSet.add(((topLevelEventType: any): DOMTopLevelEventType));
    }
    targetEventTypeCached.set(eventTypes, cachedSet);
  }
  return cachedSet;
}

function getTargetEventResponderInstances(
  topLevelType: DOMTopLevelEventType,
  targetFiber: null | Fiber,
): Array<ReactEventComponentInstance> {
  const eventResponderInstances = [];
  let node = targetFiber;
  while (node !== null) {
    // Traverse up the fiber tree till we find event component fibers.
    if (node.tag === EventComponent) {
      const eventComponentInstance = node.stateNode;
      if (currentOwner === null || currentOwner === eventComponentInstance) {
        const responder = eventComponentInstance.responder;
        // Validate the target event type exists on the responder
        const targetEventTypes = getTargetEventTypes(
          responder.targetEventTypes,
        );
        if (targetEventTypes.has(topLevelType)) {
          eventResponderInstances.push(eventComponentInstance);
        }
      }
    }
    node = node.return;
  }
  return eventResponderInstances;
}

function getRootEventResponderInstances(
  topLevelType: DOMTopLevelEventType,
): Array<ReactEventComponentInstance> {
  const eventResponderInstances = [];
  const rootEventInstances = rootEventTypesToEventComponentInstances.get(
    topLevelType,
  );
  if (rootEventInstances !== undefined) {
    const rootEventComponentInstances = Array.from(rootEventInstances);

    for (let i = 0; i < rootEventComponentInstances.length; i++) {
      const rootEventComponentInstance = rootEventComponentInstances[i];

      if (
        currentOwner === null ||
        currentOwner === rootEventComponentInstance
      ) {
        eventResponderInstances.push(rootEventComponentInstance);
      }
    }
  }
  return eventResponderInstances;
}

function triggerEventResponderEventListener(
  responderEvent: ReactResponderEvent,
  eventComponentInstance: ReactEventComponentInstance,
): boolean {
  const {responder, props, state} = eventComponentInstance;
  currentInstance = eventComponentInstance;
  return responder.onEvent(responderEvent, eventResponderContext, props, state);
}

function traverseAndTriggerEventResponderInstances(
  topLevelType: DOMTopLevelEventType,
  targetFiber: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: EventTarget,
  eventSystemFlags: EventSystemFlags,
): void {
  // Trigger event responders in this order:
  // - Capture target phase
  // - Bubble target phase
  // - Root phase

  const targetEventResponderInstances = getTargetEventResponderInstances(
    topLevelType,
    targetFiber,
  );
  let length = targetEventResponderInstances.length;
  let i;
  let shouldStopPropagation = false;
  let responderEvent;

  // Capture target phase
  if (length > 0) {
    responderEvent = createResponderEvent(
      ((topLevelType: any): string),
      nativeEvent,
      ((nativeEventTarget: any): Element | Document),
      eventSystemFlags,
      CAPTURE_PHASE,
    );
    for (i = length; i-- > 0; ) {
      const targetEventResponderInstance = targetEventResponderInstances[i];
      shouldStopPropagation = triggerEventResponderEventListener(
        responderEvent,
        targetEventResponderInstance,
      );
      if (shouldStopPropagation) {
        return;
      }
    }
    // Bubble target phase
    responderEvent = createResponderEvent(
      ((topLevelType: any): string),
      nativeEvent,
      ((nativeEventTarget: any): Element | Document),
      eventSystemFlags,
      BUBBLE_PHASE,
    );
    for (i = 0; i < length; i++) {
      const targetEventResponderInstance = targetEventResponderInstances[i];
      shouldStopPropagation = triggerEventResponderEventListener(
        responderEvent,
        targetEventResponderInstance,
      );
      if (shouldStopPropagation) {
        return;
      }
    }
  }
  // Root phase
  const rootEventResponderInstances = getRootEventResponderInstances(
    topLevelType,
  );
  length = rootEventResponderInstances.length;
  if (length > 0) {
    responderEvent = createResponderEvent(
      ((topLevelType: any): string),
      nativeEvent,
      ((nativeEventTarget: any): Element | Document),
      eventSystemFlags,
      ROOT_PHASE,
    );
    for (i = 0; i < length; i++) {
      const targetEventResponderInstance = rootEventResponderInstances[i];
      shouldStopPropagation = triggerEventResponderEventListener(
        responderEvent,
        targetEventResponderInstance,
      );
      if (shouldStopPropagation) {
        return;
      }
    }
  }
}

function triggerOwnershipListeners(): void {
  const listeningInstances = Array.from(ownershipChangeListeners);
  const previousInstance = currentInstance;
  try {
    for (let i = 0; i < listeningInstances.length; i++) {
      const instance = listeningInstances[i];
      const {props, responder, state} = instance;
      currentInstance = instance;
      responder.onOwnershipChange(eventResponderContext, props, state);
    }
  } finally {
    currentInstance = previousInstance;
  }
}

export function mountEventResponder(
  eventComponentInstance: ReactEventComponentInstance,
) {
  const responder = eventComponentInstance.responder;
  if (responder.onOwnershipChange !== undefined) {
    ownershipChangeListeners.add(eventComponentInstance);
  }
}

export function unmountEventResponder(
  eventComponentInstance: ReactEventComponentInstance,
): void {
  const responder = eventComponentInstance.responder;
  const onUnmount = responder.onUnmount;
  if (onUnmount !== undefined) {
    let {props, state} = eventComponentInstance;
    currentEventQueue = createEventQueue();
    currentInstance = eventComponentInstance;
    try {
      onUnmount(eventResponderContext, props, state);
    } finally {
      currentEventQueue = null;
      currentInstance = null;
      currentTimers = null;
    }
  }
  if (currentOwner === eventComponentInstance) {
    currentOwner = null;
    triggerOwnershipListeners();
  }
  if (responder.onOwnershipChange !== undefined) {
    ownershipChangeListeners.delete(eventComponentInstance);
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
  if (enableEventAPI) {
    currentEventQueue = createEventQueue();
    try {
      traverseAndTriggerEventResponderInstances(
        topLevelType,
        targetFiber,
        nativeEvent,
        nativeEventTarget,
        eventSystemFlags,
      );
      processEventQueue();
    } finally {
      currentTimers = null;
      currentInstance = null;
      currentEventQueue = null;
    }
  }
}
