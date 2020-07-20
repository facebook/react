/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {HostComponent} from './ReactNativeTypes';
import type {ReactNodeList} from 'shared/ReactTypes';
import type {ElementRef} from 'react';

import './ReactFabricInjection';

import {
  findHostInstance,
  findHostInstanceWithWarning,
  batchedEventUpdates,
  batchedUpdates as batchedUpdatesImpl,
  discreteUpdates,
  flushDiscreteUpdates,
  createContainer,
  updateContainer,
  injectIntoDevTools,
  getPublicRootInstance,
} from 'react-reconciler/src/ReactFiberReconciler';

import {createPortal as createPortalImpl} from 'react-reconciler/src/ReactPortal';
import {setBatchingImplementation} from './legacy-events/ReactGenericBatching';
import ReactVersion from 'shared/ReactVersion';

// Module provided by RN:
import {UIManager} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';

import {getClosestInstanceFromNode} from './ReactFabricComponentTree';
import {
  getInspectorDataForViewTag,
  getInspectorDataForViewAtPoint,
} from './ReactNativeFiberInspector';
import {LegacyRoot} from 'react-reconciler/src/ReactRootTags';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import getComponentName from 'shared/getComponentName';

const ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;

function findHostInstance_DEPRECATED(
  componentOrHandle: any,
): ?ElementRef<HostComponent<mixed>> {
  if (__DEV__) {
    const owner = ReactCurrentOwner.current;
    if (owner !== null && owner.stateNode !== null) {
      if (!owner.stateNode._warnedAboutRefsInRender) {
        console.error(
          '%s is accessing findNodeHandle inside its render(). ' +
            'render() should be a pure function of props and state. It should ' +
            'never access something that requires stale data from the previous ' +
            'render, such as refs. Move this logic to componentDidMount and ' +
            'componentDidUpdate instead.',
          getComponentName(owner.type) || 'A component',
        );
      }

      owner.stateNode._warnedAboutRefsInRender = true;
    }
  }
  if (componentOrHandle == null) {
    return null;
  }
  if (componentOrHandle._nativeTag) {
    return componentOrHandle;
  }
  if (componentOrHandle.canonical && componentOrHandle.canonical._nativeTag) {
    return componentOrHandle.canonical;
  }
  let hostInstance;
  if (__DEV__) {
    hostInstance = findHostInstanceWithWarning(
      componentOrHandle,
      'findHostInstance_DEPRECATED',
    );
  } else {
    hostInstance = findHostInstance(componentOrHandle);
  }

  if (hostInstance == null) {
    return hostInstance;
  }
  if ((hostInstance: any).canonical) {
    // Fabric
    return (hostInstance: any).canonical;
  }
  return hostInstance;
}

function findNodeHandle(componentOrHandle: any): ?number {
  if (__DEV__) {
    const owner = ReactCurrentOwner.current;
    if (owner !== null && owner.stateNode !== null) {
      if (!owner.stateNode._warnedAboutRefsInRender) {
        console.error(
          '%s is accessing findNodeHandle inside its render(). ' +
            'render() should be a pure function of props and state. It should ' +
            'never access something that requires stale data from the previous ' +
            'render, such as refs. Move this logic to componentDidMount and ' +
            'componentDidUpdate instead.',
          getComponentName(owner.type) || 'A component',
        );
      }

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
  // TODO: the code is right but the types here are wrong.
  // https://github.com/facebook/react/pull/12863
  if ((hostInstance: any).canonical) {
    // Fabric
    return (hostInstance: any).canonical._nativeTag;
  }
  return hostInstance._nativeTag;
}

function dispatchCommand(handle: any, command: string, args: Array<any>) {
  if (handle._nativeTag == null) {
    if (__DEV__) {
      console.error(
        "dispatchCommand was called with a ref that isn't a " +
          'native component. Use React.forwardRef to get access to the underlying native component',
      );
    }

    return;
  }

  if (handle._internalInstanceHandle) {
    nativeFabricUIManager.dispatchCommand(
      handle._internalInstanceHandle.stateNode.node,
      command,
      args,
    );
  } else {
    UIManager.dispatchViewManagerCommand(handle._nativeTag, command, args);
  }
}

function render(
  element: React$Element<any>,
  containerTag: any,
  callback: ?Function,
) {
  let root = roots.get(containerTag);

  if (!root) {
    // TODO (bvaughn): If we decide to keep the wrapper component,
    // We could create a wrapper for containerTag as well to reduce special casing.
    root = createContainer(containerTag, LegacyRoot, false, null);
    roots.set(containerTag, root);
  }
  updateContainer(element, root, null, callback);

  return getPublicRootInstance(root);
}

function unmountComponentAtNode(containerTag: number) {
  this.stopSurface(containerTag);
}

function stopSurface(containerTag: number) {
  const root = roots.get(containerTag);
  if (root) {
    // TODO: Is it safe to reset this now or should I wait since this unmount could be deferred?
    updateContainer(null, root, null, () => {
      roots.delete(containerTag);
    });
  }
}

function createPortal(
  children: ReactNodeList,
  containerTag: number,
  key: ?string = null,
) {
  return createPortalImpl(children, containerTag, null, key);
}

setBatchingImplementation(
  batchedUpdatesImpl,
  discreteUpdates,
  flushDiscreteUpdates,
  batchedEventUpdates,
);

const roots = new Map();

export {
  // This is needed for implementation details of TouchableNativeFeedback
  // Remove this once TouchableNativeFeedback doesn't use cloneElement
  findHostInstance_DEPRECATED,
  findNodeHandle,
  dispatchCommand,
  render,
  // Deprecated - this function is being renamed to stopSurface, use that instead.
  // TODO (T47576999): Delete this once it's no longer called from native code.
  unmountComponentAtNode,
  stopSurface,
  createPortal,
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
