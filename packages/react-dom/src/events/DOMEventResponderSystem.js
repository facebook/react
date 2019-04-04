/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

import type {ResponderContext, ResponderEvent} from 'events/EventTypes';
import {type EventSystemFlags} from 'events/EventSystemFlags';
import type {AnyNativeEvent} from 'events/PluginModuleType';
import {EventComponent} from 'shared/ReactWorkTags';
import type {
  ReactEventResponder,
  ReactEventResponderEventType,
} from 'shared/ReactTypes';
import type {DOMTopLevelEventType} from 'events/TopLevelEventTypes';
import {interactiveUpdates} from 'events/ReactGenericBatching';
import type {Fiber} from 'react-reconciler/src/ReactFiber';

import {enableEventAPI} from 'shared/ReactFeatureFlags';
import {invokeGuardedCallbackAndCatchFirstError} from 'shared/ReactErrorUtils';
import {DOMEventResponderEvent} from './DOMEventResponderEvent';
import {
  DOMEventResponderContext,
  createEventQueue,
} from './DOMEventResponderContext';

export let listenToResponderEventTypesImpl;

export function setListenToResponderEventTypes(
  _listenToResponderEventTypesImpl: Function,
) {
  listenToResponderEventTypesImpl = _listenToResponderEventTypesImpl;
}

let eventResponderContext = null;

if (enableEventAPI) {
  // We re-use the same context object many times, to improve memory/peformance
  eventResponderContext = new DOMEventResponderContext();
}

export const rootEventTypesToEventComponents: Map<
  DOMTopLevelEventType | string,
  Set<Fiber>,
> = new Map();
const PossiblyWeakSet = typeof WeakSet === 'function' ? WeakSet : Set;
export const eventsWithStopPropagation:
  | WeakSet
  | Set<$Shape<PartialEventObject>> = new PossiblyWeakSet();
const targetEventTypeCached: Map<
  Array<ReactEventResponderEventType>,
  Set<DOMTopLevelEventType>,
> = new Map();

export type PartialEventObject = {
  listener: ($Shape<PartialEventObject>) => void,
  target: Element | Document,
  type: string,
};

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
  const {
    bubble,
    capture,
    discrete,
  } = ((eventResponderContext: any): Object)._eventQueue;

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
  responerEvent: Object,
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
  const currentEventResponderContext = ((eventResponderContext: any): Object);
  currentEventResponderContext._fiber = fiber;
  currentEventResponderContext._responder = responder;
  currentEventResponderContext._event = responerEvent;
  responder.onEvent(
    ((responerEvent: any): ResponderEvent),
    ((eventResponderContext: any): ResponderContext),
    props,
    state,
  );
}

export function runResponderEventsInBatch(
  topLevelType: DOMTopLevelEventType,
  targetFiber: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: EventTarget,
  eventSystemFlags: EventSystemFlags,
): void {
  if (enableEventAPI) {
    const currentEventResponderContext = ((eventResponderContext: any): Object);
    currentEventResponderContext._eventQueue = createEventQueue();
    const responerEvent = new DOMEventResponderEvent(
      topLevelType,
      nativeEvent,
      nativeEventTarget,
      eventSystemFlags,
    );
    let node = targetFiber;
    // Traverse up the fiber tree till we find event component fibers.
    while (node !== null) {
      if (node.tag === EventComponent) {
        handleTopLevelType(topLevelType, node, responerEvent, false);
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
          responerEvent,
          true,
        );
      }
    }
    processEventQueue();
  }
}
