/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

import type {AnyNativeEvent} from 'events/PluginModuleType';
import warning from 'shared/warning';
import {batchedUpdates} from 'events/ReactGenericBatching';
import {getClosestInstanceFromNode} from '../client/ReactDOMComponentTree';
import {
  eventsWithStopPropagation,
  rootEventTypesToEventComponents,
  processEventQueue,
  listenToResponderEventTypesImpl,
  type PartialEventObject,
} from './DOMEventResponderSystem';
import type {ReactEventResponderEventType} from 'shared/ReactTypes';

let currentOwner = null;

export type EventQueue = {
  bubble: null | Array<$Shape<PartialEventObject>>,
  capture: null | Array<$Shape<PartialEventObject>>,
  discrete: boolean,
};

export function createEventQueue(): EventQueue {
  return {
    bubble: null,
    capture: null,
    discrete: false,
  };
}

export function DOMEventResponderContext() {
  this._fiber = null;
  this._responder = null;
  this._discreteEvents = null;
  this._nonDiscreteEvents = null;
  this._isBatching = true;
  this._eventQueue = null;
  this._event = null;
}

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
  const element = this._event.eventTarget.ownerDocument;
  ((listenToResponderEventTypesImpl: any): Function)(rootEventTypes, element);
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

DOMEventResponderContext.prototype.hasOwnership = function(): boolean {
  return currentOwner === this._fiber;
};

DOMEventResponderContext.prototype.requestOwnership = function(): boolean {
  if (currentOwner !== null) {
    return false;
  }
  currentOwner = this._fiber;
  return true;
};

DOMEventResponderContext.prototype.releaseOwnership = function(
  targetElement: Element | Node,
): boolean {
  if (currentOwner !== this._fiber) {
    return false;
  }
  currentOwner = null;
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
