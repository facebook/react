/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AnyNativeEvent} from 'legacy-events/PluginModuleType';
import type {DOMTopLevelEventType} from 'legacy-events/TopLevelEventTypes';
import type {EventSystemFlags} from 'legacy-events/EventSystemFlags';
import type {Fiber} from 'react-reconciler/src/ReactFiber';

import {registrationNameDependencies} from 'legacy-events/EventPluginRegistry';

import {trapEventForPluginEventSystem} from './ReactDOMEventListener';
import {getListenerMapForElement} from './DOMEventListenerMap';
import {
  TOP_FOCUS,
  TOP_LOAD,
  TOP_ABORT,
  TOP_CANCEL,
  TOP_INVALID,
  TOP_BLUR,
  TOP_SCROLL,
  TOP_CLOSE,
  TOP_RESET,
  TOP_SUBMIT,
  TOP_CAN_PLAY,
  TOP_CAN_PLAY_THROUGH,
  TOP_DURATION_CHANGE,
  TOP_EMPTIED,
  TOP_ENCRYPTED,
  TOP_ENDED,
  TOP_ERROR,
  TOP_WAITING,
  TOP_VOLUME_CHANGE,
  TOP_TIME_UPDATE,
  TOP_SUSPEND,
  TOP_STALLED,
  TOP_SEEKING,
  TOP_SEEKED,
  TOP_PLAY,
  TOP_PAUSE,
  TOP_LOAD_START,
  TOP_LOADED_DATA,
  TOP_LOADED_METADATA,
  TOP_RATE_CHANGE,
  TOP_PROGRESS,
  TOP_PLAYING,
} from './DOMTopLevelEventTypes';

const capturePhaseEvents = new Set([
  TOP_FOCUS,
  TOP_BLUR,
  TOP_SCROLL,
  TOP_LOAD,
  TOP_ABORT,
  TOP_CANCEL,
  TOP_CLOSE,
  TOP_INVALID,
  TOP_RESET,
  TOP_SUBMIT,
  TOP_ABORT,
  TOP_CAN_PLAY,
  TOP_CAN_PLAY_THROUGH,
  TOP_DURATION_CHANGE,
  TOP_EMPTIED,
  TOP_ENCRYPTED,
  TOP_ENDED,
  TOP_ERROR,
  TOP_LOADED_DATA,
  TOP_LOADED_METADATA,
  TOP_LOAD_START,
  TOP_PAUSE,
  TOP_PLAY,
  TOP_PLAYING,
  TOP_PROGRESS,
  TOP_RATE_CHANGE,
  TOP_SEEKED,
  TOP_SEEKING,
  TOP_STALLED,
  TOP_SUSPEND,
  TOP_TIME_UPDATE,
  TOP_VOLUME_CHANGE,
  TOP_WAITING,
]);

export function listenToTopLevelEvent(
  topLevelType: DOMTopLevelEventType,
  rootContainerElement: Element,
  listenerMap: Map<DOMTopLevelEventType | string, null | (any => void)>,
): void {
  if (!listenerMap.has(topLevelType)) {
    const isCapturePhase = capturePhaseEvents.has(topLevelType);
    trapEventForPluginEventSystem(
      rootContainerElement,
      topLevelType,
      isCapturePhase,
    );
    listenerMap.set(topLevelType, null);
  }
}

export function listenToEvent(
  registrationName: string,
  rootContainerElement: Element,
): void {
  const listenerMap = getListenerMapForElement(rootContainerElement);
  const dependencies = registrationNameDependencies[registrationName];

  for (let i = 0; i < dependencies.length; i++) {
    const dependency = dependencies[i];
    listenToTopLevelEvent(dependency, rootContainerElement, listenerMap);
  }
}

export function dispatchEventForPluginEventSystem(
  topLevelType: DOMTopLevelEventType,
  eventSystemFlags: EventSystemFlags,
  nativeEvent: AnyNativeEvent,
  targetInst: null | Fiber,
  rootContainer: Document | Element,
): void {
  // TODO
}
