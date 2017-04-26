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
var ReactDOMFactories = require('ReactDOMFactories');
var ReactElement = require('ReactElement');
var ReactPropTypes = require('ReactPropTypes');
var ReactVersion = require('ReactVersion');

var onlyChild = require('onlyChild');
var checkPropTypes = require('prop-types/checkPropTypes');
var createReactClass = require('createClass');

var createElement = ReactElement.createElement;
var createFactory = ReactElement.createFactory;
var cloneElement = ReactElement.cloneElement;

if (__DEV__) {
  var warning = require('fbjs/lib/warning');
  var canDefineProperty = require('canDefineProperty');
  var ReactElementValidator = require('ReactElementValidator');
  createElement = ReactElementValidator.createElement;
  createFactory = ReactElementValidator.createFactory;
  cloneElement = ReactElementValidator.cloneElement;
}

var createMixin = function(mixin) {
  return mixin;
};

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

  // TODO (bvaughn) Remove these getters before 16.0.0
  PropTypes: ReactPropTypes,
  checkPropTypes: checkPropTypes,
  createClass: createReactClass,

  // Classic

  createFactory: createFactory,
  createMixin: createMixin,

  // This looks DOM specific but these are actually isomorphic helpers
  // since they are just generating DOM strings.
  DOM: ReactDOMFactories,

  version: ReactVersion,

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    ReactCurrentOwner: require('ReactCurrentOwner'),
  },
};

if (__DEV__) {
  Object.assign(React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, {
    // These should not be included in production.
    ReactComponentTreeHook: require('ReactComponentTreeHook'),
    ReactDebugCurrentFrame: require('ReactDebugCurrentFrame'),
  });

  let warnedForCheckPropTypes = false;
  let warnedForCreateMixin = false;
  let warnedForCreateClass = false;
  let warnedForPropTypes = false;

  React.createMixin = function(mixin) {
    warning(
      warnedForCreateMixin,
      'React.createMixin is deprecated and should not be used. You ' +
        'can use this mixin directly instead.',
    );
    warnedForCreateMixin = true;
    return mixin;
  };

  // TODO (bvaughn) Remove all of these accessors before 16.0.0
  if (canDefineProperty) {
    Object.defineProperty(React, 'checkPropTypes', {
      get() {
        warning(
          warnedForCheckPropTypes,
          'checkPropTypes has been moved to a separate package. ' +
            'Accessing React.checkPropTypes is no longer supported ' +
            'and will be removed completely in React 16. ' +
            'Use the prop-types package on npm instead. ' +
            '(https://fb.me/migrating-from-react-proptypes)',
        );
        warnedForCheckPropTypes = true;
        return checkPropTypes;
      },
    });

    Object.defineProperty(React, 'createClass', {
      get: function() {
        warning(
          warnedForCreateClass,
          'React.createClass is no longer supported. Use a plain JavaScript ' +
            "class instead. If you're not yet ready to migrate, " +
            'create-react-class is available on npm as a drop-in replacement. ' +
            '(https://fb.me/migrating-from-react-create-class)',
        );
        warnedForCreateClass = true;
        return createReactClass;
      },
    });

    Object.defineProperty(React, 'PropTypes', {
      get() {
        warning(
          warnedForPropTypes,
          'PropTypes has been moved to a separate package. ' +
            'Accessing React.PropTypes is no longer supported ' +
            'and will be removed completely in React 16. ' +
            'Use the prop-types package on npm instead. ' +
            '(https://fb.me/migrating-from-react-proptypes)',
        );
        warnedForPropTypes = true;
        return ReactPropTypes;
      },
    });
  }

  // React.DOM factories are deprecated. Wrap these methods so that
  // invocations of the React.DOM namespace and alert users to switch
  // to the `react-addons-dom-factories` package.
  React.DOM = {};
  var warnedForFactories = false;
  Object.keys(ReactDOMFactories).forEach(function(factory) {
    React.DOM[factory] = function(...args) {
      if (!warnedForFactories) {
        warning(
          false,
          'Accessing factories like React.DOM.%s has been deprecated ' +
            'and will be removed in the future. Use the ' +
            'react-addons-dom-factories package instead.',
          factory,
        );
        warnedForFactories = true;
      }
      return ReactDOMFactories[factory](...args);
    };
  });
}

module.exports = React;
