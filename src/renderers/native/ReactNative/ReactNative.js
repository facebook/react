/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNative
 * @flow
 */
'use strict';

// Require ReactNativeDefaultInjection first for its side effects of setting up
// the JS environment
var ReactNativeDefaultInjection = require('ReactNativeDefaultInjection');

var ReactChildren = require('ReactChildren');
var ReactClass = require('ReactClass');
var ReactComponent = require('ReactComponent');
var ReactCurrentOwner = require('ReactCurrentOwner');
var ReactElement = require('ReactElement');
var ReactElementValidator = require('ReactElementValidator');
var ReactInstanceHandles = require('ReactInstanceHandles');
var ReactNativeMount = require('ReactNativeMount');
var ReactPropTypes = require('ReactPropTypes');
var ReactUpdates = require('ReactUpdates');

var findNodeHandle = require('findNodeHandle');
var invariant = require('fbjs/lib/invariant');
var onlyChild = require('onlyChild');
var warning = require('fbjs/lib/warning');

ReactNativeDefaultInjection.inject();

var createElement = ReactElement.createElement;
var createFactory = ReactElement.createFactory;
var cloneElement = ReactElement.cloneElement;

if (__DEV__) {
  createElement = ReactElementValidator.createElement;
  createFactory = ReactElementValidator.createFactory;
  cloneElement = ReactElementValidator.cloneElement;
}

var resolveDefaultProps = function(element) {
  // Could be optimized, but not currently in heavy use.
  var defaultProps = element.type.defaultProps;
  var props = element.props;
  for (var propName in defaultProps) {
    if (props[propName] === undefined) {
      props[propName] = defaultProps[propName];
    }
  }
};

// Experimental optimized element creation
var augmentElement = function(element: ReactElement): ReactElement {
  if (__DEV__) {
    invariant(
      false,
      'This optimized path should never be used in DEV mode because ' +
      'it does not provide validation. Check your JSX transform.'
    );
  }
  element._owner = ReactCurrentOwner.current;
  if (element.type.defaultProps) {
    resolveDefaultProps(element);
  }
  return element;
};

var render = function(
  element: ReactElement,
  mountInto: number,
  callback?: ?(() => void)
): ?ReactComponent {
  return ReactNativeMount.renderComponent(element, mountInto, callback);
};

var ReactNative = {
  hasReactNativeInitialized: false,
  Children: {
    map: ReactChildren.map,
    forEach: ReactChildren.forEach,
    count: ReactChildren.count,
    toArray: ReactChildren.toArray,
    only: onlyChild
  },
  Component: ReactComponent,
  PropTypes: ReactPropTypes,
  createClass: ReactClass.createClass,
  createElement: createElement,
  createFactory: createFactory,
  cloneElement: cloneElement,
  _augmentElement: augmentElement,
  findNodeHandle: findNodeHandle,
  render: render,
  unmountComponentAtNode: ReactNativeMount.unmountComponentAtNode,

  /* eslint-disable camelcase */
  unstable_batchedUpdates: ReactUpdates.batchedUpdates,
  /* eslint-enable camelcase */

  // Hook for JSX spread, don't use this for anything else.
  __spread: Object.assign,

  unmountComponentAtNodeAndRemoveContainer: ReactNativeMount.unmountComponentAtNodeAndRemoveContainer,
  isValidClass: ReactElement.isValidFactory,
  isValidElement: ReactElement.isValidElement,

  // Deprecations (remove for 0.13)
  renderComponent: function(
    element: ReactElement,
    mountInto: number,
    callback?: ?(() => void)
  ): ?ReactComponent {
    warning('Use React.render instead of React.renderComponent');
    return ReactNative.render(element, mountInto, callback);
  },
};

// Inject the runtime into a devtools global hook regardless of browser.
// Allows for debugging when the hook is injected on the page.
/* globals __REACT_DEVTOOLS_GLOBAL_HOOK__ */
if (
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.inject === 'function') {
  __REACT_DEVTOOLS_GLOBAL_HOOK__.inject({
    CurrentOwner: ReactCurrentOwner,
    InstanceHandles: ReactInstanceHandles,
    Mount: ReactNativeMount,
    Reconciler: require('ReactReconciler'),
    TextComponent: require('ReactNativeTextComponent'),
  });
}

module.exports = ReactNative;
