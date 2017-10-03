/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactNativeRTFiberEntry
 * @flow
 */

'use strict';

const ReactFiberErrorLogger = require('ReactFiberErrorLogger');
const ReactGenericBatching = require('ReactGenericBatching');
const ReactNativeFiberErrorDialog = require('ReactNativeFiberErrorDialog'); // Reused from RN, seems fine?
const ReactPortal = require('ReactPortal');
const ReactNativeRTComponentTree = require('ReactNativeRTComponentTree');
const ReactNativeRTFiberRenderer = require('ReactNativeRTFiberRenderer');
const ReactNativeRTFiberInspector = require('ReactNativeRTFiberInspector');
const ReactVersion = require('ReactVersion');

const {injectInternals} = require('ReactFiberDevToolsHook');

import type {ReactNativeRTType} from 'ReactNativeRTTypes';
import type {ReactNodeList} from 'ReactTypes';

/**
 * Make sure essential globals are available and are patched correctly. Please don't remove this
 * line. Bundles created by react-packager `require` it before executing any application code. This
 * ensures it exists in the dependency graph and can be `require`d.
 * TODO: require this in packager, not in React #10932517
 */
require('InitializeCore');

var RCTEventEmitter = require('RCTEventEmitter');
var ReactNativeEventEmitter = require('ReactNativeEventEmitter');

/**
 * Register the event emitter with the native bridge
 */
RCTEventEmitter.register(ReactNativeEventEmitter);

ReactGenericBatching.injection.injectFiberBatchedUpdates(
  ReactNativeRTFiberRenderer.batchedUpdates,
);

const roots = new Map();

// Intercept lifecycle errors and ensure they are shown with the correct stack
// trace within the native redbox component.
ReactFiberErrorLogger.injection.injectDialog(
  ReactNativeFiberErrorDialog.showDialog,
);

const ReactNativeRTFiber: ReactNativeRTType = {
  render(element: React$Element<any>, containerTag: any, callback: ?Function) {
    let root = roots.get(containerTag);

    if (!root) {
      // TODO (bvaughn): If we decide to keep the wrapper component,
      // We could create a wrapper for containerTag as well to reduce special casing.
      root = ReactNativeRTFiberRenderer.createContainer(containerTag);
      roots.set(containerTag, root);
    }
    ReactNativeRTFiberRenderer.updateContainer(element, root, null, callback);

    return ReactNativeRTFiberRenderer.getPublicRootInstance(root);
  },

  unmountComponentAtNode(containerTag: number) {
    const root = roots.get(containerTag);
    if (root) {
      // TODO: Is it safe to reset this now or should I wait since this unmount could be deferred?
      ReactNativeRTFiberRenderer.updateContainer(null, root, null, () => {
        roots.delete(containerTag);
      });
    }
  },

  createPortal(
    children: ReactNodeList,
    containerTag: number,
    key: ?string = null,
  ) {
    return ReactPortal.createPortal(children, containerTag, null, key);
  },

  unstable_batchedUpdates: ReactGenericBatching.batchedUpdates,

  flushSync: ReactNativeRTFiberRenderer.flushSync,
};

injectInternals({
  findFiberByHostInstance: ReactNativeRTComponentTree.getFiberFromTag,
  findHostInstanceByFiber: ReactNativeRTFiberRenderer.findHostInstance,
  getInspectorDataForViewTag: ReactNativeRTFiberInspector.getInspectorDataForViewTag,
  // This is an enum because we may add more (e.g. profiler build)
  bundleType: __DEV__ ? 1 : 0,
  version: ReactVersion,
  rendererPackageName: 'react-native-rt',
});

module.exports = ReactNativeRTFiber;
