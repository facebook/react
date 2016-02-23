/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactInjection
 */

'use strict';

const DOMProperty = require('DOMProperty');
const EventPluginHub = require('EventPluginHub');
const EventPluginUtils = require('EventPluginUtils');
const ReactComponentEnvironment = require('ReactComponentEnvironment');
const ReactClass = require('ReactClass');
const ReactEmptyComponent = require('ReactEmptyComponent');
const ReactBrowserEventEmitter = require('ReactBrowserEventEmitter');
const ReactNativeComponent = require('ReactNativeComponent');
const ReactPerf = require('ReactPerf');
const ReactUpdates = require('ReactUpdates');

const ReactInjection = {
  Component: ReactComponentEnvironment.injection,
  Class: ReactClass.injection,
  DOMProperty: DOMProperty.injection,
  EmptyComponent: ReactEmptyComponent.injection,
  EventPluginHub: EventPluginHub.injection,
  EventPluginUtils: EventPluginUtils.injection,
  EventEmitter: ReactBrowserEventEmitter.injection,
  NativeComponent: ReactNativeComponent.injection,
  Perf: ReactPerf.injection,
  Updates: ReactUpdates.injection,
};

module.exports = ReactInjection;
