/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeDefaultInjection
 * 
 */
'use strict';

/**
 * Make sure essential globals are available and are patched correctly. Please don't remove this
 * line. Bundles created by react-packager `require` it before executing any application code. This
 * ensures it exists in the dependency graph and can be `require`d.
 * TODO: require this in packager, not in React #10932517
 */

var _prodInvariant = require('./reactProdInvariant');

require('react-native/lib/InitializeJavaScriptAppEngine');

var EventPluginHub = require('./EventPluginHub');
var EventPluginUtils = require('./EventPluginUtils');
var RCTEventEmitter = require('react-native/lib/RCTEventEmitter');
var ReactComponentEnvironment = require('./ReactComponentEnvironment');
var ReactDefaultBatchingStrategy = require('./ReactDefaultBatchingStrategy');
var ReactElement = require('./ReactElement');
var ReactEmptyComponent = require('./ReactEmptyComponent');
var ReactNativeBridgeEventPlugin = require('./ReactNativeBridgeEventPlugin');
var ReactHostComponent = require('./ReactHostComponent');
var ReactNativeComponentEnvironment = require('./ReactNativeComponentEnvironment');
var ReactNativeComponentTree = require('./ReactNativeComponentTree');
var ReactNativeEventEmitter = require('./ReactNativeEventEmitter');
var ReactNativeEventPluginOrder = require('./ReactNativeEventPluginOrder');
var ReactNativeGlobalResponderHandler = require('./ReactNativeGlobalResponderHandler');
var ReactNativeTextComponent = require('./ReactNativeTextComponent');
var ReactNativeTreeTraversal = require('./ReactNativeTreeTraversal');
var ReactSimpleEmptyComponent = require('./ReactSimpleEmptyComponent');
var ReactUpdates = require('./ReactUpdates');
var ResponderEventPlugin = require('./ResponderEventPlugin');

var invariant = require('fbjs/lib/invariant');

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

  ResponderEventPlugin.injection.injectGlobalResponderHandler(ReactNativeGlobalResponderHandler);

  /**
   * Some important event plugins included by default (without having to require
   * them).
   */
  EventPluginHub.injection.injectEventPluginsByName({
    'ResponderEventPlugin': ResponderEventPlugin,
    'ReactNativeBridgeEventPlugin': ReactNativeBridgeEventPlugin
  });

  ReactUpdates.injection.injectReconcileTransaction(ReactNativeComponentEnvironment.ReactReconcileTransaction);

  ReactUpdates.injection.injectBatchingStrategy(ReactDefaultBatchingStrategy);

  ReactComponentEnvironment.injection.injectEnvironment(ReactNativeComponentEnvironment);

  var EmptyComponent = function (instantiate) {
    // Can't import View at the top because it depends on React to make its composite
    var View = require('react-native/lib/View');
    return new ReactSimpleEmptyComponent(ReactElement.createElement(View, {
      collapsable: true,
      style: { position: 'absolute' }
    }), instantiate);
  };

  ReactEmptyComponent.injection.injectEmptyComponentFactory(EmptyComponent);

  ReactHostComponent.injection.injectTextComponentClass(ReactNativeTextComponent);
  ReactHostComponent.injection.injectGenericComponentClass(function (tag) {
    // Show a nicer error message for non-function tags
    var info = '';
    if (typeof tag === 'string' && /^[a-z]/.test(tag)) {
      info += ' Each component name should start with an uppercase letter.';
    }
    !false ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Expected a component class, got %s.%s', tag, info) : _prodInvariant('18', tag, info) : void 0;
  });
}

module.exports = {
  inject: inject
};