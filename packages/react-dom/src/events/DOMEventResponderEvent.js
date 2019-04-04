/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

import type {DOMTopLevelEventType} from 'events/TopLevelEventTypes';
import type {AnyNativeEvent} from 'events/PluginModuleType';
import {
  type EventSystemFlags,
  IS_PASSIVE,
  PASSIVE_NOT_SUPPORTED,
} from 'events/EventSystemFlags';

export function DOMEventResponderEvent(
  topLevelType: DOMTopLevelEventType,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: EventTarget,
  eventSystemFlags: EventSystemFlags,
) {
  this.nativeEvent = nativeEvent;
  this.eventTarget = nativeEventTarget;
  this.eventType = topLevelType;
  this._flags = eventSystemFlags;
}

DOMEventResponderEvent.prototype.isPassive = function(): boolean {
  return (this._flags & IS_PASSIVE) !== 0;
};

DOMEventResponderEvent.prototype.isPassiveSupported = function(): boolean {
  return (this._flags & PASSIVE_NOT_SUPPORTED) === 0;
};
