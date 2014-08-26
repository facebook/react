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
 * @providesModule React
 */

"use strict";

// TODO: Move this elsewhere - it only exists in open source until a better
// solution is found.
require('Object.es6');

var DOMPropertyOperations = require('DOMPropertyOperations');
var EventPluginUtils = require('EventPluginUtils');
var ReactChildren = require('ReactChildren');
var ReactComponent = require('ReactComponent');
var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactContext = require('ReactContext');
var ReactCurrentOwner = require('ReactCurrentOwner');
var ReactDescriptor = require('ReactDescriptor');
var ReactDescriptorValidator = require('ReactDescriptorValidator');
var ReactDOM = require('ReactDOM');
var ReactDOMComponent = require('ReactDOMComponent');
var ReactDefaultInjection = require('ReactDefaultInjection');
var ReactInstanceHandles = require('ReactInstanceHandles');
var ReactLegacyDescriptor = require('ReactLegacyDescriptor');
var ReactMount = require('ReactMount');
var ReactMultiChild = require('ReactMultiChild');
var ReactPerf = require('ReactPerf');
var ReactPropTypes = require('ReactPropTypes');
var ReactServerRendering = require('ReactServerRendering');
var ReactTextComponent = require('ReactTextComponent');

var onlyChild = require('onlyChild');

ReactDefaultInjection.inject();

var createDescriptor = ReactDescriptor.createDescriptor;
var createFactory = ReactDescriptor.createFactory;

if (__DEV__) {
  createDescriptor = ReactDescriptorValidator.createDescriptor;
  createFactory = ReactDescriptorValidator.createFactory;
}

// TODO: Drop legacy descriptors once classes no longer export these factories
createDescriptor = ReactLegacyDescriptor.wrapCreateDescriptor(
  createDescriptor
);
createFactory = ReactLegacyDescriptor.wrapCreateFactory(
  createFactory
);

var React = {
  Children: {
    map: ReactChildren.map,
    forEach: ReactChildren.forEach,
    count: ReactChildren.count,
    only: onlyChild
  },
  DOM: ReactDOM,
  PropTypes: ReactPropTypes,
  initializeTouchEvents: function(shouldUseTouch) {
    EventPluginUtils.useTouchEvents = shouldUseTouch;
  },
  createClass: ReactCompositeComponent.createClass,
  createDescriptor: createDescriptor, // deprecated, will be removed next week
  createElement: createDescriptor,
  createFactory: createFactory,
  constructAndRenderComponent: ReactMount.constructAndRenderComponent,
  constructAndRenderComponentByID: ReactMount.constructAndRenderComponentByID,
  renderComponent: ReactPerf.measure(
    'React',
    'renderComponent',
    ReactMount.renderComponent
  ),
  renderComponentToString: ReactServerRendering.renderComponentToString,
  renderComponentToStaticMarkup:
    ReactServerRendering.renderComponentToStaticMarkup,
  unmountComponentAtNode: ReactMount.unmountComponentAtNode,
  isValidClass: ReactDescriptor.isValidFactory,
  isValidComponent: ReactDescriptor.isValidDescriptor,
  withContext: ReactContext.withContext,
  __internals: {
    Component: ReactComponent,
    CurrentOwner: ReactCurrentOwner,
    DOMComponent: ReactDOMComponent,
    DOMPropertyOperations: DOMPropertyOperations,
    InstanceHandles: ReactInstanceHandles,
    Mount: ReactMount,
    MultiChild: ReactMultiChild,
    TextComponent: ReactTextComponent
  }
};

if (__DEV__) {
  var ExecutionEnvironment = require('ExecutionEnvironment');
  if (ExecutionEnvironment.canUseDOM &&
      window.top === window.self &&
      navigator.userAgent.indexOf('Chrome') > -1) {
    console.debug(
      'If you haven\'t already, download the React DevTools for a better ' +
      'development experience: http://fb.me/react-devtools'
    );

    var expectedFeatures = [
      // shims
      Array.isArray,
      Array.prototype.every,
      Array.prototype.forEach,
      Array.prototype.indexOf,
      Array.prototype.map,
      Date.now,
      Function.prototype.bind,
      Object.keys,
      String.prototype.split,
      String.prototype.trim,

      // shams
      Object.create,
      Object.freeze
    ];

    for (var i = 0; i < expectedFeatures.length; i++) {
      if (!expectedFeatures[i]) {
        console.error(
          'One or more ES5 shim/shams expected by React are not available: ' +
          'http://fb.me/react-warning-polyfills'
        );
        break;
      }
    }
  }
}

// Version exists only in the open-source version of React, not in Facebook's
// internal version.
React.version = '0.12.0-alpha';

module.exports = React;
