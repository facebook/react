/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNativeType} from './ReactNativeTypes';
import type {ReactNodeList} from 'shared/ReactTypes';

import './ReactNativeInjection';

import {
  findHostInstance,
  findHostInstanceWithWarning,
  batchedUpdates as batchedUpdatesImpl,
  batchedEventUpdates,
  discreteUpdates,
  flushDiscreteUpdates,
  createContainer,
  updateContainer,
  injectIntoDevTools,
  getPublicRootInstance,
} from 'react-reconciler/inline.native';
// TODO: direct imports like some-package/src/* are bad. Fix me.
import {getStackByFiberInDevAndProd} from 'react-reconciler/src/ReactCurrentFiber';
import {createPortal} from 'shared/ReactPortal';
import {
  setBatchingImplementation,
  batchedUpdates,
} from 'legacy-events/ReactGenericBatching';
import ReactVersion from 'shared/ReactVersion';
// Module provided by RN:
import {UIManager} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';

import NativeMethodsMixin from './NativeMethodsMixin';
import ReactNativeComponent from './ReactNativeComponent';
import {getClosestInstanceFromNode} from './ReactNativeComponentTree';
import {getInspectorDataForViewTag} from './ReactNativeFiberInspector';
import {setNativeProps} from './ReactNativeRendererSharedExports';

import {LegacyRoot} from 'shared/ReactRootTags';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import getComponentName from 'shared/getComponentName';
import warningWithoutStack from 'shared/warningWithoutStack';

const ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;

function findNodeHandle(componentOrHandle: any): ?number {
  if (__DEV__) {
    const owner = ReactCurrentOwner.current;
    if (owner !== null && owner.stateNode !== null) {
      warningWithoutStack(
        owner.stateNode._warnedAboutRefsInRender,
        '%s is accessing findNodeHandle inside its render(). ' +
          'render() should be a pure function of props and state. It should ' +
          'never access something that requires stale data from the previous ' +
          'render, such as refs. Move this logic to componentDidMount and ' +
          'componentDidUpdate instead.',
        getComponentName(owner.type) || 'A component',
      );

      owner.stateNode._warnedAboutRefsInRender = true;
    }
  }
  if (componentOrHandle == null) {
    return null;
  }
  if (typeof componentOrHandle === 'number') {
    // Already a node handle
    return componentOrHandle;
  }
  if (componentOrHandle._nativeTag) {
    return componentOrHandle._nativeTag;
  }
  if (componentOrHandle.canonical && componentOrHandle.canonical._nativeTag) {
    return componentOrHandle.canonical._nativeTag;
  }
  let hostInstance;
  if (__DEV__) {
    hostInstance = findHostInstanceWithWarning(
      componentOrHandle,
      'findNodeHandle',
    );
  } else {
    hostInstance = findHostInstance(componentOrHandle);
  }

  if (hostInstance == null) {
    return hostInstance;
  }
  if ((hostInstance: any).canonical) {
    // Fabric
    return (hostInstance: any).canonical._nativeTag;
  }
  return hostInstance._nativeTag;
}

setBatchingImplementation(
  batchedUpdatesImpl,
  discreteUpdates,
  flushDiscreteUpdates,
  batchedEventUpdates,
);

function computeComponentStackForErrorReporting(reactTag: number): string {
  let fiber = getClosestInstanceFromNode(reactTag);
  if (!fiber) {
    return '';
  }
  return getStackByFiberInDevAndProd(fiber);
}

const roots = new Map();

const ReactNativeRenderer: ReactNativeType = {
  NativeComponent: ReactNativeComponent(findNodeHandle, findHostInstance),

  findNodeHandle,

  dispatchCommand(handle: any, command: string, args: Array<any>) {
    if (handle._nativeTag == null) {
      warningWithoutStack(
        handle._nativeTag != null,
        "dispatchCommand was called with a ref that isn't a " +
          'native component. Use React.forwardRef to get access to the underlying native component',
      );
      return;
    }

    UIManager.dispatchViewManagerCommand(handle._nativeTag, command, args);
  },

  setNativeProps,

  render(element: React$Element<any>, containerTag: any, callback: ?Function) {
    let root = roots.get(containerTag);

    if (!root) {
      // TODO (bvaughn): If we decide to keep the wrapper component,
      // We could create a wrapper for containerTag as well to reduce special casing.
      root = createContainer(containerTag, LegacyRoot, false, null);
      roots.set(containerTag, root);
    }
    updateContainer(element, root, null, callback);

    return getPublicRootInstance(root);
  },

  unmountComponentAtNode(containerTag: number) {
    const root = roots.get(containerTag);
    if (root) {
      // TODO: Is it safe to reset this now or should I wait since this unmount could be deferred?
      updateContainer(null, root, null, () => {
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
    return createPortal(children, containerTag, null, key);
  },

  unstable_batchedUpdates: batchedUpdates,

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    // Used as a mixin in many createClass-based components
    NativeMethodsMixin: NativeMethodsMixin(findNodeHandle, findHostInstance),
    computeComponentStackForErrorReporting,
  },
};

injectIntoDevTools({
  findFiberByHostInstance: getClosestInstanceFromNode,
  getInspectorDataForViewTag: getInspectorDataForViewTag,
  bundleType: __DEV__ ? 1 : 0,
  version: ReactVersion,
  rendererPackageName: 'react-native-renderer',
});

export default ReactNativeRenderer;
