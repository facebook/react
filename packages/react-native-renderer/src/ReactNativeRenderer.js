/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNativeType} from './ReactNativeTypes';
import type {ReactNodeList} from 'shared/ReactTypes';

import './ReactNativeInjection';

import * as ReactPortal from 'shared/ReactPortal';
import * as ReactGenericBatching from 'events/ReactGenericBatching';
import TouchHistoryMath from 'events/TouchHistoryMath';
import * as ReactGlobalSharedState from 'shared/ReactGlobalSharedState';
import ReactVersion from 'shared/ReactVersion';
// Module provided by RN:
import UIManager from 'UIManager';

import NativeMethodsMixin from './NativeMethodsMixin';
import ReactNativeBridgeEventPlugin from './ReactNativeBridgeEventPlugin';
import ReactNativeComponent from './ReactNativeComponent';
import * as ReactNativeComponentTree from './ReactNativeComponentTree';
import ReactNativeFiberRenderer from './ReactNativeFiberRenderer';
import ReactNativePropRegistry from './ReactNativePropRegistry';
import {getInspectorDataForViewTag} from './ReactNativeFiberInspector';
import createReactNativeComponentClass from './createReactNativeComponentClass';
import findNumericNodeHandle from './findNumericNodeHandle';
import takeSnapshot from './takeSnapshot';

ReactGenericBatching.injection.injectFiberBatchedUpdates(
  ReactNativeFiberRenderer.batchedUpdates,
);

const roots = new Map();

const ReactNativeRenderer: ReactNativeType = {
  NativeComponent: ReactNativeComponent,

  findNodeHandle: findNumericNodeHandle,

  render(element: React$Element<any>, containerTag: any, callback: ?Function) {
    let root = roots.get(containerTag);

    if (!root) {
      // TODO (bvaughn): If we decide to keep the wrapper component,
      // We could create a wrapper for containerTag as well to reduce special casing.
      root = ReactNativeFiberRenderer.createContainer(
        containerTag,
        false,
        false,
      );
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
    NativeMethodsMixin,
    // Used by react-native-github/Libraries/ components
    ReactNativeBridgeEventPlugin, // requireNativeComponent
    ReactGlobalSharedState, // Systrace
    ReactNativeComponentTree, // InspectorUtils, ScrollResponder
    ReactNativePropRegistry, // flattenStyle, Stylesheet
    TouchHistoryMath, // PanResponder
    createReactNativeComponentClass, // RCTText, RCTView, ReactNativeART
    takeSnapshot, // react-native-implementation
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

ReactNativeFiberRenderer.injectIntoDevTools({
  findFiberByHostInstance: ReactNativeComponentTree.getClosestInstanceFromNode,
  getInspectorDataForViewTag: getInspectorDataForViewTag,
  bundleType: __DEV__ ? 1 : 0,
  version: ReactVersion,
  rendererPackageName: 'react-native-renderer',
});

export default ReactNativeRenderer;
