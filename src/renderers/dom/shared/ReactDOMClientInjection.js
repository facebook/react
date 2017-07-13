/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMClientInjection
 */

'use strict';

var BeforeInputEventPlugin = require('BeforeInputEventPlugin');
var ChangeEventPlugin = require('ChangeEventPlugin');
var DOMEventPluginOrder = require('DOMEventPluginOrder');
var EnterLeaveEventPlugin = require('EnterLeaveEventPlugin');
var EventPluginHub = require('EventPluginHub');
var EventPluginUtils = require('EventPluginUtils');
var ReactBrowserEventEmitter = require('ReactBrowserEventEmitter');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactDOMEventListener = require('ReactDOMEventListener');
var SelectEventPlugin = require('SelectEventPlugin');
var SimpleEventPlugin = require('SimpleEventPlugin');

ReactDOMEventListener.setHandleTopLevel(
  ReactBrowserEventEmitter.handleTopLevel,
);

/**
 * Inject modules for resolving DOM hierarchy and plugin ordering.
 */
EventPluginHub.injection.injectEventPluginOrder(DOMEventPluginOrder);
EventPluginUtils.injection.injectComponentTree(ReactDOMComponentTree);

/**
 * Some important event plugins included by default (without having to require
 * them).
 */
EventPluginHub.injection.injectEventPluginsByName({
  SimpleEventPlugin: SimpleEventPlugin,
  EnterLeaveEventPlugin: EnterLeaveEventPlugin,
  ChangeEventPlugin: ChangeEventPlugin,
  SelectEventPlugin: SelectEventPlugin,
  BeforeInputEventPlugin: BeforeInputEventPlugin,
});
