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
import type {DOMTopLevelEventType} from 'events/TopLevelEventTypes';
import type {ReactEventResponder} from 'shared/ReactTypes';
import invariant from 'shared/invariant';
import warning from 'shared/warning';
import type {Fiber} from 'react-reconciler/src/ReactFiber';

// We track the active component fibers so we can traverse through
// the fiber tree and find the relative current fibers. We need to
// do this because an update might have switched an event component
// fiber to its alternate fiber.
export const currentEventComponentFibers: Set<Fiber> = new Set();

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
}

DOMEventResponderContext.prototype.isPassive = function(): boolean {
  return (this._flags & IS_PASSIVE) !== 0;
};

DOMEventResponderContext.prototype.isPassiveSupported = function(): boolean {
  return (this._flags & PASSIVE_NOT_SUPPORTED) === 0;
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
  const props = fiber.memoizedProps;
  const stateNode = fiber.stateNode;
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
  let state = stateNode.get(responder);
  if (state === undefined && responder.createInitialState !== undefined) {
    state = responder.createInitialState(props);
    stateNode.set(responder, state);
  }
  // TODO provide all the props for handleEvent
  responder.handleEvent(context, props, state);
}

export function runResponderEventsInBatch(
  topLevelType: DOMTopLevelEventType,
  targetFiber: Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: EventTarget,
  eventSystemFlags: EventSystemFlags,
): void {
  let context = new DOMEventResponderContext(
    topLevelType,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
  );
  let node = targetFiber;
  // Traverse up the fiber tree till we find event component fibers.
  while (node !== null) {
    if (node.tag === EventComponent) {
      // When we traverse the fiber tree from the target fiber, we will
      // ecounter event component fibers that might not be the current
      // fiber. This will happen frequently because of how ReactDOM
      // stores elements relative to their fibers. When we create or
      // mount elements, we store their fiber on the element. We never
      // update the fiber when the element updates to its alternate fiber,
      // we only update the props for the fiber. Furthermore, we also
      // never update the props if the element doesn't need an update.
      // That means that an element target might point to a fiber tree
      // that is stale and not the current tree. To get around this, we
      // always store the current event component in a Set and use this
      // logic to determine when we need to swith to the event component
      // fiber alternate.
      if (!currentEventComponentFibers.has(node)) {
        invariant(
          node.alternate !== null,
          'runResponderEventsInBatch failed to find the active fiber. ' +
            'This is most definitely a bug in React.',
        );
        node = node.alternate;
      }
      handleTopLevelType(topLevelType, node, context);
    }
    node = node.return;
  }
  // TODO dispatch extracted events from context (with batching)
}
