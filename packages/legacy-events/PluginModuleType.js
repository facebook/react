/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactFiber';
import type {
  DispatchConfig,
  ReactSyntheticEvent,
} from './ReactSyntheticEventType';
import type {TopLevelType} from './TopLevelEventTypes';
import type {EventSystemFlags} from 'legacy-events/EventSystemFlags';

export type EventTypes = {[key: string]: DispatchConfig, ...};

export type AnyNativeEvent = Event | KeyboardEvent | MouseEvent | Touch;

export type PluginName = string;

export type PluginModule<NativeEvent> = {
  eventTypes: EventTypes,
  extractEvents: (
    topLevelType: TopLevelType,
    targetInst: null | Fiber,
    nativeTarget: NativeEvent,
    nativeEventTarget: null | EventTarget,
    eventSystemFlags: EventSystemFlags,
    container?: Document | Element | Node,
  ) => ?ReactSyntheticEvent,
  tapMoveThreshold?: number,
};
