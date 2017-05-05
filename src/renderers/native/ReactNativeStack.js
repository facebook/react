/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeStack
 * @flow
 */
'use strict';

var ReactNativeComponentTree = require('ReactNativeComponentTree');
var ReactNativeInjection = require('ReactNativeInjection');
var ReactNativeMount = require('ReactNativeMount');
var ReactNativeStackInjection = require('ReactNativeStackInjection');
var ReactUpdates = require('ReactUpdates');

var findNodeHandleStackWrapper = require('findNodeHandleStackWrapper');

ReactNativeInjection.inject();
ReactNativeStackInjection.inject();

var render = function(
  element: ReactElement<any>,
  mountInto: number,
  callback?: ?() => void,
): ?ReactComponent<any, any, any> {
  return ReactNativeMount.renderComponent(element, mountInto, callback);
};

var ReactNative = {
  hasReactNativeInitialized: false,

  findNodeHandle: findNodeHandleStackWrapper,

  render: render,

  unmountComponentAtNode: ReactNativeMount.unmountComponentAtNode,

  /* eslint-disable camelcase */
  unstable_batchedUpdates: ReactUpdates.batchedUpdates,
  /* eslint-enable camelcase */

  unmountComponentAtNodeAndRemoveContainer: ReactNativeMount.unmountComponentAtNodeAndRemoveContainer,

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    // Used as a mixin in many createClass-based components
    NativeMethodsMixin: require('NativeMethodsMixin'),

    // Used by react-native-github/Libraries/ components
    PooledClass: require('PooledClass'), // Components/Touchable
    ReactDebugTool: require('ReactDebugTool'), // RCTRenderingPerf, Systrace
    ReactGlobalSharedState: require('ReactGlobalSharedState'), // Systrace
    ReactNativeComponentTree: require('ReactNativeComponentTree'), // InspectorUtils, ScrollResponder
    ReactNativePropRegistry: require('ReactNativePropRegistry'), // flattenStyle, Stylesheet
    ReactPerf: require('ReactPerf'), // ReactPerfStallHandler, RCTRenderingPerf
    TouchHistoryMath: require('TouchHistoryMath'), // PanResponder
    createReactNativeComponentClass: require('createReactNativeComponentClass'), // eg Text
    takeSnapshot: require('takeSnapshot'), // react-native-implementation
  },
};

// Inject the runtime into a devtools global hook regardless of browser.
// Allows for debugging when the hook is injected on the page.
/* globals __REACT_DEVTOOLS_GLOBAL_HOOK__ */
if (
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.inject === 'function'
) {
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
