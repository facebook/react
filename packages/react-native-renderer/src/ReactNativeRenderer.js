/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactPortal, ReactNodeList} from 'shared/ReactTypes';
import type {ElementRef, Element, ElementType} from 'react';
import type {FiberRoot} from 'react-reconciler/src/ReactInternalTypes';

import './ReactNativeInjection';

import {
  batchedUpdates as batchedUpdatesImpl,
  discreteUpdates,
  createContainer,
  updateContainer,
  injectIntoDevTools,
  getPublicRootInstance,
} from 'react-reconciler/src/ReactFiberReconciler';
// TODO: direct imports like some-package/src/* are bad. Fix me.
import {getStackByFiberInDevAndProd} from 'react-reconciler/src/ReactFiberComponentStack';
import {createPortal as createPortalImpl} from 'react-reconciler/src/ReactPortal';
import {
  setBatchingImplementation,
  batchedUpdates,
} from './legacy-events/ReactGenericBatching';
import ReactVersion from 'shared/ReactVersion';
// Modules provided by RN:
import {UIManager} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';

import {getClosestInstanceFromNode} from './ReactNativeComponentTree';
import {
  getInspectorDataForViewTag,
  getInspectorDataForViewAtPoint,
  getInspectorDataForInstance,
} from './ReactNativeFiberInspector';
import {LegacyRoot} from 'react-reconciler/src/ReactRootTags';
import {
  findHostInstance_DEPRECATED,
  findNodeHandle,
  dispatchCommand,
  sendAccessibilityEvent,
} from './ReactNativePublicCompat';

// $FlowFixMe[missing-local-annot]
function onRecoverableError(error) {
  // TODO: Expose onRecoverableError option to userspace
  // eslint-disable-next-line react-internal/no-production-logging, react-internal/warning-args
  console.error(error);
}

function render(
  element: Element<ElementType>,
  containerTag: number,
  callback: ?() => void,
): ?ElementRef<ElementType> {
  let root = roots.get(containerTag);

  if (!root) {
    // TODO (bvaughn): If we decide to keep the wrapper component,
    // We could create a wrapper for containerTag as well to reduce special casing.
    root = createContainer(
      containerTag,
      LegacyRoot,
      null,
      false,
      null,
      '',
      onRecoverableError,
      null,
    );
    roots.set(containerTag, root);
  }
  updateContainer(element, root, null, callback);

  return getPublicRootInstance(root);
}

function unmountComponentAtNode(containerTag: number) {
  const root = roots.get(containerTag);
  if (root) {
    // TODO: Is it safe to reset this now or should I wait since this unmount could be deferred?
    updateContainer(null, root, null, () => {
      roots.delete(containerTag);
    });
  }
}

function unmountComponentAtNodeAndRemoveContainer(containerTag: number) {
  unmountComponentAtNode(containerTag);

  // Call back into native to remove all of the subviews from this container
  UIManager.removeRootView(containerTag);
}

function createPortal(
  children: ReactNodeList,
  containerTag: number,
  key: ?string = null,
): ReactPortal {
  return createPortalImpl(children, containerTag, null, key);
}

setBatchingImplementation(batchedUpdatesImpl, discreteUpdates);

function computeComponentStackForErrorReporting(reactTag: number): string {
  const fiber = getClosestInstanceFromNode(reactTag);
  if (!fiber) {
    return '';
  }
  return getStackByFiberInDevAndProd(fiber);
}

const roots = new Map<number, FiberRoot>();

const Internals = {
  computeComponentStackForErrorReporting,
};

export {
  // This is needed for implementation details of TouchableNativeFeedback
  // Remove this once TouchableNativeFeedback doesn't use cloneElement
  findHostInstance_DEPRECATED,
  findNodeHandle,
  dispatchCommand,
  sendAccessibilityEvent,
  render,
  unmountComponentAtNode,
  unmountComponentAtNodeAndRemoveContainer,
  createPortal,
  batchedUpdates as unstable_batchedUpdates,
  Internals as __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  // This export is typically undefined in production builds.
  // See the "enableGetInspectorDataForInstanceInProduction" flag.
  getInspectorDataForInstance,
};

injectIntoDevTools({
  findFiberByHostInstance: getClosestInstanceFromNode,
  bundleType: __DEV__ ? 1 : 0,
  version: ReactVersion,
  rendererPackageName: 'react-native-renderer',
  rendererConfig: {
    getInspectorDataForViewTag: getInspectorDataForViewTag,
    getInspectorDataForViewAtPoint: getInspectorDataForViewAtPoint.bind(
      null,
      findNodeHandle,
    ),
  },
});
