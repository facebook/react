/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {TopLevelType} from './TopLevelEventTypes';
import type {DispatchQueue} from './PluginModuleType';
import type {EventSystemFlags} from './EventSystemFlags';
import type {AnyNativeEvent, EventTypes} from './PluginModuleType';
import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';

import * as ModernBeforeInputEventPlugin from '../events/plugins/ModernBeforeInputEventPlugin';
import * as ModernChangeEventPlugin from '../events/plugins/ModernChangeEventPlugin';
import * as ModernEnterLeaveEventPlugin from '../events/plugins/ModernEnterLeaveEventPlugin';
import * as ModernSelectEventPlugin from '../events/plugins/ModernSelectEventPlugin';
import * as ModernSimpleEventPlugin from '../events/plugins/ModernSimpleEventPlugin';

import invariant from 'shared/invariant';

function publishEventForPlugin(
  eventTypes: EventTypes,
  eventName: string,
): boolean {
  invariant(
    !eventNameDispatchConfigs.hasOwnProperty(eventName),
    'EventPluginRegistry: More than one plugin attempted to publish the same ' +
      'event name, `%s`.',
    eventName,
  );
  const dispatchConfig = eventTypes[eventName];
  eventNameDispatchConfigs[eventName] = dispatchConfig;

  const phasedRegistrationNames = dispatchConfig.phasedRegistrationNames;
  if (phasedRegistrationNames) {
    for (const phaseName in phasedRegistrationNames) {
      if (phasedRegistrationNames.hasOwnProperty(phaseName)) {
        const phasedRegistrationName = phasedRegistrationNames[phaseName];
        publishRegistrationName(phasedRegistrationName, eventTypes, eventName);
      }
    }
    return true;
  } else if (dispatchConfig.registrationName) {
    publishRegistrationName(
      dispatchConfig.registrationName,
      eventTypes,
      eventName,
    );
    return true;
  }
  return false;
}

function publishRegistrationName(
  registrationName: string,
  eventTypes: EventTypes,
  eventName: string,
): void {
  invariant(
    !registrationNames[registrationName],
    'EventPluginRegistry: More than one plugin attempted to publish the same ' +
      'registration name, `%s`.',
    registrationName,
  );
  registrationNames[registrationName] = true;
  registrationNameDependencies[registrationName] =
    eventTypes[eventName].dependencies;

  if (__DEV__) {
    const lowerCasedName = registrationName.toLowerCase();
    possibleRegistrationNames[lowerCasedName] = registrationName;

    if (registrationName === 'onDoubleClick') {
      possibleRegistrationNames.ondblclick = registrationName;
    }
  }
}

/**
 * Mapping from event name to dispatch config
 */
export const eventNameDispatchConfigs = {};

/**
 * Mapping from registration name to plugin module
 */
export const registrationNames = {};

/**
 * Mapping from registration name to event name
 */
export const registrationNameDependencies = {};

/**
 * Mapping from lowercase registration names to the properly cased version,
 * used to warn in the case of missing event handlers. Available
 * only in __DEV__.
 * @type {Object}
 */
export const possibleRegistrationNames = __DEV__ ? {} : (null: any);
// Trust the developer to only use possibleRegistrationNames in __DEV__

function injectEventPlugin(eventTypes: EventTypes): void {
  for (const eventName in eventTypes) {
    publishEventForPlugin(eventTypes, eventName);
  }
}

export function extractEvents(
  dispatchQueue: DispatchQueue,
  topLevelType: TopLevelType,
  targetInst: null | Fiber,
  nativeEvent: AnyNativeEvent,
  nativeEventTarget: null | EventTarget,
  eventSystemFlags: EventSystemFlags,
  targetContainer: null | EventTarget,
) {
  ModernSimpleEventPlugin.extractEvents(
    dispatchQueue,
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer,
  );
  ModernEnterLeaveEventPlugin.extractEvents(
    dispatchQueue,
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer,
  );
  ModernChangeEventPlugin.extractEvents(
    dispatchQueue,
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer,
  );
  ModernSelectEventPlugin.extractEvents(
    dispatchQueue,
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer,
  );
  ModernBeforeInputEventPlugin.extractEvents(
    dispatchQueue,
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer,
  );
}

// TODO: remove top-level side effect.
injectEventPlugin(ModernSimpleEventPlugin.eventTypes);
injectEventPlugin(ModernEnterLeaveEventPlugin.eventTypes);
injectEventPlugin(ModernChangeEventPlugin.eventTypes);
injectEventPlugin(ModernSelectEventPlugin.eventTypes);
injectEventPlugin(ModernBeforeInputEventPlugin.eventTypes);
