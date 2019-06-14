/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {EventPriority} from 'shared/ReactTypes';

export type TopLevelEventType =
  | 'topMouseDown'
  | 'topMouseMove'
  | 'topMouseUp'
  | 'topScroll'
  | 'topSelectionChange'
  | 'topTouchCancel'
  | 'topTouchEnd'
  | 'topTouchMove'
  | 'topTouchStart';

export type ReactFabricResponderEvent = {
  nativeEvent: mixed,
  target: mixed,
  type: TopLevelEventType,
};

export type ReactFabricEventResponder = {
  targetEventTypes?: Array<TopLevelEventType>,
  rootEventTypes?: Array<TopLevelEventType>,
  createInitialState?: (props: null | Object) => Object,
  stopLocalPropagation: boolean,
  onEvent?: (
    event: ReactFabricResponderEvent,
    context: ReactFabricResponderContext,
    props: null | Object,
    state: null | Object,
  ) => void,
  onEventCapture?: (
    event: ReactFabricResponderEvent,
    context: ReactFabricResponderContext,
    props: null | Object,
    state: null | Object,
  ) => void,
  onRootEvent?: (
    event: ReactFabricResponderEvent,
    context: ReactFabricResponderContext,
    props: null | Object,
    state: null | Object,
  ) => void,
  onMount?: (
    context: ReactFabricResponderContext,
    props: null | Object,
    state: null | Object,
  ) => void,
  onUnmount?: (
    context: ReactFabricResponderContext,
    props: null | Object,
    state: null | Object,
  ) => void,
  onOwnershipChange?: (
    context: ReactFabricResponderContext,
    props: null | Object,
    state: null | Object,
  ) => void,
};

export type ReactFabricResponderContext = {
  dispatchEvent: (
    eventObject: Object,
    listener: (Object) => void,
    eventPriority: EventPriority,
  ) => void,
  isTargetWithinElement: (childTarget: mixed, parentTarget: mixed) => boolean,
  isTargetWithinEventComponent: mixed => boolean,
  isTargetWithinEventResponderScope: mixed => boolean,
  isEventWithinTouchHitTarget: (event: ReactFabricResponderEvent) => boolean,
  addRootEventTypes: (rootEventTypes: Array<TopLevelEventType>) => void,
  removeRootEventTypes: (rootEventTypes: Array<TopLevelEventType>) => void,
  hasOwnership: () => boolean,
  requestResponderOwnership: () => boolean,
  requestGlobalOwnership: () => boolean,
  releaseOwnership: () => boolean,
  setTimeout: (func: () => void, timeout: number) => number,
  clearTimeout: (timerId: number) => void,
  getEventCurrentTarget(event: ReactFabricResponderEvent): Element,
  getTimeStamp: () => number,
};
