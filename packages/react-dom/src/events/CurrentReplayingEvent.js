/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {AnyNativeEvent} from '../events/PluginModuleType';

// This exists to avoid circular dependency between ReactDOMEventReplaying
// and DOMPluginEventSystem.

let currentReplayingEvent = null;

export function setReplayingEvent(event: AnyNativeEvent): void {
  if (__DEV__) {
    if (currentReplayingEvent !== null) {
      console.error(
        'Expected currently replaying event to be null. This error ' +
          'is likely caused by a bug in React. Please file an issue.',
      );
    }
  }
  currentReplayingEvent = event;
}

export function resetReplayingEvent(): void {
  if (__DEV__) {
    if (currentReplayingEvent === null) {
      console.error(
        'Expected currently replaying event to not be null. This error ' +
          'is likely caused by a bug in React. Please file an issue.',
      );
    }
  }
  currentReplayingEvent = null;
}

export function isReplayingEvent(event: AnyNativeEvent): boolean {
  return event === currentReplayingEvent;
}
