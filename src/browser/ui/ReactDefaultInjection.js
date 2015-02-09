/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDefaultInjection
 */

'use strict';

var BeforeInputEventPlugin = require('BeforeInputEventPlugin');
var ChangeEventPlugin = require('ChangeEventPlugin');
var ClientReactRootIndex = require('ClientReactRootIndex');
var DefaultEventPluginOrder = require('DefaultEventPluginOrder');
var EnterLeaveEventPlugin = require('EnterLeaveEventPlugin');
var ExecutionEnvironment = require('ExecutionEnvironment');
var HTMLDOMPropertyConfig = require('HTMLDOMPropertyConfig');
var MobileSafariClickEventPlugin = require('MobileSafariClickEventPlugin');
var ReactBrowserComponentMixin = require('ReactBrowserComponentMixin');
var ReactClass = require('ReactClass');
var ReactComponentBrowserEnvironment =
  require('ReactComponentBrowserEnvironment');
var ReactDefaultBatchingStrategy = require('ReactDefaultBatchingStrategy');
var ReactDOMComponent = require('ReactDOMComponent');
var ReactDOMButton = require('ReactDOMButton');
var ReactDOMForm = require('ReactDOMForm');
var ReactDOMImg = require('ReactDOMImg');
var ReactDOMIDOperations = require('ReactDOMIDOperations');
var ReactDOMIframe = require('ReactDOMIframe');
var ReactDOMInput = require('ReactDOMInput');
var ReactDOMOption = require('ReactDOMOption');
var ReactDOMSelect = require('ReactDOMSelect');
var ReactDOMTextarea = require('ReactDOMTextarea');
var ReactDOMTextComponent = require('ReactDOMTextComponent');
var ReactElement = require('ReactElement');
var ReactEventListener = require('ReactEventListener');
var ReactInjection = require('ReactInjection');
var ReactInstanceHandles = require('ReactInstanceHandles');
var ReactMount = require('ReactMount');
var ReactReconcileTransaction = require('ReactReconcileTransaction');
var SelectEventPlugin = require('SelectEventPlugin');
var ServerReactRootIndex = require('ServerReactRootIndex');
var SimpleEventPlugin = require('SimpleEventPlugin');
var SVGDOMPropertyConfig = require('SVGDOMPropertyConfig');

var createFullPageComponent = require('createFullPageComponent');

function autoGenerateWrapperClass(type) {
  return ReactClass.createClass({
    tagName: type.toUpperCase(),
    render: function() {
      return new ReactElement(
        type,
        null,
        null,
        null,
        null,
        this.props
      );
    }
  });
}

function inject() {
  ReactInjection.EventEmitter.injectReactEventListener(
    ReactEventListener
  );

  /**
   * Inject modules for resolving DOM hierarchy and plugin ordering.
   */
  ReactInjection.EventPluginHub.injectEventPluginOrder(DefaultEventPluginOrder);
  ReactInjection.EventPluginHub.injectInstanceHandle(ReactInstanceHandles);
  ReactInjection.EventPluginHub.injectMount(ReactMount);

  /**
   * Some important event plugins included by default (without having to require
   * them).
   */
  ReactInjection.EventPluginHub.injectEventPluginsByName({
    SimpleEventPlugin: SimpleEventPlugin,
    EnterLeaveEventPlugin: EnterLeaveEventPlugin,
    ChangeEventPlugin: ChangeEventPlugin,
    MobileSafariClickEventPlugin: MobileSafariClickEventPlugin,
    SelectEventPlugin: SelectEventPlugin,
    BeforeInputEventPlugin: BeforeInputEventPlugin
  });

  ReactInjection.NativeComponent.injectGenericComponentClass(
    ReactDOMComponent
  );

  ReactInjection.NativeComponent.injectTextComponentClass(
    ReactDOMTextComponent
  );

  ReactInjection.NativeComponent.injectAutoWrapper(
    autoGenerateWrapperClass
  );

  // This needs to happen before createFullPageComponent() otherwise the mixin
  // won't be included.
  ReactInjection.Class.injectMixin(ReactBrowserComponentMixin);

  ReactInjection.NativeComponent.injectComponentClasses({
    'button': ReactDOMButton,
    'form': ReactDOMForm,
    'iframe': ReactDOMIframe,
    'img': ReactDOMImg,
    'input': ReactDOMInput,
    'option': ReactDOMOption,
    'select': ReactDOMSelect,
    'textarea': ReactDOMTextarea,

    'html': createFullPageComponent('html'),
    'head': createFullPageComponent('head'),
    'body': createFullPageComponent('body')
  });

  ReactInjection.DOMProperty.injectDOMPropertyConfig(HTMLDOMPropertyConfig);
  ReactInjection.DOMProperty.injectDOMPropertyConfig(SVGDOMPropertyConfig);

  ReactInjection.EmptyComponent.injectEmptyComponent('noscript');

  ReactInjection.Updates.injectReconcileTransaction(
    ReactReconcileTransaction
  );
  ReactInjection.Updates.injectBatchingStrategy(
    ReactDefaultBatchingStrategy
  );

  ReactInjection.RootIndex.injectCreateReactRootIndex(
    ExecutionEnvironment.canUseDOM ?
      ClientReactRootIndex.createReactRootIndex :
      ServerReactRootIndex.createReactRootIndex
  );

  ReactInjection.Component.injectEnvironment(ReactComponentBrowserEnvironment);
  ReactInjection.DOMComponent.injectIDOperations(ReactDOMIDOperations);

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
