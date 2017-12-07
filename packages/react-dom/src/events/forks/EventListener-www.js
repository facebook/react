/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

var EventListenerWWW = require('EventListener');

import typeof * as EventListenerType from '../EventListener';
import typeof * as EventListenerShimType from './EventListener-www';

export function addEventListener(
  element: Element,
  eventType: string,
  listener: Function,
  useCapture: boolean,
): void {
  if (useCapture) {
    EventListenerWWW.capture(element, eventType, listener);
  } else {
    EventListenerWWW.listen(element, eventType, listener);
  }
}

// Flow magic to verify the exports of this file match the original version.
// eslint-disable-next-line no-unused-vars
type Check<_X, Y: _X, X: Y = _X> = null;
// eslint-disable-next-line no-unused-expressions
(null: Check<EventListenerShimType, EventListenerType>);
