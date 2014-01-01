/**
 * Copyright 2013 Facebook, Inc.
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
 * @providesModule ReactDefaultInjection
 */

"use strict";

var ExecutionEnvironment = require('ExecutionEnvironment');

var ReactDOM = require('ReactDOM');
var ReactDOMButton = require('ReactDOMButton');
var ReactDOMForm = require('ReactDOMForm');
var ReactDOMImg = require('ReactDOMImg');
var ReactDOMInput = require('ReactDOMInput');
var ReactDOMOption = require('ReactDOMOption');
var ReactDOMSelect = require('ReactDOMSelect');
var ReactDOMTextarea = require('ReactDOMTextarea');
var ReactEventEmitter = require('ReactEventEmitter');
var ReactEventTopLevelCallback = require('ReactEventTopLevelCallback');
var ReactPerf = require('ReactPerf');
var ReactRootIndex = require('ReactRootIndex');

var DefaultDOMPropertyConfig = require('DefaultDOMPropertyConfig');
var DOMProperty = require('DOMProperty');

var ChangeEventPlugin = require('ChangeEventPlugin');
var ClientReactRootIndex = require('ClientReactRootIndex');
var CompositionEventPlugin = require('CompositionEventPlugin');
var DefaultEventPluginOrder = require('DefaultEventPluginOrder');
var EnterLeaveEventPlugin = require('EnterLeaveEventPlugin');
var EventPluginHub = require('EventPluginHub');
var MobileSafariClickEventPlugin = require('MobileSafariClickEventPlugin');
var ReactInstanceHandles = require('ReactInstanceHandles');
var SelectEventPlugin = require('SelectEventPlugin');
var ServerReactRootIndex = require('ServerReactRootIndex');
var SimpleEventPlugin = require('SimpleEventPlugin');

var ReactDefaultBatchingStrategy = require('ReactDefaultBatchingStrategy');
var ReactUpdates = require('ReactUpdates');

function inject() {
  ReactEventEmitter.TopLevelCallbackCreator = ReactEventTopLevelCallback;
  /**
   * Inject module for resolving DOM hierarchy and plugin ordering.
   */
  EventPluginHub.injection.injectEventPluginOrder(DefaultEventPluginOrder);
  EventPluginHub.injection.injectInstanceHandle(ReactInstanceHandles);

  /**
   * Some important event plugins included by default (without having to require
   * them).
   */
  EventPluginHub.injection.injectEventPluginsByName({
    SimpleEventPlugin: SimpleEventPlugin,
    EnterLeaveEventPlugin: EnterLeaveEventPlugin,
    ChangeEventPlugin: ChangeEventPlugin,
    CompositionEventPlugin: CompositionEventPlugin,
    MobileSafariClickEventPlugin: MobileSafariClickEventPlugin,
    SelectEventPlugin: SelectEventPlugin
  });

  ReactDOM.injection.injectComponentClasses({
    button: ReactDOMButton,
    form: ReactDOMForm,
    img: ReactDOMImg,
    input: ReactDOMInput,
    option: ReactDOMOption,
    select: ReactDOMSelect,
    textarea: ReactDOMTextarea
  });

  DOMProperty.injection.injectDOMPropertyConfig(DefaultDOMPropertyConfig);

  if (__DEV__) {
    ReactPerf.injection.injectMeasure(require('ReactDefaultPerf').measure);
  }

  ReactUpdates.injection.injectBatchingStrategy(
    ReactDefaultBatchingStrategy
  );

  ReactRootIndex.injection.injectCreateReactRootIndex(
    ExecutionEnvironment.canUseDOM ?
      ClientReactRootIndex.createReactRootIndex :
      ServerReactRootIndex.createReactRootIndex
  );
}

module.exports = {
  inject: inject
};
