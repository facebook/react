/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {onChangeHeuristics} from './polyfills/ReactFireOnChange';
import {
  onBeforeInputHeuristics,
  onCompositionEndHeuristics,
  onCompositionStartHeuristics,
  onCompositionUpdateHeuristics,
} from './polyfills/ReactFireOnBeforeInput';
import {onSelectInputHeuristics} from './polyfills/ReactFireOnSelect';
import {
  onMouseEnterLeaveHeuristics,
  onPointerEnterLeaveHeuristics,
} from './polyfills/ReactFireEnterLeave';
import {listenTo} from './ReactFireEvents';
import type {ProxyContext} from './ReactFireEvents';

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

const polyfilledEventHandlersMap = new Map();

export function listenToPolyfilledEvent(
  rootContainerElement: Element | Document,
  propName: string,
) {
  const [dependencies, polyfilledEventHandler] = polyfilledEvents[propName];
  const dependenciesLength = dependencies.length;
  for (let i = 0; i < dependenciesLength; i++) {
    const dependency = dependencies[i];
    listenTo(dependency, rootContainerElement);
    let polyfilledEventHandlers = polyfilledEventHandlersMap.get(dependency);
    if (polyfilledEventHandlers === undefined) {
      polyfilledEventHandlers = new Set();
      polyfilledEventHandlersMap.set(dependency, polyfilledEventHandlers);
    }
    polyfilledEventHandlers.add(polyfilledEventHandler);
  }
}

export function dispatchPolyfills(
  nativeEvent: Event,
  eventName: string,
  containerDomNode: Element | Document,
  eventTarget: Node | Element | Document | void | null,
  proxyContext: ProxyContext,
) {
  const polyfilledEventHandlers = polyfilledEventHandlersMap.get(eventName);
  if (polyfilledEventHandlers !== undefined) {
    const polyfilledEventHandlersArr = Array.from(polyfilledEventHandlers);

    for (let i = 0; i < polyfilledEventHandlersArr.length; i++) {
      const polyfilledEventHandler = polyfilledEventHandlersArr[i];
      polyfilledEventHandler(eventName, nativeEvent, eventTarget, proxyContext);
    }
  }
}
