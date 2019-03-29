/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import SyntheticEvent from 'events/SyntheticEvent';
import type {AnyNativeEvent} from 'events/PluginModuleType';
import type {ReactEventResponderEventType} from 'shared/ReactTypes';

export type EventResponderContext = {
  event: AnyNativeEvent,
  eventTarget: EventTarget,
  eventType: string,
  isPassive: () => boolean,
  isPassiveSupported: () => boolean,
  dispatchEvent: (
    name: string,
    listener: (e: SyntheticEvent) => void | null,
    pressTarget: EventTarget | null,
    discrete: boolean,
    extraProperties?: Object,
  ) => void,
  isTargetWithinElement: (
    childTarget: EventTarget,
    parentTarget: EventTarget,
  ) => boolean,
  isTargetOwned: EventTarget => boolean,
  isTargetWithinEventComponent: EventTarget => boolean,
  isPositionWithinTouchHitTarget: (x: number, y: number) => boolean,
  addRootEventTypes: (
    rootEventTypes: Array<ReactEventResponderEventType>,
  ) => void,
  removeRootEventTypes: (
    rootEventTypes: Array<ReactEventResponderEventType>,
  ) => void,
  requestOwnership: (target: EventTarget | null) => boolean,
  releaseOwnership: (target: EventTarget | null) => boolean,
};
