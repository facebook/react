/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {AnyNativeEvent} from '../events/PluginModuleType';

const eventsReplayingMap = typeof WeakSet === 'function' ? new WeakSet() : null;

export const setEventIsReplaying = eventsReplayingMap
  ? (event: AnyNativeEvent) => {
      eventsReplayingMap.add(event);
    }
  : (event: AnyNativeEvent) => {
      (event: any)._reactEventisReplaying = true;
    };

export const isReplayingEvent = eventsReplayingMap
  ? (event: AnyNativeEvent) => {
      return eventsReplayingMap.has(event);
    }
  : (event: AnyNativeEvent) => {
      return !!(event: any)._reactEventisReplaying;
    };
