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
    Object.defineProperty(event, trackedProperty, {
      value: true,
    });
  }
}

export function hasEventDispatched(event: AnyNativeEvent): boolean {
  if (tracker != null) {
    return tracker.has(event);
  }

  return tracker.hasOwnProperty(trackedProperty);
}
