/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const ReactFiberErrorLogger = require('ReactFiberErrorLogger');
const ReactGenericBatching = require('ReactGenericBatching');
const ReactNativeFiberErrorDialog = require('ReactNativeFiberErrorDialog');
const ReactPortal = require('ReactPortal');
const ReactNativeComponentTree = require('ReactNativeComponentTree');
const ReactNativeFiberRenderer = require('ReactNativeFiberRenderer');
const ReactNativeFiberInspector = require('ReactNativeFiberInspector');
const ReactVersion = require('ReactVersion');
const UIManager = require('UIManager');

const findNumericNodeHandle = require('findNumericNodeHandle');

const {injectInternals} = require('ReactFiberDevToolsHook');

import type {ReactNativeType} from 'ReactNativeTypes';
import type {ReactNodeList} from 'ReactTypes';

require('ReactNativeInjection');

ReactGenericBatching.injection.injectFiberBatchedUpdates(
  ReactNativeFiberRenderer.batchedUpdates,
);

const roots = new Map();

// Intercept lifecycle errors and ensure they are shown with the correct stack
// trace within the native redbox component.
ReactFiberErrorLogger.injection.injectDialog(
  ReactNativeFiberErrorDialog.showDialog,
);

const ReactNativeRenderer: ReactNativeType = {
  NativeComponent: require('ReactNativeComponent'),

  findNodeHandle: findNumericNodeHandle,

  render(element: React$Element<any>, containerTag: any, callback: ?Function) {
    let root = roots.get(containerTag);

    if (!root) {
      // TODO (bvaughn): If we decide to keep the wrapper component,
      // We could create a wrapper for containerTag as well to reduce special casing.
      root = ReactNativeFiberRenderer.createContainer(containerTag, false);
      roots.set(containerTag, root);
    }
    ReactNativeFiberRenderer.updateContainer(element, root, null, callback);

    return ReactNativeFiberRenderer.getPublicRootInstance(root);
  },

  unmountComponentAtNode(containerTag: number) {
    const root = roots.get(containerTag);
    if (root) {
      // TODO: Is it safe to reset this now or should I wait since this unmount could be deferred?
      ReactNativeFiberRenderer.updateContainer(null, root, null, () => {
        roots.delete(containerTag);
      });
    }
  },

  unmountComponentAtNodeAndRemoveContainer(containerTag: number) {
    ReactNativeRenderer.unmountComponentAtNode(containerTag);

    // Call back into native to remove all of the subviews from this container
    UIManager.removeRootView(containerTag);
  },

  createPortal(
    children: ReactNodeList,
    containerTag: number,
    key: ?string = null,
  ) {
    return ReactPortal.createPortal(children, containerTag, null, key);
  },

  unstable_batchedUpdates: ReactGenericBatching.batchedUpdates,

  flushSync: ReactNativeFiberRenderer.flushSync,

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    // Used as a mixin in many createClass-based components
    NativeMethodsMixin: require('NativeMethodsMixin'),

    // Used by react-native-github/Libraries/ components
    ReactNativeBridgeEventPlugin: require('ReactNativeBridgeEventPlugin'), // requireNativeComponent
    ReactGlobalSharedState: require('ReactGlobalSharedState'), // Systrace
    ReactNativeComponentTree: require('ReactNativeComponentTree'), // InspectorUtils, ScrollResponder
    ReactNativePropRegistry: require('ReactNativePropRegistry'), // flattenStyle, Stylesheet
    TouchHistoryMath: require('TouchHistoryMath'), // PanResponder
    createReactNativeComponentClass: require('createReactNativeComponentClass'), // eg RCTText, RCTView, ReactNativeART
    takeSnapshot: require('takeSnapshot'), // react-native-implementation
  },
};

if (__DEV__) {
  // $FlowFixMe
  Object.assign(
    ReactNativeRenderer.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    {
      // TODO: none of these work since Fiber. Remove these dependencies.
      // Used by RCTRenderingPerf, Systrace:
      ReactDebugTool: {
        addHook() {},
        removeHook() {},
      },
      // Used by ReactPerfStallHandler, RCTRenderingPerf:
      ReactPerf: {
        start() {},
        stop() {},
        printInclusive() {},
        printWasted() {},
      },
    },
  );
}

injectInternals({
  findFiberByHostInstance: ReactNativeComponentTree.getClosestInstanceFromNode,
  findHostInstanceByFiber: ReactNativeFiberRenderer.findHostInstance,
  getInspectorDataForViewTag: ReactNativeFiberInspector.getInspectorDataForViewTag,
  // This is an enum because we may add more (e.g. profiler build)
  bundleType: __DEV__ ? 1 : 0,
  version: ReactVersion,
  rendererPackageName: 'react-native-renderer',
});

module.exports = ReactNativeRenderer;
