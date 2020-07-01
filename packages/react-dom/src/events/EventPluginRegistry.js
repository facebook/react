/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {TopLevelType} from './TopLevelEventTypes';
import type {EventTypes} from './PluginModuleType';

import invariant from 'shared/invariant';

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
        publishRegistrationName(
          phasedRegistrationName,
          eventTypes[eventName].dependencies,
        );
      }
    }
    return true;
  } else if (dispatchConfig.registrationName) {
    publishRegistrationName(
      dispatchConfig.registrationName,
      eventTypes[eventName].dependencies,
    );
    return true;
  }
  return false;
}

function publishRegistrationName(
  registrationName: string,
  dependencies: ?Array<TopLevelType>,
): void {
  invariant(
    !registrationNames[registrationName],
    'EventPluginRegistry: More than one plugin attempted to publish the same ' +
      'registration name, `%s`.',
    registrationName,
  );
  registrationNames[registrationName] = true;
  registrationNameDependencies[registrationName] = dependencies;

  if (__DEV__) {
    const lowerCasedName = registrationName.toLowerCase();
    possibleRegistrationNames[lowerCasedName] = registrationName;

    if (registrationName === 'onDoubleClick') {
      possibleRegistrationNames.ondblclick = registrationName;
    }
  }
}

export function injectEventPlugin(eventTypes: EventTypes): void {
  for (const eventName in eventTypes) {
    publishEventForPlugin(eventTypes, eventName);
  }
}
