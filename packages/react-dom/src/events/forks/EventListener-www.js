/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  type ListenerType,
  PASSIVE_DISABLED,
  PASSIVE_FALLBACK,
  PASSIVE_TRUE,
} from 'events/ListenerTypes';

const EventListenerWWW = require('EventListener');

import typeof * as EventListenerType from '../EventListener';
import typeof * as EventListenerShimType from './EventListener-www';

export function addEventBubbleListener(
  element: Element,
  eventType: string,
  listener: Function,
  listenerType: ListenerType,
): void {
  if (listenerType === PASSIVE_DISABLED || listenerType === PASSIVE_FALLBACK) {
    EventListenerWWW.listen(element, eventType, listener);
  } else {
    EventListenerWWW.listen(
      element,
      eventType,
      listener,
      listenerType === PASSIVE_TRUE,
    );
  }
}

export function addEventCaptureListener(
  element: Element,
  eventType: string,
  listener: Function,
  listenerType: ListenerType,
): void {
  if (listenerType === PASSIVE_DISABLED || listenerType === PASSIVE_FALLBACK) {
    EventListenerWWW.capture(element, eventType, listener);
  } else {
    EventListenerWWW.capture(
      element,
      eventType,
      listener,
      listenerType === PASSIVE_TRUE,
    );
  }
}

// Flow magic to verify the exports of this file match the original version.
// eslint-disable-next-line no-unused-vars
type Check<_X, Y: _X, X: Y = _X> = null;
// eslint-disable-next-line no-unused-expressions
(null: Check<EventListenerShimType, EventListenerType>);
