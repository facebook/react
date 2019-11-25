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
} from 'legacy-events/EventSystemFlags';
import type {ReactListenerInstance, EventPriority} from 'shared/ReactTypes';
import type {ReactDOMListener} from 'shared/ReactDOMTypes';

import type {Fiber} from 'react-reconciler/src/ReactFiber';
import {
  batchedEventUpdates,
  discreteUpdates,
  flushDiscreteUpdatesIfNeeded,
  executeUserEventHandler,
} from 'legacy-events/ReactGenericBatching';
import type {AnyNativeEvent} from 'legacy-events/PluginModuleType';
import {getEventPriority} from './SimpleEventPlugin';

import {
  ContinuousEvent,
  UserBlockingEvent,
  DiscreteEvent,
} from 'shared/ReactTypes';
import {HostComponent, ScopeComponent} from 'shared/ReactWorkTags';

// Intentionally not named imports because Rollup would use dynamic dispatch for
// CommonJS interop named imports.
import * as Scheduler from 'scheduler';

const {
  unstable_UserBlockingPriority: UserBlockingPriority,
  unstable_runWithPriority: runWithPriority,
} = Scheduler;
const arrayFrom = Array.from;

type EventProperties = {|
  currentTarget: null | Document | Element,
  eventPhase: 0 | 1 | 2 | 3,
  stopImmediatePropagation: boolean,
  stopPropagation: boolean,
|};

type RootEventListenerInstance = {|
  active: Set<ReactListenerInstance<ReactDOMListener>>,
  passive: Set<ReactListenerInstance<ReactDOMListener>>,
|};

type DOMListenerInstance = {|
  capture: Array<ReactListenerInstance<ReactDOMListener>>,
  bubble: Array<ReactListenerInstance<ReactDOMListener>>,
|};

type RootEventListenerInstances = Map<string, RootEventListenerInstance>;

const rootCaptureEventListenerInstances: RootEventListenerInstances = new Map();
const rootBubbleEventListenerInstances: RootEventListenerInstances = new Map();

export const customEventPriorities: Map<string, EventPriority> = new Map();

function getEventPriorityForType(type: string): EventPriority {
  return customEventPriorities.get(type) || getEventPriority((type: any));
}

function getTargetListenerInstances(
  eventType: string,
  target: null | Fiber,
  isPassive: boolean,
): DOMListenerInstance {
  const captureEventListeners = [];
  const bubbleEventListeners = [];
  let lastHostComponent = null;
  let propagationDepth = 0;

  let currentFiber = target;
  while (currentFiber !== null) {
    const {dependencies, tag} = currentFiber;
    if (
      (tag === HostComponent || tag === ScopeComponent) &&
      dependencies !== null
    ) {
      if (tag === HostComponent) {
        // Get the host component (DOM element) from the fiber
        lastHostComponent = currentFiber.stateNode;
      }
      const listeners = dependencies.listeners;
      if (listeners !== null) {
        let listenerInstance = listeners.firstInstance;
        while (listenerInstance !== null) {
          const listener = listenerInstance.listener;
          if (
            listener.root === false &&
            listener.type === eventType &&
            listener.passive === isPassive
          ) {
            listenerInstance.currentTarget = lastHostComponent;
            listenerInstance.propagationDepth = propagationDepth;
            if (listener.capture) {
              captureEventListeners.push(listenerInstance);
            } else {
              bubbleEventListeners.push(listenerInstance);
            }
          }
          listenerInstance = listenerInstance.next;
        }
        propagationDepth++;
      }
    }
    currentFiber = currentFiber.return;
  }
  return {capture: captureEventListeners, bubble: bubbleEventListeners};
}

function monkeyPatchNativeEvent(nativeEvent: any): EventProperties {
  if (nativeEvent._reactEventProperties) {
    return nativeEvent._reactEventProperties;
  }
  const eventProperties = {
    currentTarget: null,
    eventPhase: 0,
    stopImmediatePropagation: false,
    stopPropagation: false,
  };
  // $FlowFixMe: prevent Flow complaining about needing a value
  Object.defineProperty(nativeEvent, 'currentTarget', {
    get() {
      return eventProperties.currentTarget;
    },
  });
  // $FlowFixMe: prevent Flow complaning about needing a value
  Object.defineProperty(nativeEvent, 'eventPhase', {
    get() {
      return eventProperties.eventPhase;
    },
  });
  nativeEvent.stopPropagation = () => {
    eventProperties.stopPropagation = true;
  };
  nativeEvent.stopImmediatePropagation = () => {
    eventProperties.stopImmediatePropagation = true;
    eventProperties.stopPropagation = true;
  };
  nativeEvent._reactEventProperties = eventProperties;
  return eventProperties;
}

function dispatchEvent(
  listenerInstance: ReactListenerInstance<ReactDOMListener>,
  eventProperties: EventProperties,
  nativeEvent: AnyNativeEvent,
  document: Document | null,
): void {
  const callback = listenerInstance.listener.callback;
  // For root instances, the currentTarget will be null,
  // which for those cases means we should use the document.
  eventProperties.currentTarget = listenerInstance.currentTarget || document;
  listenerInstance.currentTarget = null;
  executeUserEventHandler(callback, nativeEvent);
}

function shouldStopPropagation(
  eventProperties: EventProperties,
  lastPropagationDepth: void | number,
  propagationDepth: number,
): boolean {
  return (
    (eventProperties.stopPropagation === true &&
      lastPropagationDepth !== propagationDepth) ||
    eventProperties.stopImmediatePropagation === true
  );
}

function dispatchCaptureEventListeners(
  eventProperties: EventProperties,
  listenerInstances: Array<ReactListenerInstance<ReactDOMListener>>,
  nativeEvent: AnyNativeEvent,
  document: Document | null,
) {
  const end = listenerInstances.length - 1;
  let lastPropagationDepth;
  for (let i = end; i >= 0; i--) {
    const listenerInstance = listenerInstances[i];
    const {propagationDepth} = listenerInstance;
    if (
      // When document is not null, we know its a root event
      (document === null || i === end) &&
      shouldStopPropagation(
        eventProperties,
        lastPropagationDepth,
        propagationDepth,
      )
    ) {
      return;
    }
    dispatchEvent(listenerInstance, eventProperties, nativeEvent, document);
    lastPropagationDepth = propagationDepth;
  }
}

function dispatchBubbleEventListeners(
  eventProperties: EventProperties,
  listenerInstances: Array<ReactListenerInstance<ReactDOMListener>>,
  nativeEvent: AnyNativeEvent,
  document: Document | null,
) {
  const length = listenerInstances.length;
  let lastPropagationDepth;
  for (let i = 0; i < length; i++) {
    const listenerInstance = listenerInstances[i];
    const {propagationDepth} = listenerInstance;
    if (
      // When document is not null, we know its a root event
      (document === null || i === 0) &&
      shouldStopPropagation(
        eventProperties,
        lastPropagationDepth,
        propagationDepth,
      )
    ) {
      return;
    }
    dispatchEvent(listenerInstance, eventProperties, nativeEvent, document);
    lastPropagationDepth = propagationDepth;
  }
}

function dispatchEventListenersByPhase(
  captureTargetListenerInstances: Array<
    ReactListenerInstance<ReactDOMListener>,
  >,
  bubbleTargetListenerInstances: Array<ReactListenerInstance<ReactDOMListener>>,
  rootCaptureListenerInstances: Array<ReactListenerInstance<ReactDOMListener>>,
  rootBubbleListenerInstances: Array<ReactListenerInstance<ReactDOMListener>>,
  nativeEvent: AnyNativeEvent,
): void {
  // We only pass this variable to root instance dispatchers
  // below. This is because the currentTarget of root dispatches
  // must be the current owner document.
  const document = (nativeEvent.target: any).ownerDocument;
  const eventProperties = monkeyPatchNativeEvent(nativeEvent);
  // Capture phase
  eventProperties.eventPhase = 1;
  // Dispatch capture root event listeners
  dispatchCaptureEventListeners(
    eventProperties,
    rootCaptureListenerInstances,
    nativeEvent,
    document,
  );
  // Dispatch capture target event listeners
  dispatchCaptureEventListeners(
    eventProperties,
    captureTargetListenerInstances,
    nativeEvent,
    null,
  );
  eventProperties.stopImmediatePropagation = false;
  eventProperties.stopPropagation = false;
  // Bubble phase
  eventProperties.eventPhase = 3;
  // Dispatch bubble target event listeners
  dispatchBubbleEventListeners(
    eventProperties,
    bubbleTargetListenerInstances,
    nativeEvent,
    null,
  );
  // Dispatch bubble root event listeners
  dispatchBubbleEventListeners(
    eventProperties,
    rootBubbleListenerInstances,
    nativeEvent,
    document,
  );
}

function dispatchEventListenersAtPriority(
  eventType: string,
  captureTargetListenerInstances: Array<
    ReactListenerInstance<ReactDOMListener>,
  >,
  bubbleTargetListenerInstances: Array<ReactListenerInstance<ReactDOMListener>>,
  rootCaptureListenerInstances: Array<ReactListenerInstance<ReactDOMListener>>,
  rootBubbleListenerInstances: Array<ReactListenerInstance<ReactDOMListener>>,
  nativeEvent: AnyNativeEvent,
): void {
  const eventPriority = getEventPriorityForType(eventType);
  switch (eventPriority) {
    case DiscreteEvent: {
      flushDiscreteUpdatesIfNeeded(nativeEvent.timeStamp);
      discreteUpdates(() =>
        dispatchEventListenersByPhase(
          captureTargetListenerInstances,
          bubbleTargetListenerInstances,
          rootCaptureListenerInstances,
          rootBubbleListenerInstances,
          nativeEvent,
        ),
      );
      break;
    }
    case UserBlockingEvent: {
      runWithPriority(UserBlockingPriority, () =>
        dispatchEventListenersByPhase(
          captureTargetListenerInstances,
          bubbleTargetListenerInstances,
          rootCaptureListenerInstances,
          rootBubbleListenerInstances,
          nativeEvent,
        ),
      );
      break;
    }
    case ContinuousEvent: {
      dispatchEventListenersByPhase(
        captureTargetListenerInstances,
        bubbleTargetListenerInstances,
        rootCaptureListenerInstances,
        rootBubbleListenerInstances,
        nativeEvent,
      );
      break;
    }
  }
}

function getRootListenerInstances(
  type: string,
  passive: boolean,
  capture: boolean,
): Set<ReactListenerInstance<ReactDOMListener>> {
  const rootEventListenerInstances = capture
    ? rootCaptureEventListenerInstances
    : rootBubbleEventListenerInstances;
  let listenerInstances = rootEventListenerInstances.get(type);

  if (listenerInstances === undefined) {
    listenerInstances = {
      active: new Set(),
      passive: new Set(),
    };
    rootEventListenerInstances.set(type, listenerInstances);
  }
  return passive ? listenerInstances.passive : listenerInstances.active;
}

export function dispatchEventForListenerEventSystem(
  eventType: string,
  targetFiber: null | Fiber,
  nativeEvent: AnyNativeEvent,
  eventSystemFlags: EventSystemFlags,
): void {
  const isPassiveEvent = (eventSystemFlags & IS_PASSIVE) !== 0;
  const isNativePassiveSupported =
    (eventSystemFlags & PASSIVE_NOT_SUPPORTED) === 0;
  // We only get passed the isNativePassiveSupported flag when passive
  // was request on the DOM event listener, but because of browser support
  // it was not possible to use it.
  const isPassive = isPassiveEvent || !isNativePassiveSupported;
  // Get target event listeners in their propagation order (non root events)
  const {
    capture: captureTargetListenerInstances,
    bubble: bubbleTargetListenerInstances,
  } = getTargetListenerInstances(eventType, targetFiber, isPassive);
  const rootCaptureListenerInstances = arrayFrom(
    getRootListenerInstances(eventType, isPassive, true),
  );
  const rootBubbleListenerInstances = arrayFrom(
    getRootListenerInstances(eventType, isPassive, false),
  );
  if (
    captureTargetListenerInstances.length !== 0 ||
    bubbleTargetListenerInstances.length !== 0 ||
    rootCaptureListenerInstances.length !== 0 ||
    rootBubbleListenerInstances.length !== 0
  ) {
    batchedEventUpdates(() =>
      dispatchEventListenersAtPriority(
        eventType,
        captureTargetListenerInstances,
        bubbleTargetListenerInstances,
        rootCaptureListenerInstances,
        rootBubbleListenerInstances,
        nativeEvent,
      ),
    );
  }
}

function getRootListenerInstancesForInstance(
  listenerInstance: ReactListenerInstance<ReactDOMListener>,
): Set<ReactListenerInstance<ReactDOMListener>> {
  const {capture, passive, type} = listenerInstance.listener;
  return getRootListenerInstances(type, passive, capture);
}

export function addRootListenerInstance(
  listenerInstance: ReactListenerInstance<ReactDOMListener>,
): void {
  const listenerInstances = getRootListenerInstancesForInstance(
    listenerInstance,
  );
  listenerInstances.add(listenerInstance);
}

export function removeRootListenerInstance(
  listenerInstance: ReactListenerInstance<ReactDOMListener>,
): void {
  const listenerInstances = getRootListenerInstancesForInstance(
    listenerInstance,
  );
  listenerInstances.delete(listenerInstance);
}
