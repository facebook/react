/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AnyNativeEvent} from 'events/PluginModuleType';
import type {ReactEventResponderEventType} from 'shared/ReactTypes';

export type EventResponderContext = {
  event: AnyNativeEvent,
  eventTarget: Element | Document,
  eventType: string,
  isPassive: () => boolean,
  isPassiveSupported: () => boolean,
  dispatchEvent: <E>(
    eventObject: E,
    {
      capture?: boolean,
      discrete?: boolean,
      stopPropagation?: boolean,
    },
  ) => void,
  isTargetWithinElement: (
    childTarget: Element | Document,
    parentTarget: Element | Document,
  ) => boolean,
  isTargetOwned: (Element | Document) => boolean,
  isTargetWithinEventComponent: (Element | Document) => boolean,
  isPositionWithinTouchHitTarget: (x: number, y: number) => boolean,
  addRootEventTypes: (
    rootEventTypes: Array<ReactEventResponderEventType>,
  ) => void,
  removeRootEventTypes: (
    rootEventTypes: Array<ReactEventResponderEventType>,
  ) => void,
  requestOwnership: (target: Element | Document | null) => boolean,
  releaseOwnership: (target: Element | Document | null) => boolean,
  withAsyncDispatching: (func: () => void) => void,
};
