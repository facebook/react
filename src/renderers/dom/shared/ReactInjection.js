/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactInjection
 */

'use strict';

var DOMProperty = require('DOMProperty');
var EventPluginHub = require('EventPluginHub');
var ReactComponentEnvironment = require('ReactComponentEnvironment');
var ReactClass = require('ReactClass');
var ReactEmptyComponent = require('ReactEmptyComponent');
var ReactBrowserEventEmitter = require('ReactBrowserEventEmitter');
var ReactNativeComponent = require('ReactNativeComponent');
var ReactDOMComponent = require('ReactDOMComponent');
var ReactPerf = require('ReactPerf');
var ReactRootIndex = require('ReactRootIndex');
var ReactUpdates = require('ReactUpdates');

var ReactInjection = {
  Component: ReactComponentEnvironment.injection,
  Class: ReactClass.injection,
  DOMComponent: ReactDOMComponent.injection,
  DOMProperty: DOMProperty.injection,
  EmptyComponent: ReactEmptyComponent.injection,
  EventPluginHub: EventPluginHub.injection,
  EventEmitter: ReactBrowserEventEmitter.injection,
  NativeComponent: ReactNativeComponent.injection,
  Perf: ReactPerf.injection,
  RootIndex: ReactRootIndex.injection,
  Updates: ReactUpdates.injection
};

module.exports = ReactInjection;
