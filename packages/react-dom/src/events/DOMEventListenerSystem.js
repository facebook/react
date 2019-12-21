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

import {UserBlockingEvent, DiscreteEvent} from 'shared/ReactTypes';
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
  currentTarget: null | EventTarget,
  eventPhase: number,
  stopImmediatePropagation: boolean,
  stopPropagation: boolean,
|};

const windowCaptureListeners = new Map();
const windowBubbleListeners = new Map();

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

function getWindowListenerSet(
  type: string,
  capture: boolean,
): Set<ReactDOMListener> {
  const windowEventListeners = capture
    ? windowCaptureListeners
    : windowBubbleListeners;
  let listenersSet = windowEventListeners.get(type);

  if (listenersSet === undefined) {
    listenersSet = new Set();
    windowEventListeners.set(type, listenersSet);
  }
  return listenersSet;
}

function processListener(
  listener: ReactDOMListener,
  eventProperties: EventProperties,
  nativeEvent: AnyNativeEvent,
): void {
  const callback = listener.callback;
  eventProperties.currentTarget = listener.instance;
  executeUserEventHandler(callback, nativeEvent);
}

function processListenerAtPriority(
  listener: ReactDOMListener,
  eventProperties: EventProperties,
  nativeEvent: AnyNativeEvent,
) {
  // The callback can either null or undefined, if so we skip dispatching it
  if (listener.callback == null) {
    return;
  }
  const priority = listener.event.priority;

  if (priority === DiscreteEvent) {
    flushDiscreteUpdatesIfNeeded(nativeEvent.timeStamp);
    discreteUpdates(() =>
      processListener(listener, eventProperties, nativeEvent),
    );
  } else if (priority === UserBlockingEvent) {
    runWithPriority(UserBlockingPriority, () =>
      processListener(listener, eventProperties, nativeEvent),
    );
  } else {
    // Otherwise it is a ContinuousEvent or a prioriy we do not
    // know, which means we should fallback to this anyway.
    processListener(listener, eventProperties, nativeEvent);
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

function processCaptureListeners(
  eventProperties: EventProperties,
  listeners: Array<ReactDOMListener>,
  nativeEvent: AnyNativeEvent,
) {
  const end = listeners.length - 1;
  let lastPropagationDepth;
  for (let i = end; i >= 0; i--) {
    const listener = listeners[i];
    const {depth} = listener;
    if (shouldStopPropagation(eventProperties, lastPropagationDepth, depth)) {
      return;
    }
    processListenerAtPriority(listener, eventProperties, nativeEvent);
    lastPropagationDepth = depth;
  }
}

function processBubbleListeners(
  eventProperties: EventProperties,
  listeners: Array<ReactDOMListener>,
  nativeEvent: AnyNativeEvent,
) {
  const length = listeners.length;
  let lastPropagationDepth;
  for (let i = 0; i < length; i++) {
    const listener = listeners[i];
    const {depth} = listener;
    if (shouldStopPropagation(eventProperties, lastPropagationDepth, depth)) {
      return;
    }
    processListenerAtPriority(listener, eventProperties, nativeEvent);
    lastPropagationDepth = depth;
  }
}

function processListenersByPhase(
  captureElementListeners: Array<ReactDOMListener>,
  bubbleElementListeners: Array<ReactDOMListener>,
  captureWindowListeners: Array<ReactDOMListener>,
  bubbleWindowListeners: Array<ReactDOMListener>,
  nativeEvent: AnyNativeEvent,
): void {
  const eventProperties = monkeyPatchNativeEvent(nativeEvent);
  // Capture phase
  eventProperties.eventPhase = 1;
  // Dispatch capture window event listeners
  processCaptureListeners(eventProperties, captureWindowListeners, nativeEvent);
  // Dispatch capture target event listeners
  processCaptureListeners(
    eventProperties,
    captureElementListeners,
    nativeEvent,
  );
  eventProperties.stopPropagation = false;
  eventProperties.stopImmediatePropagation = false;
  // Bubble phase
  eventProperties.eventPhase = 3;
  // Dispatch bubble target event listeners
  processBubbleListeners(eventProperties, bubbleElementListeners, nativeEvent);
  // Dispatch bubble window event listeners
  processBubbleListeners(eventProperties, bubbleWindowListeners, nativeEvent);
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
    const captureWindowListeners = arrayFrom(
      getWindowListenerSet(eventType, true),
    );
    const bubbleWindowListeners = arrayFrom(
      getWindowListenerSet(eventType, false),
    );

    if (
      captureElementListeners.length !== 0 ||
      bubbleElementListeners.length !== 0 ||
      captureWindowListeners.length !== 0 ||
      bubbleWindowListeners.length !== 0
    ) {
      batchedEventUpdates(() =>
        processListenersByPhase(
          captureElementListeners,
          bubbleElementListeners,
          captureWindowListeners,
          bubbleWindowListeners,
          nativeEvent,
        ),
      );
    }
  }
}

function getWindowListenerSetForListener(
  listener: ReactDOMListener,
): Set<ReactDOMListener> {
  const {capture, type} = listener.event;
  return getWindowListenerSet(type, capture);
}

export function attachWindowListener(listener: ReactDOMListener): void {
  const windowListenersSet = getWindowListenerSetForListener(listener);
  windowListenersSet.add(listener);
}

export function detachWindowListener(listener: ReactDOMListener): void {
  const windowListenersSet = getWindowListenerSetForListener(listener);
  windowListenersSet.delete(listener);
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
