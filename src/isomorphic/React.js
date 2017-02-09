/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule React
 */

'use strict';

var ReactBaseClasses = require('ReactBaseClasses');
var ReactChildren = require('ReactChildren');
var ReactClass = require('ReactClass');
var ReactDOMFactories = require('ReactDOMFactories');
var ReactElement = require('ReactElement');
var ReactPropTypes = require('ReactPropTypes');
var ReactVersion = require('ReactVersion');

var onlyChild = require('onlyChild');
var warning = require('warning');

var createElement = ReactElement.createElement;
var createFactory = ReactElement.createFactory;
var cloneElement = ReactElement.cloneElement;

if (__DEV__) {
  var ReactElementValidator = require('ReactElementValidator');
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
    warning(
      warnedForSpread,
      'React.__spread is deprecated and should not be used. Use ' +
      'Object.assign directly or another helper function with similar ' +
      'semantics. You may be seeing this warning due to your compiler. ' +
      'See https://fb.me/react-spread-deprecation for more details.'
    );
    warnedForSpread = true;
    return Object.assign.apply(null, arguments);
  };

  createMixin = function(mixin) {
    warning(
      warnedForCreateMixin,
      'React.createMixin is deprecated and should not be used. You ' +
      'can use this mixin directly instead.'
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
  createClass: ReactClass.createClass,
  createFactory: createFactory,
  createMixin: createMixin,

  // This looks DOM specific but these are actually isomorphic helpers
  // since they are just generating DOM strings.
  DOM: ReactDOMFactories,

  version: ReactVersion,

  // Deprecated hook for JSX spread, don't use this for anything.
  __spread: __spread,
};

module.exports = React;
