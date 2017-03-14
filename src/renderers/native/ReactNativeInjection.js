/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeInjection
 * @flow
 */
'use strict';

/**
 * Make sure essential globals are available and are patched correctly. Please don't remove this
 * line. Bundles created by react-packager `require` it before executing any application code. This
 * ensures it exists in the dependency graph and can be `require`d.
 * TODO: require this in packager, not in React #10932517
 */
require('InitializeCore');

var EventPluginHub = require('EventPluginHub');
var EventPluginUtils = require('EventPluginUtils');
var RCTEventEmitter = require('RCTEventEmitter');
var ReactNativeBridgeEventPlugin = require('ReactNativeBridgeEventPlugin');
var ReactNativeComponentTree = require('ReactNativeComponentTree');
var ReactNativeEventEmitter = require('ReactNativeEventEmitter');
var ReactNativeEventPluginOrder = require('ReactNativeEventPluginOrder');
var ReactNativeGlobalResponderHandler = require('ReactNativeGlobalResponderHandler');
var ResponderEventPlugin = require('ResponderEventPlugin');

function inject() {
  /**
   * Register the event emitter with the native bridge
   */
  RCTEventEmitter.register(ReactNativeEventEmitter);

  /**
   * Inject module for resolving DOM hierarchy and plugin ordering.
   */
  EventPluginHub.injection.injectEventPluginOrder(ReactNativeEventPluginOrder);
  EventPluginUtils.injection.injectComponentTree(ReactNativeComponentTree);

  ResponderEventPlugin.injection.injectGlobalResponderHandler(
    ReactNativeGlobalResponderHandler,
  );

  /**
   * Some important event plugins included by default (without having to require
   * them).
   */
  EventPluginHub.injection.injectEventPluginsByName({
    ResponderEventPlugin: ResponderEventPlugin,
    ReactNativeBridgeEventPlugin: ReactNativeBridgeEventPlugin,
  });
}

module.exports = {
  inject: inject,
};
