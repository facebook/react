/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  ReactNativeBaseComponentViewConfig,
  ViewConfigGetter,
} from './ReactNativeTypes';

import invariant from 'fbjs/lib/invariant';

// Event configs
export const customBubblingEventTypes = {};
export const customDirectEventTypes = {};
export const eventTypes = {};

const viewConfigCallbacks = new Map();
const viewConfigs = new Map();

function processEventTypes(
  viewConfig: ReactNativeBaseComponentViewConfig,
): void {
  const {bubblingEventTypes, directEventTypes} = viewConfig;

  if (__DEV__) {
    if (bubblingEventTypes != null && directEventTypes != null) {
      for (const topLevelType in directEventTypes) {
        invariant(
          bubblingEventTypes[topLevelType] == null,
          'Event cannot be both direct and bubbling: %s',
          topLevelType,
        );
      }
    }
  }

  if (bubblingEventTypes != null) {
    for (const topLevelType in bubblingEventTypes) {
      if (customBubblingEventTypes[topLevelType] == null) {
        eventTypes[topLevelType] = customBubblingEventTypes[topLevelType] =
          bubblingEventTypes[topLevelType];
      }
    }
  }

  if (directEventTypes != null) {
    for (const topLevelType in directEventTypes) {
      if (customDirectEventTypes[topLevelType] == null) {
        eventTypes[topLevelType] = customDirectEventTypes[topLevelType] =
          directEventTypes[topLevelType];
      }
    }
  }
}

/**
 * Registers a native view/component by name.
 * A callback is provided to load the view config from UIManager.
 * The callback is deferred until the view is actually rendered.
 * This is done to avoid causing Prepack deopts.
 */
export function register(name: string, callback: ViewConfigGetter): string {
  invariant(
    !viewConfigCallbacks.has(name),
    'Tried to register two views with the same name %s',
    name,
  );
  viewConfigCallbacks.set(name, callback);
  return name;
}

/**
 * Retrieves a config for the specified view.
 * If this is the first time the view has been used,
 * This configuration will be lazy-loaded from UIManager.
 */
export function get(name: string): ReactNativeBaseComponentViewConfig {
  let viewConfig;
  if (!viewConfigs.has(name)) {
    const callback = viewConfigCallbacks.get(name);
    invariant(
      typeof callback === 'function',
      'View config not found for name %s',
      name,
    );
    viewConfigCallbacks.set(name, null);
    viewConfig = callback();
    processEventTypes(viewConfig);
    viewConfigs.set(name, viewConfig);
  } else {
    viewConfig = viewConfigs.get(name);
  }
  invariant(viewConfig, 'View config not found for name %s', name);
  return viewConfig;
}
