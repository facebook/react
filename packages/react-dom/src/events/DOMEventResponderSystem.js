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

const rootEventTypesToEventComponents: Map<
  DOMTopLevelEventType | string,
  Set<Fiber>,
> = new Map();
const targetEventTypeCached: Map<
  Array<ReactEventResponderEventType>,
  Set<DOMTopLevelEventType>,
> = new Map();
const targetOwnership: Map<EventTarget, Fiber> = new Map();

type ParitalEventObject = {
  listener: ($Shape<ParitalEventObject>) => void,
  target: Element | Document,
  type: string,
};
type EventQueue = {
  bubble: Array<$Shape<ParitalEventObject>>,
  capture: Array<$Shape<ParitalEventObject>>,
};
type BatchedEventQueue = {
  discrete: null | EventQueue,
  phase: EventQueuePhase,
  nonDiscrete: null | EventQueue,
};
type EventQueuePhase = 0 | 1;

const DURING_EVENT_PHASE = 0;
const AFTER_EVENT_PHASE = 1;

function createEventQueue(): EventQueue {
  return {
    bubble: [],
    capture: [],
  };
}

function createBatchedEventQueue(phase: EventQueuePhase): BatchedEventQueue {
  return {
    discrete: null,
    phase,
    nonDiscrete: null,
  };
}

function processEvent(event: $Shape<ParitalEventObject>): void {
  const type = event.type;
  const listener = event.listener;
  invokeGuardedCallbackAndCatchFirstError(type, listener, undefined, event);
}

function processEventQueue(eventQueue: EventQueue): void {
  const {bubble, capture} = eventQueue;
  let i, length;

  // TODO support stopPropagation via an alternative approach
  // Process events in two phases
  for (i = capture.length; i-- > 0; ) {
    processEvent(capture[i]);
  }
  for (i = 0, length = bubble.length; i < length; ++i) {
    processEvent(bubble[i]);
  }
}

function processBatchedEventQueue(batchedEventQueue: BatchedEventQueue): void {
  const {discrete, nonDiscrete} = batchedEventQueue;

  if (discrete !== null) {
    interactiveUpdates(() => {
      processEventQueue(discrete);
    });
  }
  if (nonDiscrete !== null) {
    processEventQueue(nonDiscrete);
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
  this._batchedEventQueue = createBatchedEventQueue(DURING_EVENT_PHASE);
}

DOMEventResponderContext.prototype.isPassive = function(): boolean {
  return (this._flags & IS_PASSIVE) !== 0;
};

DOMEventResponderContext.prototype.isPassiveSupported = function(): boolean {
  return (this._flags & PASSIVE_NOT_SUPPORTED) === 0;
};

DOMEventResponderContext.prototype.dispatchEvent = function(
  possibleEventObject: Object,
  discrete: boolean,
  capture: boolean,
): void {
  const batchedEventQueue = this._batchedEventQueue;
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
  const eventObject = ((possibleEventObject: any): $Shape<ParitalEventObject>);
  let eventQueue;
  if (discrete) {
    eventQueue = batchedEventQueue.discrete;
    if (eventQueue === null) {
      eventQueue = batchedEventQueue.discrete = createEventQueue();
    }
  } else {
    eventQueue = batchedEventQueue.nonDiscrete;
    if (eventQueue === null) {
      eventQueue = batchedEventQueue.nonDiscrete = createEventQueue();
    }
  }
  let eventQueueArr;
  if (capture) {
    eventQueueArr = eventQueue.capture;
  } else {
    eventQueueArr = eventQueue.bubble;
  }
  eventQueueArr.push(eventObject);

  if (batchedEventQueue.phase === AFTER_EVENT_PHASE) {
    batchedUpdates(processBatchedEventQueue, batchedEventQueue);
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
    processBatchedEventQueue(context._batchedEventQueue);
    // In order to capture and process async events from responder modules
    // we create a new event queue.
    context._eventQueue = createBatchedEventQueue(AFTER_EVENT_PHASE);
  }
}
