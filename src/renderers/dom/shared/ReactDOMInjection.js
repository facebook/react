/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMInjection
 */

'use strict';

var ARIADOMPropertyConfig = require('ARIADOMPropertyConfig');
var BeforeInputEventPlugin = require('BeforeInputEventPlugin');
var DOMProperty = require('DOMProperty');
var ChangeEventPlugin = require('ChangeEventPlugin');
var DOMEventPluginOrder = require('DOMEventPluginOrder');
var EnterLeaveEventPlugin = require('EnterLeaveEventPlugin');
var EventPluginHub = require('EventPluginHub');
var EventPluginUtils = require('EventPluginUtils');
var HTMLDOMPropertyConfig = require('HTMLDOMPropertyConfig');
var ReactBrowserEventEmitter = require('ReactBrowserEventEmitter');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactEventListener = require('ReactEventListener');
var SVGDOMPropertyConfig = require('SVGDOMPropertyConfig');
var SelectEventPlugin = require('SelectEventPlugin');
var SimpleEventPlugin = require('SimpleEventPlugin');

var alreadyInjected = false;

function inject() {
  if (alreadyInjected) {
    // TODO: This is currently true because these injections are shared between
    // the client and the server package. They should be built independently
    // and not share any injection state. Then this problem will be solved.
    return;
  }
  alreadyInjected = true;

  ReactBrowserEventEmitter.injection.injectReactEventListener(
    ReactEventListener,
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

  DOMProperty.injection.injectDOMPropertyConfig(ARIADOMPropertyConfig);
  DOMProperty.injection.injectDOMPropertyConfig(HTMLDOMPropertyConfig);
  DOMProperty.injection.injectDOMPropertyConfig(SVGDOMPropertyConfig);
}

module.exports = {
  inject: inject,
};
