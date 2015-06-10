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
var ReactBrowserComponentMixin = require('ReactBrowserComponentMixin');
var ReactClass = require('ReactClass');
var ReactComponentBrowserEnvironment =
  require('ReactComponentBrowserEnvironment');
var ReactDefaultBatchingStrategy = require('ReactDefaultBatchingStrategy');
var ReactDOMComponent = require('ReactDOMComponent');
var ReactDOMIDOperations = require('ReactDOMIDOperations');
var ReactDOMTextComponent = require('ReactDOMTextComponent');
var ReactElement = require('ReactElement');
var ReactEventListener = require('ReactEventListener');
var ReactInjection = require('ReactInjection');
var ReactInstanceHandles = require('ReactInstanceHandles');
var ReactInstanceMap = require('ReactInstanceMap');
var ReactMount = require('ReactMount');
var ReactReconcileTransaction = require('ReactReconcileTransaction');
var SelectEventPlugin = require('SelectEventPlugin');
var ServerReactRootIndex = require('ServerReactRootIndex');
var SimpleEventPlugin = require('SimpleEventPlugin');
var SVGDOMPropertyConfig = require('SVGDOMPropertyConfig');

var warning = require('warning');

var canDefineProperty = false;
try {
  Object.defineProperty({}, 'test', {get: function() {}});
  canDefineProperty = true;
} catch (e) {
}

var deprecatedDOMMethods = [
  'isMounted', 'replaceProps', 'replaceState', 'setProps', 'setState',
  'forceUpdate',
];

function getDeclarationErrorAddendum(domWrapperClass) {
  var internalInstance = ReactInstanceMap.get(domWrapperClass);
  var owner = internalInstance._currentElement._owner || null;
  if (owner) {
    var name = owner.getName();
    if (name) {
      return ' This DOM component was rendered by `' + name + '`.';
    }
  }
  return '';
}

function autoGenerateWrapperClass(type) {
  var wrapperClass = ReactClass.createClass({
    tagName: type.toUpperCase(),
    render: function() {
      // Copy owner down for debugging info
      var internalInstance = ReactInstanceMap.get(this);
      return new ReactElement(
        type,
        null,  // key
        null,  // ref
        internalInstance._currentElement._owner,  // owner
        this._internalProps || this.props
      );
    },
  });

  if (__DEV__) {
    if (canDefineProperty) {
      Object.defineProperty(wrapperClass.prototype, 'props', {
        enumerable: true,
        set: function(props) {
          this._internalProps = props;
        },
        get: function() {
          warning(
            false,
            'ReactDOMComponent.props: Do not access .props of a DOM ' +
            'component directly; instead, recreate the props as `render` ' +
            'did originally or use React.findDOMNode and read the DOM ' +
            'properties/attributes directly.%s',
            getDeclarationErrorAddendum(this)
          );
          return this._internalProps;
        },
      });

      deprecatedDOMMethods.forEach(function(method) {
        var old = wrapperClass.prototype[method];
        Object.defineProperty(wrapperClass.prototype, method, {
          enumerable: true,
          get: function() {
            warning(
              false,
              'ReactDOMComponent.%s(): Do not access .%s() of a DOM ' +
              'component.%s',
              method,
              method,
              getDeclarationErrorAddendum(this)
            );
            return old;
          },
        });
      });
    }
  }

  return wrapperClass;
}

var alreadyInjected = false;

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
    SelectEventPlugin: SelectEventPlugin,
    BeforeInputEventPlugin: BeforeInputEventPlugin,
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

  ReactInjection.Class.injectMixin(ReactBrowserComponentMixin);

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
  inject: inject,
};
