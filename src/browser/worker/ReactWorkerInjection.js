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
 * @providesModule ReactWorkerInjection
 */

"use strict";

var DOMProperty = require('DOMProperty');
var EventPluginHub = require('EventPluginHub');
var ReactComponent = require('ReactComponent');
var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactDOM = require('ReactDOM');
var ReactEmptyComponent = require('ReactEmptyComponent');
var ReactEventEmitter = require('ReactEventEmitter');
var ReactPerf = require('ReactPerf');
var ReactRootIndex = require('ReactRootIndex');
var ReactUpdates = require('ReactUpdates');

var ExecutionEnvironment = require('ExecutionEnvironment');

var ChangeEventPlugin = require('ChangeEventPlugin');
var ClientReactRootIndex = require('ClientReactRootIndex');
var CompositionEventPlugin = require('CompositionEventPlugin');
var DefaultEventPluginOrder = require('DefaultEventPluginOrder');
var EnterLeaveEventPlugin = require('EnterLeaveEventPlugin');
var HTMLDOMPropertyConfig = require('HTMLDOMPropertyConfig');
var MobileSafariClickEventPlugin = require('MobileSafariClickEventPlugin');
var ReactBrowserComponentMixin = require('ReactBrowserComponentMixin');
var ReactComponentWorkerEnvironment =
  require('ReactComponentWorkerEnvironment');
var ReactEventListenerRemote = require('ReactEventListenerRemote');
var ReactDOM = require('ReactDOM');
var ReactDOMButton = require('ReactDOMButton');
var ReactDOMForm = require('ReactDOMForm');
var ReactDOMImg = require('ReactDOMImg');
var ReactDOMInput = require('ReactDOMInput');
var ReactDOMOption = require('ReactDOMOption');
var ReactDOMSelect = require('ReactDOMSelect');
var ReactDOMTextarea = require('ReactDOMTextarea');
var ReactEventEmitter = require('ReactEventEmitter');
var ReactInstanceHandles = require('ReactInstanceHandles');
var SelectEventPlugin = require('SelectEventPlugin');
var SimpleEventPlugin = require('SimpleEventPlugin');
var SVGDOMPropertyConfig = require('SVGDOMPropertyConfig');
var BeforeInputEventPlugin = require('BeforeInputEventPlugin');

var ReactDefaultBatchingStrategy = require('ReactDefaultBatchingStrategy');
var RemoteModuleServer = require('RemoteModuleServer');

var createFullPageComponent = require('createFullPageComponent');

var server;

function inject() {
  server = new RemoteModuleServer(ExecutionEnvironment.global, {
    ReactEventEmitter: ReactEventEmitter
  });

  ReactEventEmitter.injection.injectReactEventListener(
    ReactEventListenerRemote
  );

  /**
   * Inject modules for resolving DOM hierarchy and plugin ordering.
   */
  EventPluginHub.injection.injectEventPluginOrder(DefaultEventPluginOrder);
  EventPluginHub.injection.injectInstanceHandle(ReactInstanceHandles);
  EventPluginHub.injection.injectMount({getNode: function() {}});

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
    SelectEventPlugin: SelectEventPlugin,
    BeforeInputEventPlugin: BeforeInputEventPlugin
  });

  ReactDOM.injection.injectComponentClasses({
    button: ReactDOMButton,
    form: ReactDOMForm,
    img: ReactDOMImg,
    input: ReactDOMInput,
    option: ReactDOMOption,
    select: ReactDOMSelect,
    textarea: ReactDOMTextarea,

    html: createFullPageComponent(ReactDOM.html),
    head: createFullPageComponent(ReactDOM.head),
    title: createFullPageComponent(ReactDOM.title),
    body: createFullPageComponent(ReactDOM.body)
  });


  // This needs to happen after createFullPageComponent() otherwise the mixin
  // gets double injected.
  ReactCompositeComponent.injection.injectMixin(ReactBrowserComponentMixin);

  DOMProperty.injection.injectDOMPropertyConfig(HTMLDOMPropertyConfig);
  DOMProperty.injection.injectDOMPropertyConfig(SVGDOMPropertyConfig);

  ReactEmptyComponent.injection.injectEmptyComponent(ReactDOM.script);

  ReactUpdates.injection.injectBatchingStrategy(
    ReactDefaultBatchingStrategy
  );

  ReactRootIndex.injection.injectCreateReactRootIndex(
    ClientReactRootIndex.createReactRootIndex
  );

  ReactComponent.injection.injectEnvironment(ReactComponentWorkerEnvironment);

  if (__DEV__) {
    var url = (ExecutionEnvironment.canUseDOM && window.location.href) || '';
    if ((/[?&]react_perf\b/).test(url)) {
      var ReactDefaultPerf = require('ReactDefaultPerf');
      ReactDefaultPerf.start();
    }
  }
}

module.exports = {
  inject: inject
};
