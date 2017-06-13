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
 * TODO: require this in packager, not in React #10932517
 */
require('InitializeJavaScriptAppEngine');

var EventPluginHub = require('EventPluginHub');
var EventPluginUtils = require('EventPluginUtils');
var RCTEventEmitter = require('RCTEventEmitter');
var React = require('React');
var ReactComponentEnvironment = require('ReactComponentEnvironment');
var ReactDefaultBatchingStrategy = require('ReactDefaultBatchingStrategy');
var ReactEmptyComponent = require('ReactEmptyComponent');
var ReactNativeBridgeEventPlugin = require('ReactNativeBridgeEventPlugin');
var ReactHostComponent = require('ReactHostComponent');
var ReactNativeComponentEnvironment = require('ReactNativeComponentEnvironment');
var ReactNativeComponentTree = require('ReactNativeComponentTree');
var ReactNativeEventEmitter = require('ReactNativeEventEmitter');
var ReactNativeEventPluginOrder = require('ReactNativeEventPluginOrder');
var ReactNativeGlobalResponderHandler = require('ReactNativeGlobalResponderHandler');
var ReactNativeTextComponent = require('ReactNativeTextComponent');
var ReactNativeTreeTraversal = require('ReactNativeTreeTraversal');
var ReactSimpleEmptyComponent = require('ReactSimpleEmptyComponent');
var ReactUpdates = require('ReactUpdates');
var ResponderEventPlugin = require('ResponderEventPlugin');

var invariant = require('invariant');

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
  EventPluginUtils.injection.injectTreeTraversal(ReactNativeTreeTraversal);

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

  ReactUpdates.injection.injectReconcileTransaction(
    ReactNativeComponentEnvironment.ReactReconcileTransaction,
  );

  ReactUpdates.injection.injectBatchingStrategy(ReactDefaultBatchingStrategy);

  ReactComponentEnvironment.injection.injectEnvironment(
    ReactNativeComponentEnvironment,
  );

  var EmptyComponent = instantiate => {
    // Can't import View at the top because it depends on React to make its composite
    var View = require('View');
    return new ReactSimpleEmptyComponent(
      React.createElement(View, {
        collapsable: true,
        style: {position: 'absolute'},
      }),
      instantiate,
    );
  };

  ReactEmptyComponent.injection.injectEmptyComponentFactory(EmptyComponent);

  ReactHostComponent.injection.injectTextComponentClass(
    ReactNativeTextComponent,
  );
  ReactHostComponent.injection.injectGenericComponentClass(function(tag) {
    // Show a nicer error message for non-function tags
    var info = '';
    if (typeof tag === 'string' && /^[a-z]/.test(tag)) {
      info += ' Each component name should start with an uppercase letter.';
    }
    invariant(false, 'Expected a component class, got %s.%s', tag, info);
  });
}

module.exports = {
  inject: inject,
};
