/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactFiber';
import type {ReactDOMListener} from 'shared/ReactDOMTypes';
import type {AnyNativeEvent} from 'legacy-events/PluginModuleType';

import {
  ContinuousEvent,
  UserBlockingEvent,
  DiscreteEvent,
} from 'shared/ReactTypes';
import {HostComponent} from 'shared/ReactWorkTags';
import {
  batchedEventUpdates,
  discreteUpdates,
  flushDiscreteUpdatesIfNeeded,
  executeUserEventHandler,
} from 'legacy-events/ReactGenericBatching';

// Intentionally not named imports because Rollup would use dynamic dispatch for
// CommonJS interop named imports.
import * as Scheduler from 'scheduler';
import {enableListenerAPI} from 'shared/ReactFeatureFlags';
import {
  initListenersSet,
  getListenersFromNode,
} from '../client/ReactDOMComponentTree';

const {
  unstable_UserBlockingPriority: UserBlockingPriority,
  unstable_runWithPriority: runWithPriority,
} = Scheduler;
const arrayFrom = Array.from;

type EventProperties = {|
  currentTarget: null | Document | Element,
  eventPhase: number,
  stopImmediatePropagation: boolean,
  stopPropagation: boolean,
|};

const documentCaptureListeners = new Map();
const documentBubbleListeners = new Map();

function monkeyPatchNativeEvent(nativeEvent: any): EventProperties {
  if (nativeEvent._reactEventProperties) {
    const eventProperties = nativeEvent._reactEventProperties;
    eventProperties.stopImmediatePropagation = false;
    eventProperties.stopPropagation = false;
    return eventProperties;
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

function getElementListeners(
  eventType: string,
  target: null | Fiber,
): [Array<ReactDOMListener>, Array<ReactDOMListener>] {
  const captureListeners = [];
  const bubbleListeners = [];
  let propagationDepth = 0;

  let currentFiber = target;
  while (currentFiber !== null) {
    const {tag} = currentFiber;
    if (tag === HostComponent) {
      const hostInstance = currentFiber.stateNode;
      const listenersSet = getListenersFromNode(hostInstance);

      if (listenersSet !== null) {
        const listeners = Array.from(listenersSet);
        for (let i = 0; i < listeners.length; i++) {
          const listener = listeners[i];
          const {capture, type} = listener.event;
          if (type === eventType) {
            listener.depth = propagationDepth;
            if (capture === true) {
              captureListeners.push(listener);
            } else {
              bubbleListeners.push(listener);
            }
          }
        }
        propagationDepth++;
      }
    }
    currentFiber = currentFiber.return;
  }
  return [captureListeners, bubbleListeners];
}

function getDocumentListenerSet(
  type: string,
  capture: boolean,
): Set<ReactDOMListener> {
  const delegatedEventListeners = capture
    ? documentCaptureListeners
    : documentBubbleListeners;
  let listenersSet = delegatedEventListeners.get(type);

  if (listenersSet === undefined) {
    listenersSet = new Set();
    delegatedEventListeners.set(type, listenersSet);
  }
  return listenersSet;
}

function dispatchListener(
  listener: ReactDOMListener,
  eventProperties: EventProperties,
  nativeEvent: AnyNativeEvent,
): void {
  const callback = listener.callback;
  eventProperties.currentTarget = listener.instance;
  executeUserEventHandler(callback, nativeEvent);
}

function dispatchListenerAtPriority(
  listener: ReactDOMListener,
  eventProperties: EventProperties,
  nativeEvent: AnyNativeEvent,
) {
  // The callback can either null or undefined, if so we skip dispatching it
  if (listener.callback == null) {
    return;
  }
  switch (listener.event.priority) {
    case DiscreteEvent: {
      flushDiscreteUpdatesIfNeeded(nativeEvent.timeStamp);
      discreteUpdates(() =>
        dispatchListener(listener, eventProperties, nativeEvent),
      );
      break;
    }
    case UserBlockingEvent: {
      runWithPriority(UserBlockingPriority, () =>
        dispatchListener(listener, eventProperties, nativeEvent),
      );
      break;
    }
    case ContinuousEvent: {
      dispatchListener(listener, eventProperties, nativeEvent);
      break;
    }
  }
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

function dispatchCaptureListeners(
  eventProperties: EventProperties,
  listeners: Array<ReactDOMListener>,
  nativeEvent: AnyNativeEvent,
  isDocumentListener: boolean,
) {
  const end = listeners.length - 1;
  let lastPropagationDepth;
  for (let i = end; i >= 0; i--) {
    const listener = listeners[i];
    const {depth} = listener;
    if (
      (!isDocumentListener || i === end) &&
      shouldStopPropagation(eventProperties, lastPropagationDepth, depth)
    ) {
      return;
    }
    dispatchListenerAtPriority(listener, eventProperties, nativeEvent);
    lastPropagationDepth = depth;
  }
}

function dispatchBubbleListeners(
  eventProperties: EventProperties,
  listeners: Array<ReactDOMListener>,
  nativeEvent: AnyNativeEvent,
  isDocumentListener: boolean,
) {
  const length = listeners.length;
  let lastPropagationDepth;
  for (let i = 0; i < length; i++) {
    const listener = listeners[i];
    const {depth} = listener;
    if (
      // When document is not null, we know its a delegated event
      (!isDocumentListener || i === 0) &&
      shouldStopPropagation(eventProperties, lastPropagationDepth, depth)
    ) {
      return;
    }
    dispatchListenerAtPriority(listener, eventProperties, nativeEvent);
    lastPropagationDepth = depth;
  }
}

function dispatchListenersByPhase(
  captureElementListeners: Array<ReactDOMListener>,
  bubbleElementListeners: Array<ReactDOMListener>,
  captureDocumentListeners: Array<ReactDOMListener>,
  bubbleDocumentListeners: Array<ReactDOMListener>,
  nativeEvent: AnyNativeEvent,
): void {
  const eventProperties = monkeyPatchNativeEvent(nativeEvent);
  // Capture phase
  eventProperties.eventPhase = 1;
  // Dispatch capture delegated event listeners
  dispatchCaptureListeners(
    eventProperties,
    captureDocumentListeners,
    nativeEvent,
    true,
  );
  // Dispatch capture target event listeners
  dispatchCaptureListeners(
    eventProperties,
    captureElementListeners,
    nativeEvent,
    false,
  );
  eventProperties.stopPropagation = false;
  eventProperties.stopImmediatePropagation = false;
  // Bubble phase
  eventProperties.eventPhase = 3;
  // Dispatch bubble target event listeners
  dispatchBubbleListeners(
    eventProperties,
    bubbleElementListeners,
    nativeEvent,
    false,
  );
  // Dispatch bubble delegated event listeners
  dispatchBubbleListeners(
    eventProperties,
    bubbleDocumentListeners,
    nativeEvent,
    true,
  );
}

export function dispatchEventForListenerEventSystem(
  eventType: string,
  targetFiber: null | Fiber,
  nativeEvent: AnyNativeEvent,
): void {
  if (enableListenerAPI) {
    // Get target event listeners in their propagation order (non delegated events)
    const [
      captureElementListeners,
      bubbleElementListeners,
    ] = getElementListeners(eventType, targetFiber);
    const captureDocumentListeners = arrayFrom(
      getDocumentListenerSet(eventType, true),
    );
    const bubbleDocumentListeners = arrayFrom(
      getDocumentListenerSet(eventType, false),
    );

    if (
      captureElementListeners.length !== 0 ||
      bubbleElementListeners.length !== 0 ||
      captureDocumentListeners.length !== 0 ||
      bubbleDocumentListeners.length !== 0
    ) {
      batchedEventUpdates(() =>
        dispatchListenersByPhase(
          captureElementListeners,
          bubbleElementListeners,
          captureDocumentListeners,
          bubbleDocumentListeners,
          nativeEvent,
        ),
      );
    }
  }
}

function getDocumentListenerSetForListener(
  listener: ReactDOMListener,
): Set<ReactDOMListener> {
  const {capture, type} = listener.event;
  return getDocumentListenerSet(type, capture);
}

export function attachDocumentListener(listener: ReactDOMListener): void {
  const documentListenersSet = getDocumentListenerSetForListener(listener);
  documentListenersSet.add(listener);
}

export function detachDocumentListener(listener: ReactDOMListener): void {
  const documentListenersSet = getDocumentListenerSetForListener(listener);
  documentListenersSet.delete(listener);
}

export function attachElementListener(listener: ReactDOMListener): void {
  const {instance} = listener;
  let listeners = getListenersFromNode(instance);

  if (listeners === null) {
    listeners = new Set();
    initListenersSet(instance, listeners);
  }
  listeners.add(listener);
}

export function detachElementListener(listener: ReactDOMListener): void {
  const {instance} = listener;
  const listeners = getListenersFromNode(instance);

  if (listeners !== null) {
    listeners.delete(listener);
  }
}
