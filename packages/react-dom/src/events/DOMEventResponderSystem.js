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
import type {ReactEventResponder} from 'shared/ReactTypes';
import warning from 'shared/warning';
import type {DOMTopLevelEventType} from 'events/TopLevelEventTypes';
import SyntheticEvent from 'events/SyntheticEvent';
import {runEventsInBatch} from 'events/EventBatching';
import {interactiveUpdates} from 'events/ReactGenericBatching';
import type {Fiber} from 'react-reconciler/src/ReactFiber';

import {getClosestInstanceFromNode} from '../client/ReactDOMComponentTree';

// Event responders provide us an array of target event types.
// To ensure we fire the right responders for given events, we check
// if the incoming event type is actually relevant for an event
// responder. Instead of doing an O(n) lookup on the event responder
// target event types array each time, we instead create a Set for
// faster O(1) lookups.
export const eventResponderValidEventTypes: Map<
  ReactEventResponder,
  Set<DOMTopLevelEventType>,
> = new Map();

type EventListener = (event: SyntheticEvent) => void;

// TODO add context methods for dispatching events
function DOMEventResponderContext(
  topLevelType: DOMTopLevelEventType,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: EventTarget,
  eventSystemFlags: EventSystemFlags,
) {
  this.event = nativeEvent;
  this.eventType = topLevelType;
  this.eventTarget = nativeEventTarget;
  this._flags = eventSystemFlags;
  this._fiber = null;
  this._responder = null;
  this._discreteEvents = null;
  this._nonDiscreteEvents = null;
}

DOMEventResponderContext.prototype.isPassive = function(): boolean {
  return (this._flags & IS_PASSIVE) !== 0;
};

DOMEventResponderContext.prototype.isPassiveSupported = function(): boolean {
  return (this._flags & PASSIVE_NOT_SUPPORTED) === 0;
};

function copyEventProperties(eventData, syntheticEvent) {
  for (let propName in eventData) {
    syntheticEvent[propName] = eventData[propName];
  }
}

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
};

DOMEventResponderContext.prototype._runEventsInBatch = function(): void {
  if (this._discreteEvents !== null) {
    interactiveUpdates(() => {
      runEventsInBatch(this._discreteEvents);
    });
  }
  if (this._nonDiscreteEvents !== null) {
    runEventsInBatch(this._nonDiscreteEvents);
  }
};

function createValidEventTypeSet(targetEventTypes): Set<DOMTopLevelEventType> {
  const eventTypeSet = new Set();
  // Go through each target event type of the event responder
  for (let i = 0, length = targetEventTypes.length; i < length; ++i) {
    const targetEventType = targetEventTypes[i];

    if (typeof targetEventType === 'string') {
      eventTypeSet.add(((targetEventType: any): DOMTopLevelEventType));
    } else {
      if (__DEV__) {
        warning(
          typeof targetEventType === 'object' && targetEventType !== null,
          'Event Responder: invalid entry in targetEventTypes array. ' +
            'Entry must be string or an object. Instead, got %s.',
          targetEventType,
        );
      }
      const targetEventConfigObject = ((targetEventType: any): {
        name: DOMTopLevelEventType,
        passive?: boolean,
        capture?: boolean,
      });
      eventTypeSet.add(targetEventConfigObject.name);
    }
  }
  return eventTypeSet;
}

function handleTopLevelType(
  topLevelType: DOMTopLevelEventType,
  fiber: Fiber,
  context: Object,
): void {
  const responder: ReactEventResponder = fiber.type.responder;
  let {props, state} = fiber.stateNode;
  let validEventTypesForResponder = eventResponderValidEventTypes.get(
    responder,
  );

  if (validEventTypesForResponder === undefined) {
    validEventTypesForResponder = createValidEventTypeSet(
      responder.targetEventTypes,
    );
    eventResponderValidEventTypes.set(responder, validEventTypesForResponder);
  }
  if (!validEventTypesForResponder.has(topLevelType)) {
    return;
  }
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
      handleTopLevelType(topLevelType, node, context);
    }
    node = node.return;
  }
  context._runEventsInBatch();
}
