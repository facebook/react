/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AnyNativeEvent} from 'events/PluginModuleType';

const lastTarget = '__$react_event_tracking:' + Math.random();

type TrackableEvent = AnyNativeEvent & {
  [lastTarget: string]: Node,
};

export function trackEventDispatch(event: TrackableEvent) {
  event[lastTarget] = event.currentTarget;
}

export function hasEventDispatched(event: TrackableEvent): boolean {
  if (!event.hasOwnProperty(lastTarget)) {
    return false;
  }

  return event[lastTarget] !== event.currentTarget;
}
