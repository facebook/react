/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

import type {
  ResponderContext,
  ResponderEvent,
  ResponderDispatchEventOptions,
} from 'events/EventTypes';
import {
  type EventSystemFlags,
  IS_PASSIVE,
  PASSIVE_NOT_SUPPORTED,
} from 'events/EventSystemFlags';
import type {AnyNativeEvent} from 'events/PluginModuleType';
import {EventComponent} from 'shared/ReactWorkTags';
import type {
  ReactEventResponder,
  ReactEventResponderEventType,
} from 'shared/ReactTypes';
import type {DOMTopLevelEventType} from 'events/TopLevelEventTypes';
import {batchedUpdates, interactiveUpdates} from 'events/ReactGenericBatching';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import warning from 'shared/warning';
import {enableEventAPI} from 'shared/ReactFeatureFlags';
import {invokeGuardedCallbackAndCatchFirstError} from 'shared/ReactErrorUtils';

import {getClosestInstanceFromNode} from '../client/ReactDOMComponentTree';

export let listenToResponderEventTypesImpl;

export function setListenToResponderEventTypes(
  _listenToResponderEventTypesImpl: Function,
) {
  listenToResponderEventTypesImpl = _listenToResponderEventTypesImpl;
}

type EventQueue = {
  bubble: null | Array<$Shape<PartialEventObject>>,
  capture: null | Array<$Shape<PartialEventObject>>,
  discrete: boolean,
};

type PartialEventObject = {
  listener: ($Shape<PartialEventObject>) => void,
  target: Element | Document,
  type: string,
};

let currentOwner = null;
let currentFiber: Fiber;
let currentResponder: ReactEventResponder;
let currentEventQueue: EventQueue;

const eventResponderContext: ResponderContext = {
  dispatchEvent(
    possibleEventObject: Object,
    {capture, discrete, stopPropagation}: ResponderDispatchEventOptions,
  ): void {
    const eventQueue = currentEventQueue;
    const {listener, target, type} = possibleEventObject;

    if (listener == null || target == null || type == null) {
      throw new Error(
        'context.dispatchEvent: "listener", "target" and "type" fields on event object are required.',
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
    let events;

    if (capture) {
      events = eventQueue.capture;
      if (events === null) {
        events = eventQueue.capture = [];
      }
    } else {
      events = eventQueue.bubble;
      if (events === null) {
        events = eventQueue.bubble = [];
      }
    }
    if (discrete) {
      eventQueue.discrete = true;
    }
    events.push(eventObject);

    if (stopPropagation) {
      eventsWithStopPropagation.add(eventObject);
    }
  },
  isPositionWithinTouchHitTarget(x: number, y: number): boolean {
    return false;
  },
  isTargetWithinEventComponent(target: Element | Document): boolean {
    const eventFiber = currentFiber;

    if (target != null) {
      let fiber = getClosestInstanceFromNode(target);
      while (fiber !== null) {
        if (fiber === eventFiber || fiber === eventFiber.alternate) {
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
    listenToResponderEventTypesImpl(rootEventTypes, doc);
    const eventComponent = currentFiber;
    for (let i = 0; i < rootEventTypes.length; i++) {
      const rootEventType = rootEventTypes[i];
      const topLevelEventType =
        typeof rootEventType === 'string' ? rootEventType : rootEventType.name;
      let rootEventComponents = rootEventTypesToEventComponents.get(
        topLevelEventType,
      );
      if (rootEventComponents === undefined) {
        rootEventComponents = new Set();
        rootEventTypesToEventComponents.set(
          topLevelEventType,
          rootEventComponents,
        );
      }
      rootEventComponents.add(eventComponent);
    }
  },
  removeRootEventTypes(
    rootEventTypes: Array<ReactEventResponderEventType>,
  ): void {
    const eventComponent = currentFiber;
    for (let i = 0; i < rootEventTypes.length; i++) {
      const rootEventType = rootEventTypes[i];
      const topLevelEventType =
        typeof rootEventType === 'string' ? rootEventType : rootEventType.name;
      let rootEventComponents = rootEventTypesToEventComponents.get(
        topLevelEventType,
      );
      if (rootEventComponents !== undefined) {
        rootEventComponents.delete(eventComponent);
      }
    }
  },
  hasOwnership(): boolean {
    return currentOwner === currentFiber;
  },
  requestOwnership(): boolean {
    if (currentOwner !== null) {
      return false;
    }
    currentOwner = currentFiber;
    return true;
  },
  releaseOwnership(): boolean {
    if (currentOwner !== currentFiber) {
      return false;
    }
    currentOwner = null;
    return false;
  },
  setTimeout(func: () => void, delay): TimeoutID {
    const contextResponder = currentResponder;
    const contextFiber = currentFiber;
    return setTimeout(() => {
      const previousEventQueue = currentEventQueue;
      const previousFiber = currentFiber;
      const previousResponder = currentResponder;
      currentEventQueue = createEventQueue();
      currentResponder = contextResponder;
      currentFiber = contextFiber;
      try {
        func();
        batchedUpdates(processEventQueue, currentEventQueue);
      } finally {
        currentFiber = previousFiber;
        currentEventQueue = previousEventQueue;
        currentResponder = previousResponder;
      }
    }, delay);
  },
};

const rootEventTypesToEventComponents: Map<
  DOMTopLevelEventType | string,
  Set<Fiber>,
> = new Map();
const PossiblyWeakSet = typeof WeakSet === 'function' ? WeakSet : Set;
const eventsWithStopPropagation:
  | WeakSet
  | Set<$Shape<PartialEventObject>> = new PossiblyWeakSet();
const targetEventTypeCached: Map<
  Array<ReactEventResponderEventType>,
  Set<DOMTopLevelEventType>,
> = new Map();

function createResponderEvent(
  topLevelType: string,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: Element | Document,
  eventSystemFlags: EventSystemFlags,
): ResponderEvent {
  return {
    nativeEvent: nativeEvent,
    target: nativeEventTarget,
    type: topLevelType,
    passive: (eventSystemFlags & IS_PASSIVE) !== 0,
    passiveSupported: (eventSystemFlags & PASSIVE_NOT_SUPPORTED) === 0,
  };
}

function createEventQueue(): EventQueue {
  return {
    bubble: null,
    capture: null,
    discrete: false,
  };
}

function processEvent(event: $Shape<PartialEventObject>): void {
  const type = event.type;
  const listener = event.listener;
  invokeGuardedCallbackAndCatchFirstError(type, listener, undefined, event);
}

function processEvents(
  bubble: null | Array<$Shape<PartialEventObject>>,
  capture: null | Array<$Shape<PartialEventObject>>,
): void {
  let i, length;

  if (capture !== null) {
    for (i = capture.length; i-- > 0; ) {
      const event = capture[i];
      processEvent(capture[i]);
      if (eventsWithStopPropagation.has(event)) {
        return;
      }
    }
  }
  if (bubble !== null) {
    for (i = 0, length = bubble.length; i < length; ++i) {
      const event = bubble[i];
      processEvent(event);
      if (eventsWithStopPropagation.has(event)) {
        return;
      }
    }
  }
}

export function processEventQueue(): void {
  const {bubble, capture, discrete} = currentEventQueue;

  if (discrete) {
    interactiveUpdates(() => {
      processEvents(bubble, capture);
    });
  } else {
    processEvents(bubble, capture);
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

function handleTopLevelType(
  topLevelType: DOMTopLevelEventType,
  fiber: Fiber,
  responderEvent: ResponderEvent,
  isRootLevelEvent: boolean,
): void {
  const responder: ReactEventResponder = fiber.type.responder;
  if (!isRootLevelEvent) {
    // Validate the target event type exists on the responder
    const targetEventTypes = getTargetEventTypes(responder.targetEventTypes);
    if (!targetEventTypes.has(topLevelType)) {
      return;
    }
  }
  let {props, state} = fiber.stateNode;
  if (state === null && responder.createInitialState !== undefined) {
    state = fiber.stateNode.state = responder.createInitialState(props);
  }
  currentFiber = fiber;
  currentResponder = responder;

  responder.onEvent(responderEvent, eventResponderContext, props, state);
}

export function runResponderEventsInBatch(
  topLevelType: DOMTopLevelEventType,
  targetFiber: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: EventTarget,
  eventSystemFlags: EventSystemFlags,
): void {
  if (enableEventAPI) {
    currentEventQueue = createEventQueue();
    const responderEvent = createResponderEvent(
      ((topLevelType: any): string),
      nativeEvent,
      ((nativeEventTarget: any): Element | Document),
      eventSystemFlags,
    );
    let node = targetFiber;
    // Traverse up the fiber tree till we find event component fibers.
    while (node !== null) {
      if (node.tag === EventComponent) {
        handleTopLevelType(topLevelType, node, responderEvent, false);
      }
      node = node.return;
    }
    // Handle root level events
    const rootEventComponents = rootEventTypesToEventComponents.get(
      topLevelType,
    );
    if (rootEventComponents !== undefined) {
      const rootEventComponentFibers = Array.from(rootEventComponents);

      for (let i = 0; i < rootEventComponentFibers.length; i++) {
        const rootEventComponentFiber = rootEventComponentFibers[i];
        handleTopLevelType(
          topLevelType,
          rootEventComponentFiber,
          responderEvent,
          true,
        );
      }
    }
    processEventQueue();
  }
}
