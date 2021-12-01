/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {AnyNativeEvent} from '../events/PluginModuleType';

const eventsReplaying = new Set();

// This exists to avoid circular dependency between ReactDOMEventReplaying
// and DOMPluginEventSystem
export function replayEventWrapper(event: AnyNativeEvent, replay: () => void) {
  eventsReplaying.add(event);
  replay();
  eventsReplaying.delete(event);
}

export const isReplayingEvent = (event: AnyNativeEvent) => {
  return eventsReplaying.has(event);
};
