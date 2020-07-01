/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {DispatchConfig} from './ReactSyntheticEventType';
import type {
  AnyNativeEvent,
  LegacyPluginModule,
  ModernPluginModule,
} from './PluginModuleType';
import ModernBeforeInputEventPlugin from '../events/plugins/ModernBeforeInputEventPlugin';
import ModernChangeEventPlugin from '../events/plugins/ModernChangeEventPlugin';
import ModernEnterLeaveEventPlugin from '../events/plugins/ModernEnterLeaveEventPlugin';
import ModernSelectEventPlugin from '../events/plugins/ModernSelectEventPlugin';
import ModernSimpleEventPlugin from '../events/plugins/ModernSimpleEventPlugin';

import invariant from 'shared/invariant';

/**
 * Publishes an event so that it can be dispatched by the supplied plugin.
 *
 * @param {object} dispatchConfig Dispatch configuration for the event.
 * @param {object} PluginModule Plugin publishing the event.
 * @return {boolean} True if the event was successfully published.
 * @private
 */
function publishEventForPlugin(
  dispatchConfig: DispatchConfig,
  pluginModule:
    | LegacyPluginModule<AnyNativeEvent>
    | ModernPluginModule<AnyNativeEvent>,
  eventName: string,
): boolean {
  invariant(
    !eventNameDispatchConfigs.hasOwnProperty(eventName),
    'EventPluginRegistry: More than one plugin attempted to publish the same ' +
      'event name, `%s`.',
    eventName,
  );
  eventNameDispatchConfigs[eventName] = dispatchConfig;

  const phasedRegistrationNames = dispatchConfig.phasedRegistrationNames;
  if (phasedRegistrationNames) {
    for (const phaseName in phasedRegistrationNames) {
      if (phasedRegistrationNames.hasOwnProperty(phaseName)) {
        const phasedRegistrationName = phasedRegistrationNames[phaseName];
        publishRegistrationName(
          phasedRegistrationName,
          pluginModule,
          eventName,
        );
      }
    }
    return true;
  } else if (dispatchConfig.registrationName) {
    publishRegistrationName(
      dispatchConfig.registrationName,
      pluginModule,
      eventName,
    );
    return true;
  }
  return false;
}

/**
 * Publishes a registration name that is used to identify dispatched events.
 *
 * @param {string} registrationName Registration name to add.
 * @param {object} PluginModule Plugin publishing the event.
 * @private
 */
function publishRegistrationName(
  registrationName: string,
  pluginModule:
    | LegacyPluginModule<AnyNativeEvent>
    | ModernPluginModule<AnyNativeEvent>,
  eventName: string,
): void {
  invariant(
    !registrationNameModules[registrationName],
    'EventPluginRegistry: More than one plugin attempted to publish the same ' +
      'registration name, `%s`.',
    registrationName,
  );
  registrationNameModules[registrationName] = pluginModule;
  registrationNameDependencies[registrationName] =
    pluginModule.eventTypes[eventName].dependencies;

  if (__DEV__) {
    const lowerCasedName = registrationName.toLowerCase();
    possibleRegistrationNames[lowerCasedName] = registrationName;

    if (registrationName === 'onDoubleClick') {
      possibleRegistrationNames.ondblclick = registrationName;
    }
  }
}

/**
 * Registers plugins so that they can extract and dispatch events.
 */

/**
 * Ordered list of injected plugins.
 */
export const plugins = [];

/**
 * Mapping from event name to dispatch config
 */
export const eventNameDispatchConfigs = {};

/**
 * Mapping from registration name to plugin module
 */
export const registrationNameModules = {};

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

function injectEventPlugin(pluginModule: ModernPluginModule<any>): void {
  plugins.push(pluginModule);
  const publishedEvents = pluginModule.eventTypes;
  for (const eventName in publishedEvents) {
    publishEventForPlugin(publishedEvents[eventName], pluginModule, eventName);
  }
}

// TODO: remove top-level side effect.
injectEventPlugin(ModernSimpleEventPlugin);
injectEventPlugin(ModernEnterLeaveEventPlugin);
injectEventPlugin(ModernChangeEventPlugin);
injectEventPlugin(ModernSelectEventPlugin);
injectEventPlugin(ModernBeforeInputEventPlugin);
