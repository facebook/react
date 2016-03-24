/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeDefaultInjection
 * @flow
 */
'use strict';

/**
 * Make sure essential globals are available and are patched correctly. Please don't remove this
 * line. Bundles created by react-packager `require` it before executing any application code. This
 * ensures it exists in the dependency graph and can be `require`d.
 */
require('InitializeJavaScriptAppEngine');

var EventPluginHub = require('EventPluginHub');
var EventPluginUtils = require('EventPluginUtils');
var IOSDefaultEventPluginOrder = require('IOSDefaultEventPluginOrder');
var IOSNativeBridgeEventPlugin = require('IOSNativeBridgeEventPlugin');
var NodeHandle = require('NodeHandle');
var ReactElement = require('ReactElement');
var ReactComponentEnvironment = require('ReactComponentEnvironment');
var ReactDefaultBatchingStrategy = require('ReactDefaultBatchingStrategy');
var ReactEmptyComponent = require('ReactEmptyComponent');
var ReactInstanceHandles = require('ReactInstanceHandles');
var ReactNativeComponentEnvironment = require('ReactNativeComponentEnvironment');
var ReactNativeGlobalInteractionHandler = require('ReactNativeGlobalInteractionHandler');
var ReactNativeGlobalResponderHandler = require('ReactNativeGlobalResponderHandler');
var ReactNativeMount = require('ReactNativeMount');
var ReactNativeTextComponent = require('ReactNativeTextComponent');
var ReactNativeComponent = require('ReactNativeComponent');
var ReactUpdates = require('ReactUpdates');
var ResponderEventPlugin = require('ResponderEventPlugin');
var UniversalWorkerNodeHandle = require('UniversalWorkerNodeHandle');

var invariant = require('fbjs/lib/invariant');

// Just to ensure this gets packaged, since its only caller is from Native.
require('RCTEventEmitter');
require('RCTLog');
require('JSTimersExecution');

function inject() {
  /**
   * Inject module for resolving DOM hierarchy and plugin ordering.
   */
  EventPluginHub.injection.injectEventPluginOrder(IOSDefaultEventPluginOrder);
  EventPluginHub.injection.injectInstanceHandle(ReactInstanceHandles);

  ResponderEventPlugin.injection.injectGlobalResponderHandler(
    ReactNativeGlobalResponderHandler
  );

  ResponderEventPlugin.injection.injectGlobalInteractionHandler(
    ReactNativeGlobalInteractionHandler
  );

  /**
   * Some important event plugins included by default (without having to require
   * them).
   */
  EventPluginHub.injection.injectEventPluginsByName({
    'ResponderEventPlugin': ResponderEventPlugin,
    'IOSNativeBridgeEventPlugin': IOSNativeBridgeEventPlugin
  });

  ReactUpdates.injection.injectReconcileTransaction(
    ReactNativeComponentEnvironment.ReactReconcileTransaction
  );

  ReactUpdates.injection.injectBatchingStrategy(
    ReactDefaultBatchingStrategy
  );

  ReactComponentEnvironment.injection.injectEnvironment(
    ReactNativeComponentEnvironment
  );

  var EmptyComponent = () => {
    // Can't import View at the top because it depends on React to make its composite
    var View = require('View');
    return ReactElement.createElement(View, {
      collapsable: true,
      style: { position: 'absolute' }
    });
  };
  ReactEmptyComponent.injection.injectEmptyComponent(EmptyComponent);

  EventPluginUtils.injection.injectMount(ReactNativeMount);

  ReactNativeComponent.injection.injectTextComponentClass(
    ReactNativeTextComponent
  );
  ReactNativeComponent.injection.injectGenericComponentClass(function(tag) {
    // Show a nicer error message for non-function tags
    var info = '';
    if (typeof tag === 'string' && /^[a-z]/.test(tag)) {
      info += ' Each component name should start with an uppercase letter.';
    }
    invariant(false, 'Expected a component class, got %s.%s', tag, info);
  });

  NodeHandle.injection.injectImplementation(UniversalWorkerNodeHandle);
}

module.exports = {
  inject: inject,
};
