/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var BeforeInputEventPlugin = require('./event/plugins/BeforeInputEventPlugin');
var ChangeEventPlugin = require('./event/plugins/ChangeEventPlugin');
var DOMEventPluginOrder = require('./event/plugins/DOMEventPluginOrder');
var EnterLeaveEventPlugin = require('./event/plugins/EnterLeaveEventPlugin');
var EventPluginHub = require('shared/event/EventPluginHub');
var EventPluginUtils = require('shared/event/EventPluginUtils');
var ReactBrowserEventEmitter = require('./event/ReactBrowserEventEmitter');
var ReactDOMComponentTree = require('./ReactDOMComponentTree');
var ReactDOMEventListener = require('./event/ReactDOMEventListener');
var SelectEventPlugin = require('./event/plugins/SelectEventPlugin');
var SimpleEventPlugin = require('./event/plugins/SimpleEventPlugin');

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
