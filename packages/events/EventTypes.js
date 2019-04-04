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

export type ResponderEvent = {
  nativeEvent: AnyNativeEvent,
  target: Element | Document,
  type: string,
  passive: boolean,
  passiveSupported: boolean,
};

export type ResponderContext = {
  dispatchEvent: (
    eventObject: Object,
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
  isTargetWithinEventComponent: (Element | Document) => boolean,
  isPositionWithinTouchHitTarget: (x: number, y: number) => boolean,
  addRootEventTypes: (
    document: Document,
    rootEventTypes: Array<ReactEventResponderEventType>,
  ) => void,
  removeRootEventTypes: (
    rootEventTypes: Array<ReactEventResponderEventType>,
  ) => void,
  hasOwnership: () => boolean,
  requestOwnership: () => boolean,
  releaseOwnership: () => boolean,
  setTimeout: (func: () => void, timeout: number) => TimeoutID,
};
