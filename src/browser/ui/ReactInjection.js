/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactInjection
 */

"use strict";

var DOMProperty = require('DOMProperty');
var EventPluginHub = require('EventPluginHub');
var ReactComponent = require('ReactComponent');
var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactDOM = require('ReactDOM');
var ReactEventEmitter = require('ReactEventEmitter');
var ReactPerf = require('ReactPerf');
var ReactRootIndex = require('ReactRootIndex');
var ReactUpdates = require('ReactUpdates');

var ReactInjection = {
  Component: ReactComponent.injection,
  CompositeComponent: ReactCompositeComponent.injection,
  DOMProperty: DOMProperty.injection,
  EventPluginHub: EventPluginHub.injection,
  DOM: ReactDOM.injection,
  EventEmitter: ReactEventEmitter.injection,
  Perf: ReactPerf.injection,
  RootIndex: ReactRootIndex.injection,
  Updates: ReactUpdates.injection
};

module.exports = ReactInjection;
