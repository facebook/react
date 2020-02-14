/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {AnyNativeEvent} from 'legacy-events/PluginModuleType';
import type {EventSystemFlags} from 'legacy-events/EventSystemFlags';
import type {Fiber} from 'react-reconciler/src/ReactFiber';
import type {PluginModule} from 'legacy-events/PluginModuleType';
import type {ReactSyntheticEvent} from 'legacy-events/ReactSyntheticEventType';
import type {TopLevelType} from 'legacy-events/TopLevelEventTypes';

import {PLUGIN_EVENT_SYSTEM} from 'legacy-events/EventSystemFlags';
import {registrationNameModules} from 'legacy-events/EventPluginRegistry';
import {batchedUpdates} from 'legacy-events/ReactGenericBatching';
import accumulateInto from 'legacy-events/accumulateInto';

import {enableNativeTargetAsInstance} from 'shared/ReactFeatureFlags';
import {plugins} from 'legacy-events/EventPluginRegistry';
import getListener from 'legacy-events/getListener';
import {runEventsInBatch} from 'legacy-events/EventBatching';

export {getListener, registrationNameModules as registrationNames};

/**
 * Allows registered plugins an opportunity to extract events from top-level
 * native browser events.
 *
 * @return {*} An accumulation of synthetic events.
 * @internal
 */
function extractPluginEvents(
  topLevelType: TopLevelType,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
): Array<ReactSyntheticEvent> | ReactSyntheticEvent | null {
  let events = null;
  for (let i = 0; i < plugins.length; i++) {
    // Not every plugin in the ordering may be loaded at runtime.
    const possiblePlugin: PluginModule<AnyNativeEvent> = plugins[i];
    if (possiblePlugin) {
      const extractedEvents = possiblePlugin.extractEvents(
        topLevelType,
        targetInst,
        nativeEvent,
        nativeEventTarget,
        eventSystemFlags,
      );
      if (extractedEvents) {
        events = accumulateInto(events, extractedEvents);
      }
    }
  }
  return events;
}

function runExtractedPluginEventsInBatch(
  topLevelType: TopLevelType,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
) {
  const events = extractPluginEvents(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
  );
  runEventsInBatch(events);
}

export function dispatchEvent(
  target: null | Object,
  topLevelType: TopLevelType,
  nativeEvent: AnyNativeEvent,
) {
  const targetFiber = (target: null | Fiber);

  let eventTarget = null;
  if (enableNativeTargetAsInstance) {
    if (targetFiber != null) {
      eventTarget = targetFiber.stateNode.canonical;
    }
  } else {
    eventTarget = nativeEvent.target;
  }

  batchedUpdates(function() {
    // Heritage plugin event system
    runExtractedPluginEventsInBatch(
      topLevelType,
      targetFiber,
      nativeEvent,
      eventTarget,
      PLUGIN_EVENT_SYSTEM,
    );
  });
  // React Native doesn't use ReactControlledComponent but if it did, here's
  // where it would do it.
}
