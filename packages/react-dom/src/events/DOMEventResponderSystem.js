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
import SyntheticEvent from 'events/SyntheticEvent';
import {runEventsInBatch} from 'events/EventBatching';
import {interactiveUpdates} from 'events/ReactGenericBatching';
import {executeDispatch} from 'events/EventPluginUtils';
import type {Fiber} from 'react-reconciler/src/ReactFiber';

import {listenToEventResponderEventTypes} from '../client/ReactDOMComponent';
import {getClosestInstanceFromNode} from '../client/ReactDOMComponentTree';

import {enableEventAPI} from 'shared/ReactFeatureFlags';

const rootEventTypesToEventComponents: Map<
  DOMTopLevelEventType | string,
  Set<Fiber>,
> = new Map();
const targetEventTypeCached: Map<
  Array<ReactEventResponderEventType>,
  Set<DOMTopLevelEventType>,
> = new Map();

type EventListener = (event: SyntheticEvent) => void;

function copyEventProperties(eventData, syntheticEvent) {
  for (let propName in eventData) {
    syntheticEvent[propName] = eventData[propName];
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
}

DOMEventResponderContext.prototype.isPassive = function(): boolean {
  return (this._flags & IS_PASSIVE) !== 0;
};

DOMEventResponderContext.prototype.isPassiveSupported = function(): boolean {
  return (this._flags & PASSIVE_NOT_SUPPORTED) === 0;
};

DOMEventResponderContext.prototype.dispatchEvent = function(
  eventName: string,
  eventListener: EventListener,
  eventTarget: AnyNativeEvent,
  discrete: boolean,
  extraProperties?: Object,
): void {
  const eventTargetFiber = getClosestInstanceFromNode(eventTarget);
  const syntheticEvent = SyntheticEvent.getPooled(
    null,
    eventTargetFiber,
    this.event,
    eventTarget,
  );
  if (extraProperties !== undefined) {
    copyEventProperties(extraProperties, syntheticEvent);
  }
  syntheticEvent.type = eventName;
  syntheticEvent._dispatchInstances = [eventTargetFiber];
  syntheticEvent._dispatchListeners = [eventListener];

  if (this._isBatching) {
    let events;
    if (discrete) {
      events = this._discreteEvents;
      if (events === null) {
        events = this._discreteEvents = [];
      }
    } else {
      events = this._nonDiscreteEvents;
      if (events === null) {
        events = this._nonDiscreteEvents = [];
      }
    }
    events.push(syntheticEvent);
  } else {
    if (discrete) {
      interactiveUpdates(() => {
        executeDispatch(syntheticEvent, eventListener, eventTargetFiber);
      });
    } else {
      executeDispatch(syntheticEvent, eventListener, eventTargetFiber);
    }
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
  listenToEventResponderEventTypes(rootEventTypes, element);
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

DOMEventResponderContext.prototype.isTargetOwned = function() {
  // TODO
};

DOMEventResponderContext.prototype.requestOwnership = function() {
  // TODO
};

DOMEventResponderContext.prototype.releaseOwnership = function() {
  // TODO
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
  targetFiber: Fiber,
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
    // Run batched events
    const discreteEvents = context._discreteEvents;
    if (discreteEvents !== null) {
      interactiveUpdates(() => {
        runEventsInBatch(discreteEvents);
      });
    }
    const nonDiscreteEvents = context._nonDiscreteEvents;
    if (nonDiscreteEvents !== null) {
      runEventsInBatch(nonDiscreteEvents);
    }
    context._isBatching = false;
  }
}
