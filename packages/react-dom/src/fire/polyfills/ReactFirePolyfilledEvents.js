/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {onChangeHeuristics} from './ReactFireOnChange';
import {
  onBeforeInputHeuristics,
  onCompositionEndHeuristics,
  onCompositionStartHeuristics,
  onCompositionUpdateHeuristics,
} from './ReactFireOnBeforeInput';
import {onSelectInputHeuristics} from './ReactFireOnSelect';
import {
  onMouseEnterLeaveHeuristics,
  onPointerEnterLeaveHeuristics,
} from './ReactFireEnterLeave';
import {getDomNodeEventsMap, listenTo} from '../ReactFireEvents';
import type {ProxyContext} from '../ReactFireEvents';

export const polyfilledEvents = {
  onChange: onChangeHeuristics,
  onChangeCapture: onChangeHeuristics,
  onCompositionEnd: onCompositionEndHeuristics,
  onCompositionEndCapture: onCompositionEndHeuristics,
  onCompositionStart: onCompositionStartHeuristics,
  onCompositionStartCapture: onCompositionStartHeuristics,
  onCompositionUpdate: onCompositionUpdateHeuristics,
  onCompositionUpdateCapture: onCompositionUpdateHeuristics,
  onBeforeInput: onBeforeInputHeuristics,
  onBeforeInputCapture: onBeforeInputHeuristics,
  onSelect: onSelectInputHeuristics,
  onSelectCapture: onSelectInputHeuristics,
  onMouseEnter: onMouseEnterLeaveHeuristics,
  onMouseLeave: onMouseEnterLeaveHeuristics,
  onPointerEnter: onPointerEnterLeaveHeuristics,
  onPointerLeave: onPointerEnterLeaveHeuristics,
};

export function listenToPolyfilledEvent(
  rootContainerElement: Element | Document,
  propName: string,
) {
  const [dependencies, polyfilledEventHandler] = polyfilledEvents[propName];
  const dependenciesLength = dependencies.length;
  const domNodeEventsMap = getDomNodeEventsMap(rootContainerElement);
  for (let i = 0; i < dependenciesLength; i++) {
    const dependency = dependencies[i];
    listenTo(dependency, rootContainerElement);
    const eventData = domNodeEventsMap.get(dependency);
    if (eventData !== undefined) {
      const {polyfills} = eventData;
      const polyfilledName = `${propName}-polyfill`;
      if (!polyfills.has(polyfilledName)) {
        polyfills.set(polyfilledName, polyfilledEventHandler);
      }
    }
  }
}

export function dispatchPolyfills(
  containerDomNode: Element | Document,
  eventTarget: Node | Element | Document | void | null,
  proxyContext: ProxyContext,
) {
  const {event, eventName} = proxyContext;
  const domNodeEventsMap = getDomNodeEventsMap(containerDomNode);
  const eventData = domNodeEventsMap.get(eventName);
  const processedPolyfills = new Set();

  if (eventData !== undefined) {
    const polyfills = Array.from(eventData.polyfills.entries());
    for (let i = 0; i < polyfills.length; i++) {
      const [polyfilledEventName, polyfilledEventHandler] = polyfills[i];
      if (processedPolyfills.has(polyfilledEventHandler)) {
        continue;
      }
      processedPolyfills.add(polyfilledEventHandler);
      const dispatchMechanism = polyfilledEventHandler(
        eventName,
        event,
        eventTarget,
      );
      if (dispatchMechanism === null) {
        continue;
      }
      proxyContext.eventName = polyfilledEventName;
      dispatchMechanism(proxyContext);
    }
  }
}
