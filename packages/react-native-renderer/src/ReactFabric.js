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
import type {ElementRef, Element, ElementType} from 'react';

import './ReactFabricInjection';

import {
  findHostInstance,
  findHostInstanceWithWarning,
  batchedUpdates as batchedUpdatesImpl,
  discreteUpdates,
  createContainer,
  updateContainer,
  injectIntoDevTools,
  getPublicRootInstance,
} from 'react-reconciler/src/ReactFiberReconciler';
import {getInspectorDataForInstance} from './ReactNativeFiberInspector';

import {createPortal as createPortalImpl} from 'react-reconciler/src/ReactPortal';
import {setBatchingImplementation} from './legacy-events/ReactGenericBatching';
import ReactVersion from 'shared/ReactVersion';

// Modules provided by RN:
import {
  UIManager,
  legacySendAccessibilityEvent,
} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';

import {getClosestInstanceFromNode} from './ReactFabricComponentTree';
import {
  getInspectorDataForViewTag,
  getInspectorDataForViewAtPoint,
} from './ReactNativeFiberInspector';
import {LegacyRoot, ConcurrentRoot} from 'react-reconciler/src/ReactRootTags';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import getComponentNameFromType from 'shared/getComponentNameFromType';

const ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;

function findHostInstance_DEPRECATED<TElementType: ElementType>(
  componentOrHandle: ?(ElementRef<TElementType> | number),
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
          getComponentNameFromType(owner.type) || 'A component',
        );
      }

      owner.stateNode._warnedAboutRefsInRender = true;
    }
  }
  if (componentOrHandle == null) {
    return null;
  }
  // $FlowIssue Flow has hardcoded values for React DOM that don't work with RN
  if (componentOrHandle._nativeTag) {
    // $FlowIssue Flow has hardcoded values for React DOM that don't work with RN
    return componentOrHandle;
  }
  // $FlowIssue Flow has hardcoded values for React DOM that don't work with RN
  if (componentOrHandle.canonical && componentOrHandle.canonical._nativeTag) {
    // $FlowIssue Flow has hardcoded values for React DOM that don't work with RN
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
  // $FlowFixMe[incompatible-return]
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
          getComponentNameFromType(owner.type) || 'A component',
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

  if (handle._internalInstanceHandle != null) {
    const {stateNode} = handle._internalInstanceHandle;
    if (stateNode != null) {
      nativeFabricUIManager.dispatchCommand(stateNode.node, command, args);
    }
  } else {
    UIManager.dispatchViewManagerCommand(handle._nativeTag, command, args);
  }
}

function sendAccessibilityEvent(handle: any, eventType: string) {
  if (handle._nativeTag == null) {
    if (__DEV__) {
      console.error(
        "sendAccessibilityEvent was called with a ref that isn't a " +
          'native component. Use React.forwardRef to get access to the underlying native component',
      );
    }
    return;
  }

  if (handle._internalInstanceHandle != null) {
    const {stateNode} = handle._internalInstanceHandle;
    if (stateNode != null) {
      nativeFabricUIManager.sendAccessibilityEvent(stateNode.node, eventType);
    }
  } else {
    legacySendAccessibilityEvent(handle._nativeTag, eventType);
  }
}

function onRecoverableError(error) {
  // TODO: Expose onRecoverableError option to userspace
  // eslint-disable-next-line react-internal/no-production-logging, react-internal/warning-args
  console.error(error);
}

function render(
  element: Element<ElementType>,
  containerTag: number,
  callback: ?() => void,
  concurrentRoot: ?boolean,
): ?ElementRef<ElementType> {
  let root = roots.get(containerTag);

  if (!root) {
    // TODO (bvaughn): If we decide to keep the wrapper component,
    // We could create a wrapper for containerTag as well to reduce special casing.
    root = createContainer(
      containerTag,
      concurrentRoot ? ConcurrentRoot : LegacyRoot,
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

  // $FlowIssue Flow has hardcoded values for React DOM that don't work with RN
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

setBatchingImplementation(batchedUpdatesImpl, discreteUpdates);

const roots = new Map();

export {
  // This is needed for implementation details of TouchableNativeFeedback
  // Remove this once TouchableNativeFeedback doesn't use cloneElement
  findHostInstance_DEPRECATED,
  findNodeHandle,
  dispatchCommand,
  sendAccessibilityEvent,
  render,
  // Deprecated - this function is being renamed to stopSurface, use that instead.
  // TODO (T47576999): Delete this once it's no longer called from native code.
  unmountComponentAtNode,
  stopSurface,
  createPortal,
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
