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
var ReactNativeComponentTree = require('ReactNativeComponentTree');
var ReactNativeDefaultInjection = require('ReactNativeDefaultInjection');

var ReactCurrentOwner = require('ReactCurrentOwner');
var ReactElement = require('ReactElement');
var ReactInstanceHandles = require('ReactInstanceHandles');
var ReactNativeMount = require('ReactNativeMount');
var ReactUpdates = require('ReactUpdates');

var findNodeHandle = require('findNodeHandle');

ReactNativeDefaultInjection.inject();

var render = function(
  element: ReactElement,
  mountInto: number,
  callback?: ?(() => void)
): ?ReactComponent {
  return ReactNativeMount.renderComponent(element, mountInto, callback);
};

var ReactNative = {
  hasReactNativeInitialized: false,
  findNodeHandle: findNodeHandle,
  render: render,
  unmountComponentAtNode: ReactNativeMount.unmountComponentAtNode,

  /* eslint-disable camelcase */
  unstable_batchedUpdates: ReactUpdates.batchedUpdates,
  /* eslint-enable camelcase */

  unmountComponentAtNodeAndRemoveContainer: ReactNativeMount.unmountComponentAtNodeAndRemoveContainer,

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
    ComponentTree: {
      getClosestInstanceFromNode: function(node) {
        return ReactNativeComponentTree.getClosestInstanceFromNode(node);
      },
      getNodeFromInstance: function(inst) {
        // inst is an internal instance (but could be a composite)
        while (inst._renderedComponent) {
          inst = inst._renderedComponent;
        }
        if (inst) {
          return ReactNativeComponentTree.getNodeFromInstance(inst);
        } else {
          return null;
        }
      },
    },
    Mount: ReactNativeMount,
    Reconciler: require('ReactReconciler'),
  });
}

module.exports = ReactNative;
