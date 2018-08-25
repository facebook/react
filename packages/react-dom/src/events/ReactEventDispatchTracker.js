/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AnyNativeEvent} from 'events/PluginModuleType';

const tracker = typeof WeakSet === 'undefined' ? null : new WeakSet();
const trackedProperty = '__react_event_tracking:' + Math.random();

export function trackEventDispatch(event: AnyNativeEvent) {
  if (tracker != null) {
    tracker.add(event);
  } else {
    // Only process each native event once
    event[trackedProperty] = true;
  }
}

export function removeTrackedEvent(event: AnyNativeEvent) {
  if (tracker != null) {
    tracker.delete(event);
  } else {
    event[trackedProperty] = false;
  }
}

export function hasEventDispatched(event: AnyNativeEvent): boolean {
  if (tracker != null) {
    return tracker.has(event);
  }

  return (
    event.hasOwnProperty(trackedProperty) && event[trackedProperty] === true
  );
}
