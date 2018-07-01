/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactFiber';

import {getListener, runExtractedEventsInBatch} from 'events/EventPluginHub';
import {registrationNameModules} from 'events/EventPluginRegistry';
import {batchedUpdates} from 'events/ReactGenericBatching';

import type {AnyNativeEvent} from 'events/PluginModuleType';
import type {TopLevelType} from 'events/TopLevelEventTypes';

export {getListener, registrationNameModules as registrationNames};

export function dispatchEvent(
  target: null | Object,
  topLevelType: TopLevelType,
  nativeEvent: AnyNativeEvent,
) {
  const targetFiber = (target: null | Fiber);
  batchedUpdates(function() {
    runExtractedEventsInBatch(
      topLevelType,
      targetFiber,
      nativeEvent,
      nativeEvent.target,
    );
  });
  // React Native doesn't use ReactControlledComponent but if it did, here's
  // where it would do it.
}
