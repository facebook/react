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
import {EventComponent} from 'shared/ReactWorkTags';
import type {
  ReactEventResponder,
  ReactEventResponderEventType,
} from 'shared/ReactTypes';
import type {DOMTopLevelEventType} from 'events/TopLevelEventTypes';
import {batchedUpdates, interactiveUpdates} from 'events/ReactGenericBatching';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import {getClosestInstanceFromNode} from '../client/ReactDOMComponentTree';

import {enableEventAPI} from 'shared/ReactFeatureFlags';
import {invokeGuardedCallbackAndCatchFirstError} from 'shared/ReactErrorUtils';
import warning from 'shared/warning';

let listenToResponderEventTypesImpl;

export function setListenToResponderEventTypes(
  _listenToResponderEventTypesImpl: Function,
) {
  listenToResponderEventTypesImpl = _listenToResponderEventTypesImpl;
}

const PossiblyWeakSet = typeof WeakSet === 'function' ? WeakSet : Set;

const rootEventTypesToEventComponents: Map<
  DOMTopLevelEventType | string,
  Set<Fiber>,
> = new Map();
const targetEventTypeCached: Map<
  Array<ReactEventResponderEventType>,
  Set<DOMTopLevelEventType>,
> = new Map();
const targetOwnership: Map<EventTarget, Fiber> = new Map();
const eventsWithStopPropagation:
  | WeakSet
  | Set<$Shape<PartialEventObject>> = new PossiblyWeakSet();

type PartialEventObject = {
  listener: ($Shape<PartialEventObject>) => void,
  target: Element | Document,
  type: string,
};
type EventQueue = {
  bubble: null | Array<$Shape<PartialEventObject>>,
  capture: null | Array<$Shape<PartialEventObject>>,
  discrete: boolean,
};

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

function processEventQueue(eventQueue: EventQueue): void {
  const {bubble, capture, discrete} = eventQueue;

  if (discrete) {
    interactiveUpdates(() => {
      processEvents(bubble, capture);
    });
  } else {
    processEvents(bubble, capture);
  }
}

// TODO add context methods for dispatching events
function DOMEventResponderContext(
  topLevelType: DOMTopLevelEventType,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: EventTarget,
  eventSystemFlags: EventSystemFlags,
) {
  this.event = nativeEvent;
  this.eventTarget = nativeEventTarget;
  this.eventType = topLevelType;
  this._flags = eventSystemFlags;
  this._fiber = null;
  this._responder = null;
  this._discreteEvents = null;
  this._nonDiscreteEvents = null;
  this._isBatching = true;
  this._eventQueue = createEventQueue();
}

DOMEventResponderContext.prototype.isPassive = function(): boolean {
  return (this._flags & IS_PASSIVE) !== 0;
};

DOMEventResponderContext.prototype.isPassiveSupported = function(): boolean {
  return (this._flags & PASSIVE_NOT_SUPPORTED) === 0;
};

DOMEventResponderContext.prototype.dispatchEvent = function(
  possibleEventObject: Object,
  {
    capture,
    discrete,
    stopPropagation,
  }: {
    capture?: boolean,
    discrete?: boolean,
    stopPropagation?: boolean,
  },
): void {
  const eventQueue = this._eventQueue;
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
  const eventObject = ((possibleEventObject: any): $Shape<PartialEventObject>);
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
};

DOMEventResponderContext.prototype.isTargetWithinEventComponent = function(
  target: AnyNativeEvent,
): boolean {
  const eventFiber = this._fiber;

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
};

DOMEventResponderContext.prototype.isTargetWithinElement = function(
  childTarget: EventTarget,
  parentTarget: EventTarget,
): boolean {
  const childFiber = getClosestInstanceFromNode(childTarget);
  const parentFiber = getClosestInstanceFromNode(parentTarget);

  let currentFiber = childFiber;
  while (currentFiber !== null) {
    if (currentFiber === parentFiber) {
      return true;
    }
    currentFiber = currentFiber.return;
  }
  return false;
};

DOMEventResponderContext.prototype.addRootEventTypes = function(
  rootEventTypes: Array<ReactEventResponderEventType>,
) {
  const element = this.eventTarget.ownerDocument;
  listenToResponderEventTypesImpl(rootEventTypes, element);
  const eventComponent = this._fiber;
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
};

DOMEventResponderContext.prototype.removeRootEventTypes = function(
  rootEventTypes: Array<ReactEventResponderEventType>,
): void {
  const eventComponent = this._fiber;
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
};

DOMEventResponderContext.prototype.isPositionWithinTouchHitTarget = function() {
  // TODO
};

DOMEventResponderContext.prototype.isTargetOwned = function(
  targetElement: Element | Node,
): boolean {
  const targetDoc = targetElement.ownerDocument;
  return targetOwnership.has(targetDoc);
};

DOMEventResponderContext.prototype.requestOwnership = function(
  targetElement: Element | Node,
): boolean {
  const targetDoc = targetElement.ownerDocument;
  if (targetOwnership.has(targetDoc)) {
    return false;
  }
  targetOwnership.set(targetDoc, this._fiber);
  return true;
};

DOMEventResponderContext.prototype.releaseOwnership = function(
  targetElement: Element | Node,
): boolean {
  const targetDoc = targetElement.ownerDocument;
  if (!targetOwnership.has(targetDoc)) {
    return false;
  }
  const owner = targetOwnership.get(targetDoc);
  if (owner === this._fiber || owner === this._fiber.alternate) {
    targetOwnership.delete(targetDoc);
    return true;
  }
  return false;
};

DOMEventResponderContext.prototype.withAsyncDispatching = function(
  func: () => void,
) {
  const previousEventQueue = this._eventQueue;
  this._eventQueue = createEventQueue();
  try {
    func();
    batchedUpdates(processEventQueue, this._eventQueue);
  } finally {
    this._eventQueue = previousEventQueue;
  }
};

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
  context: Object,
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
  context._fiber = fiber;
  context._responder = responder;
  responder.handleEvent(context, props, state);
}

export function runResponderEventsInBatch(
  topLevelType: DOMTopLevelEventType,
  targetFiber: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: EventTarget,
  eventSystemFlags: EventSystemFlags,
): void {
  if (enableEventAPI) {
    const context = new DOMEventResponderContext(
      topLevelType,
      nativeEvent,
      nativeEventTarget,
      eventSystemFlags,
    );
    let node = targetFiber;
    // Traverse up the fiber tree till we find event component fibers.
    while (node !== null) {
      if (node.tag === EventComponent) {
        handleTopLevelType(topLevelType, node, context, false);
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
          context,
          true,
        );
      }
    }
    processEventQueue(context._eventQueue);
  }
}
