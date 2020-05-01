/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import type {
  DispatchConfig,
  ReactSyntheticEvent,
} from './ReactSyntheticEventType';
import type {TopLevelType} from './TopLevelEventTypes';

export type EventTypes = {[key: string]: DispatchConfig, ...};

export type AnyNativeEvent = Event | KeyboardEvent | MouseEvent | TouchEvent;

export type PluginName = string;

export type EventSystemFlags = number;

export type LegacyPluginModule<NativeEvent> = {
  eventTypes: EventTypes,
  extractEvents: (
    topLevelType: TopLevelType,
    targetInst: null | Fiber,
    nativeTarget: NativeEvent,
    nativeEventTarget: null | EventTarget,
    eventSystemFlags?: number,
    container?: null | EventTarget,
  ) => ?ReactSyntheticEvent,
  tapMoveThreshold?: number,
};

export type DispatchQueueItemPhaseEntry = {|
  instance: null | Fiber,
  listener: Function,
  currentTarget: EventTarget,
|};

export type DispatchQueueItemPhase = Array<DispatchQueueItemPhaseEntry>;

export type DispatchQueueItem = {|
  event: ReactSyntheticEvent,
  capture: DispatchQueueItemPhase,
  bubble: DispatchQueueItemPhase,
|};

export type DispatchQueue = Array<DispatchQueueItem>;

export type ModernPluginModule<NativeEvent> = {
  eventTypes: EventTypes,
  extractEvents: (
    dispatchQueue: DispatchQueue,
    topLevelType: TopLevelType,
    targetInst: null | Fiber,
    nativeTarget: NativeEvent,
    nativeEventTarget: null | EventTarget,
    eventSystemFlags: number,
    container: null | EventTarget,
  ) => void,
};
