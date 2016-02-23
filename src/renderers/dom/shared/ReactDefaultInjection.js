/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDefaultInjection
 */

'use strict';

const BeforeInputEventPlugin = require('BeforeInputEventPlugin');
const ChangeEventPlugin = require('ChangeEventPlugin');
const DefaultEventPluginOrder = require('DefaultEventPluginOrder');
const EnterLeaveEventPlugin = require('EnterLeaveEventPlugin');
const ExecutionEnvironment = require('ExecutionEnvironment');
const HTMLDOMPropertyConfig = require('HTMLDOMPropertyConfig');
const ReactComponentBrowserEnvironment =
  require('ReactComponentBrowserEnvironment');
const ReactDOMComponent = require('ReactDOMComponent');
const ReactDOMComponentTree = require('ReactDOMComponentTree');
const ReactDOMEmptyComponent = require('ReactDOMEmptyComponent');
const ReactDOMTreeTraversal = require('ReactDOMTreeTraversal');
const ReactDOMTextComponent = require('ReactDOMTextComponent');
const ReactDefaultBatchingStrategy = require('ReactDefaultBatchingStrategy');
const ReactEventListener = require('ReactEventListener');
const ReactInjection = require('ReactInjection');
const ReactReconcileTransaction = require('ReactReconcileTransaction');
const SVGDOMPropertyConfig = require('SVGDOMPropertyConfig');
const SelectEventPlugin = require('SelectEventPlugin');
const SimpleEventPlugin = require('SimpleEventPlugin');

let alreadyInjected = false;

function inject() {
  if (alreadyInjected) {
    // TODO: This is currently true because these injections are shared between
    // the client and the server package. They should be built independently
    // and not share any injection state. Then this problem will be solved.
    return;
  }
  alreadyInjected = true;

  ReactInjection.EventEmitter.injectReactEventListener(
    ReactEventListener
  );

  /**
   * Inject modules for resolving DOM hierarchy and plugin ordering.
   */
  ReactInjection.EventPluginHub.injectEventPluginOrder(DefaultEventPluginOrder);
  ReactInjection.EventPluginUtils.injectComponentTree(ReactDOMComponentTree);
  ReactInjection.EventPluginUtils.injectTreeTraversal(ReactDOMTreeTraversal);

  /**
   * Some important event plugins included by default (without having to require
   * them).
   */
  ReactInjection.EventPluginHub.injectEventPluginsByName({
    SimpleEventPlugin: SimpleEventPlugin,
    EnterLeaveEventPlugin: EnterLeaveEventPlugin,
    ChangeEventPlugin: ChangeEventPlugin,
    SelectEventPlugin: SelectEventPlugin,
    BeforeInputEventPlugin: BeforeInputEventPlugin,
  });

  ReactInjection.NativeComponent.injectGenericComponentClass(
    ReactDOMComponent
  );

  ReactInjection.NativeComponent.injectTextComponentClass(
    ReactDOMTextComponent
  );

  ReactInjection.DOMProperty.injectDOMPropertyConfig(HTMLDOMPropertyConfig);
  ReactInjection.DOMProperty.injectDOMPropertyConfig(SVGDOMPropertyConfig);

  ReactInjection.EmptyComponent.injectEmptyComponentFactory(
    function(instantiate) {
      return new ReactDOMEmptyComponent(instantiate);
    }
  );

  ReactInjection.Updates.injectReconcileTransaction(
    ReactReconcileTransaction
  );
  ReactInjection.Updates.injectBatchingStrategy(
    ReactDefaultBatchingStrategy
  );

  ReactInjection.Component.injectEnvironment(ReactComponentBrowserEnvironment);

  if (__DEV__) {
    const url = (ExecutionEnvironment.canUseDOM && window.location.href) || '';
    if ((/[?&]react_perf\b/).test(url)) {
      const ReactDefaultPerf = require('ReactDefaultPerf');
      ReactDefaultPerf.start();
    }
  }
}

module.exports = {
  inject: inject,
};
