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
import 'InitializeCore';
import {injectEventPluginOrder, injectEventPluginsByName} from 'EventPluginHub';
import {injectComponentTree} from 'EventPluginUtils';
import RCTEventEmitter from 'RCTEventEmitter';
import ReactNativeBridgeEventPlugin from 'ReactNativeBridgeEventPlugin';
import * as ReactNativeComponentTree from 'ReactNativeComponentTree';
import * as ReactNativeEventEmitter from 'ReactNativeEventEmitter';
import ReactNativeEventPluginOrder from 'ReactNativeEventPluginOrder';
import ReactNativeGlobalResponderHandler
  from 'ReactNativeGlobalResponderHandler';
import ResponderEventPlugin from 'ResponderEventPlugin';

/**
 * Register the event emitter with the native bridge
 */
RCTEventEmitter.register(ReactNativeEventEmitter);

/**
 * Inject module for resolving DOM hierarchy and plugin ordering.
 */
injectEventPluginOrder(ReactNativeEventPluginOrder);
injectComponentTree(ReactNativeComponentTree);

ResponderEventPlugin.injection.injectGlobalResponderHandler(
  ReactNativeGlobalResponderHandler,
);

/**
 * Some important event plugins included by default (without having to require
 * them).
 */
injectEventPluginsByName({
  ResponderEventPlugin: ResponderEventPlugin,
  ReactNativeBridgeEventPlugin: ReactNativeBridgeEventPlugin,
});
