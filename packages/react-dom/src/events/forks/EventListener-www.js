/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const EventListenerWWW = require('EventListener');

import typeof * as EventListenerType from '../EventListener';
import typeof * as EventListenerShimType from './EventListener-www';

export function addEventToTarget(
  target: EventTarget,
  eventType: string,
  listener: Function,
  capture: boolean,
): Function {
  return EventListenerWWW.listen(target, eventType, listener, capture);
}

export function addEventToTargetWithPassiveFlag(
  target: EventTarget,
  eventType: string,
  listener: Function,
  capture: boolean,
): Function {
  return EventListenerWWW.listenWithPassiveFlag(
    target,
    eventType,
    listener,
    capture,
  );
}

export function removeEventListener(
  target: EventTarget,
  eventType: string,
  listener: Function,
  capture: boolean,
) {
  listener.remove();
}

// Flow magic to verify the exports of this file match the original version.
// eslint-disable-next-line no-unused-vars
type Check<_X, Y: _X, X: Y = _X> = null;
// eslint-disable-next-line no-unused-expressions
(null: Check<EventListenerShimType, EventListenerType>);
