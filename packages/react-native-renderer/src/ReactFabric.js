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

import './ReactFabricInjection';

import * as ReactPortal from 'shared/ReactPortal';
import * as ReactGenericBatching from 'events/ReactGenericBatching';
import ReactVersion from 'shared/ReactVersion';

import NativeMethodsMixin from './NativeMethodsMixin';
import ReactNativeBridgeEventPlugin from './ReactNativeBridgeEventPlugin';
import ReactNativeComponent from './ReactNativeComponent';
import * as ReactNativeComponentTree from './ReactNativeComponentTree';
import ReactFabricRenderer from './ReactFabricRenderer';
import ReactNativePropRegistry from './ReactNativePropRegistry';
import {getInspectorDataForViewTag} from './ReactNativeFiberInspector';
import createReactNativeComponentClass from './createReactNativeComponentClass';
import {injectFindHostInstance} from './findNodeHandle';
import findNumericNodeHandle from './findNumericNodeHandle';
import takeSnapshot from './takeSnapshot';

injectFindHostInstance(ReactFabricRenderer.findHostInstance);

ReactGenericBatching.injection.injectRenderer(ReactFabricRenderer);

const roots = new Map();

const ReactFabric: ReactNativeType = {
  NativeComponent: ReactNativeComponent,

  findNodeHandle: findNumericNodeHandle,

  render(element: React$Element<any>, containerTag: any, callback: ?Function) {
    let root = roots.get(containerTag);

    if (!root) {
      // TODO (bvaughn): If we decide to keep the wrapper component,
      // We could create a wrapper for containerTag as well to reduce special casing.
      root = ReactFabricRenderer.createContainer(containerTag, false, false);
      roots.set(containerTag, root);
    }
    ReactFabricRenderer.updateContainer(element, root, null, callback);

    return ReactFabricRenderer.getPublicRootInstance(root);
  },

  unmountComponentAtNode(containerTag: number) {
    const root = roots.get(containerTag);
    if (root) {
      // TODO: Is it safe to reset this now or should I wait since this unmount could be deferred?
      ReactFabricRenderer.updateContainer(null, root, null, () => {
        roots.delete(containerTag);
      });
    }
  },

  unmountComponentAtNodeAndRemoveContainer(containerTag: number) {
    ReactFabric.unmountComponentAtNode(containerTag);
  },

  createPortal(
    children: ReactNodeList,
    containerTag: number,
    key: ?string = null,
  ) {
    return ReactPortal.createPortal(children, containerTag, null, key);
  },

  unstable_batchedUpdates: ReactGenericBatching.batchedUpdates,

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    // Used as a mixin in many createClass-based components
    NativeMethodsMixin,
    // Used by react-native-github/Libraries/ components
    ReactNativeBridgeEventPlugin, // requireNativeComponent
    ReactNativeComponentTree, // ScrollResponder
    ReactNativePropRegistry, // flattenStyle, Stylesheet
    createReactNativeComponentClass, // RCTText, RCTView, ReactNativeART
    takeSnapshot, // react-native-implementation
  },
};

if (__DEV__) {
  // $FlowFixMe
  Object.assign(
    ReactFabric.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
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

ReactFabricRenderer.injectIntoDevTools({
  findFiberByHostInstance: ReactNativeComponentTree.getClosestInstanceFromNode,
  getInspectorDataForViewTag: getInspectorDataForViewTag,
  bundleType: __DEV__ ? 1 : 0,
  version: ReactVersion,
  rendererPackageName: 'react-native-renderer',
});

export default ReactFabric;
