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
  if (isReplayingEvent(event)) {
    // If an event reaches this codepath then it was recently unblocked.
    // If the event is unblocked then it should never hit this codepath again after
    // the initial unblocking since we'll just dispatch it directly without queueing it
    // for replay.
    throw new Error(
      'Attempting to replay event that is already replaying. ' +
        'This should never happen. This is a bug in React.',
    );
  }
  eventsReplaying.add(event);
  replay();
  eventsReplaying.delete(event);
}

export const isReplayingEvent = (event: AnyNativeEvent) => {
  return eventsReplaying.has(event);
};
