/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule React
 */

'use strict';

var ReactBaseClasses = require('ReactBaseClasses');
var ReactChildren = require('ReactChildren');
var ReactDOMFactories = require('ReactDOMFactories');
var ReactElement = require('ReactElement');
var ReactPropTypes = require('ReactPropTypes');
var ReactVersion = require('ReactVersion');

var createReactClass = require('createClass');
var onlyChild = require('onlyChild');

var createElement = ReactElement.createElement;
var createFactory = ReactElement.createFactory;
var cloneElement = ReactElement.cloneElement;

if (__DEV__) {
  var lowPriorityWarning = require('lowPriorityWarning');
  var canDefineProperty = require('canDefineProperty');
  var ReactElementValidator = require('ReactElementValidator');
  var didWarnPropTypesDeprecated = false;
  createElement = ReactElementValidator.createElement;
  createFactory = ReactElementValidator.createFactory;
  cloneElement = ReactElementValidator.cloneElement;
}

var __spread = Object.assign;
var createMixin = function(mixin) {
  return mixin;
};

if (__DEV__) {
  var warnedForSpread = false;
  var warnedForCreateMixin = false;
  __spread = function() {
    lowPriorityWarning(
      warnedForSpread,
      'React.__spread is deprecated and should not be used. Use ' +
        'Object.assign directly or another helper function with similar ' +
        'semantics. You may be seeing this warning due to your compiler. ' +
        'See https://fb.me/react-spread-deprecation for more details.',
    );
    warnedForSpread = true;
    return Object.assign.apply(null, arguments);
  };

  createMixin = function(mixin) {
    lowPriorityWarning(
      warnedForCreateMixin,
      'React.createMixin is deprecated and should not be used. ' +
        'In React v16.0, it will be removed. ' +
        'You can use this mixin directly instead. ' +
        'See https://fb.me/createmixin-was-never-implemented for more info.',
    );
    warnedForCreateMixin = true;
    return mixin;
  };
}

var React = {
  // Modern

  Children: {
    map: ReactChildren.map,
    forEach: ReactChildren.forEach,
    count: ReactChildren.count,
    toArray: ReactChildren.toArray,
    only: onlyChild,
  },

  Component: ReactBaseClasses.Component,
  PureComponent: ReactBaseClasses.PureComponent,

  createElement: createElement,
  cloneElement: cloneElement,
  isValidElement: ReactElement.isValidElement,

  // Classic

  PropTypes: ReactPropTypes,
  createClass: createReactClass,
  createFactory: createFactory,
  createMixin: createMixin,

  // This looks DOM specific but these are actually isomorphic helpers
  // since they are just generating DOM strings.
  DOM: ReactDOMFactories,

  version: ReactVersion,

  // Deprecated hook for JSX spread, don't use this for anything.
  __spread: __spread,
};

if (__DEV__) {
  let warnedForCreateClass = false;
  if (canDefineProperty) {
    Object.defineProperty(React, 'PropTypes', {
      get() {
        lowPriorityWarning(
          didWarnPropTypesDeprecated,
          'Accessing PropTypes via the main React package is deprecated,' +
            ' and will be removed in  React v16.0.' +
            ' Use the latest available v15.* prop-types package from npm instead.' +
            ' For info on usage, compatibility, migration and more, see ' +
            'https://fb.me/prop-types-docs',
        );
        didWarnPropTypesDeprecated = true;
        return ReactPropTypes;
      },
    });

    Object.defineProperty(React, 'createClass', {
      get: function() {
        lowPriorityWarning(
          warnedForCreateClass,
          'Accessing createClass via the main React package is deprecated,' +
            ' and will be removed in React v16.0.' +
            " Use a plain JavaScript class instead. If you're not yet " +
            'ready to migrate, create-react-class v15.* is available ' +
            'on npm as a temporary, drop-in replacement. ' +
            'For more info see https://fb.me/react-create-class',
        );
        warnedForCreateClass = true;
        return createReactClass;
      },
    });
  }

  // React.DOM factories are deprecated. Wrap these methods so that
  // invocations of the React.DOM namespace and alert users to switch
  // to the `react-dom-factories` package.
  React.DOM = {};
  var warnedForFactories = false;
  Object.keys(ReactDOMFactories).forEach(function(factory) {
    React.DOM[factory] = function(...args) {
      if (!warnedForFactories) {
        lowPriorityWarning(
          false,
          'Accessing factories like React.DOM.%s has been deprecated ' +
            'and will be removed in v16.0+. Use the ' +
            'react-dom-factories package instead. ' +
            ' Version 1.0 provides a drop-in replacement.' +
            ' For more info, see https://fb.me/react-dom-factories',
          factory,
        );
        warnedForFactories = true;
      }
      return ReactDOMFactories[factory](...args);
    };
  });
}

module.exports = React;
