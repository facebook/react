/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var BeforeInputEventPlugin = require('../events/BeforeInputEventPlugin');
var ChangeEventPlugin = require('../events/ChangeEventPlugin');
var DOMEventPluginOrder = require('../events/DOMEventPluginOrder');
var EnterLeaveEventPlugin = require('../events/EnterLeaveEventPlugin');
var EventPluginHub = require('events/EventPluginHub');
var EventPluginUtils = require('events/EventPluginUtils');
var ReactBrowserEventEmitter = require('../events/ReactBrowserEventEmitter');
var ReactDOMComponentTree = require('./ReactDOMComponentTree');
var ReactDOMEventListener = require('../events/ReactDOMEventListener');
var SelectEventPlugin = require('../events/SelectEventPlugin');
var SimpleEventPlugin = require('../events/SimpleEventPlugin');

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
