/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule PluginModuleType
 * @flow
 */

'use strict';

import type {ReactInstance} from 'ReactInstanceType';
import type {
  DispatchConfig,
  ReactSyntheticEvent,
} from 'ReactSyntheticEventType';

export type EventTypes = {[key: string]: DispatchConfig};

export type AnyNativeEvent =
  Event |
  KeyboardEvent |
  MouseEvent |
  Touch;

export type PluginName = string;

export type PluginModule<NativeEvent> = {
  eventTypes: EventTypes,
  extractEvents: (
    topLevelType: string,
    targetInst: ReactInstance,
    nativeTarget: NativeEvent,
    nativeEventTarget: EventTarget,
  ) => null | ReactSyntheticEvent,
  didPutListener?: (
    inst: ReactInstance,
    registrationName: string,
    listener: () => void,
  ) => void,
  willDeleteListener?: (
    inst: ReactInstance,
    registrationName: string,
  ) => void,
  tapMoveThreshold?: number,
};
