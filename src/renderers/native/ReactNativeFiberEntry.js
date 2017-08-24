/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeFiberEntry
 * @flow
 */

'use strict';

import 'ReactNativeInjection';
import {
  injection as ReactFiberErrorLoggerInjection,
} from 'ReactFiberErrorLogger';
import {
  injection as ReactGenericBatchingInjection,
  batchedUpdates,
} from 'ReactGenericBatching';
import ReactNativeComponent from 'ReactNativeComponent';
import {showFiberErrorDialog} from 'ReactNativeFiberErrorDialog';
import {createPortal} from 'ReactPortal';
import {getClosestInstanceFromNode} from 'ReactNativeComponentTree';
import ReactNativeFiberRenderer from 'ReactNativeFiberRenderer';
import {getInspectorDataForViewTag} from 'ReactNativeFiberInspector';
import ReactVersion from 'ReactVersion';
import UIManager from 'UIManager';
import findNumericNodeHandle from 'findNumericNodeHandle';
import {injectInternals} from 'ReactFiberDevToolsHook';

// These can be removed once we stop exposing them to RN internals.
import NativeMethodsMixin from 'NativeMethodsMixin';
import ReactGlobalSharedState from 'ReactGlobalSharedState';
import * as ReactNativeComponentTree from 'ReactNativeComponentTree';
import ReactNativePropRegistry from 'ReactNativePropRegistry';
import TouchHistoryMath from 'TouchHistoryMath';
import createReactNativeComponentClass from 'createReactNativeComponentClass';
import takeSnapshot from 'takeSnapshot';

import type {ReactNativeType} from 'ReactNativeTypes';
import type {ReactNodeList} from 'ReactTypes';

ReactGenericBatchingInjection.injectBatchedUpdatesImplementation(
  ReactNativeFiberRenderer.batchedUpdates,
);

// Intercept lifecycle errors and ensure they are shown with the correct stack
// trace within the native redbox component.
ReactFiberErrorLoggerInjection.injectDialog(showFiberErrorDialog);

const roots = new Map();

const ReactNativeFiber: ReactNativeType = {
  NativeComponent: ReactNativeComponent,

  findNodeHandle: findNumericNodeHandle,

  render(element: ReactElement<any>, containerTag: any, callback: ?Function) {
    let root = roots.get(containerTag);

    if (!root) {
      // TODO (bvaughn): If we decide to keep the wrapper component,
      // We could create a wrapper for containerTag as well to reduce special casing.
      root = ReactNativeFiberRenderer.createContainer(containerTag);
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
    ReactNativeFiber.unmountComponentAtNode(containerTag);

    // Call back into native to remove all of the subviews from this container
    UIManager.removeRootView(containerTag);
  },

  unstable_createPortal(
    children: ReactNodeList,
    containerTag: number,
    key: ?string = null,
  ) {
    return createPortal(children, containerTag, null, key);
  },

  unstable_batchedUpdates: batchedUpdates,

  flushSync: ReactNativeFiberRenderer.flushSync,

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    // Used as a mixin in many createClass-based components
    NativeMethodsMixin,

    // Used by react-native-github/Libraries/ components
    ReactGlobalSharedState, // Systrace
    ReactNativeComponentTree, // InspectorUtils, ScrollResponder
    ReactNativePropRegistry, // flattenStyle, Stylesheet
    TouchHistoryMath, // PanResponder
    createReactNativeComponentClass, // eg Text
    takeSnapshot, // react-native-implementation
  },
};

if (__DEV__) {
  // $FlowFixMe
  Object.assign(
    ReactNativeFiber.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
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
  findFiberByHostInstance: getClosestInstanceFromNode,
  findHostInstanceByFiber: ReactNativeFiberRenderer.findHostInstance,
  getInspectorDataForViewTag,
  // This is an enum because we may add more (e.g. profiler build)
  bundleType: __DEV__ ? 1 : 0,
  version: ReactVersion,
  rendererPackageName: 'react-native',
});

// TODO: this fixes Rollup build but probably breaks Jest.
// Need to figure something out.
export default ReactNativeFiber;
