/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactFabricType} from './ReactNativeTypes';
import type {ReactNodeList} from 'shared/ReactTypes';

import './ReactFabricInjection';

import * as ReactFabricRenderer from 'react-reconciler/inline.fabric';

import * as ReactPortal from 'shared/ReactPortal';
import * as ReactGenericBatching from 'events/ReactGenericBatching';
import ReactVersion from 'shared/ReactVersion';

import NativeMethodsMixin from './NativeMethodsMixin';
import ReactNativeComponent from './ReactNativeComponent';
import * as ReactNativeComponentTree from './ReactNativeComponentTree';
import {getInspectorDataForViewTag} from './ReactNativeFiberInspector';

import {ReactCurrentOwner} from 'shared/ReactGlobalSharedState';
import getComponentName from 'shared/getComponentName';
import warning from 'fbjs/lib/warning';

const findHostInstance = ReactFabricRenderer.findHostInstance;

function findNodeHandle(componentOrHandle: any): ?number {
  if (__DEV__) {
    const owner = ReactCurrentOwner.current;
    if (owner !== null && owner.stateNode !== null) {
      warning(
        owner.stateNode._warnedAboutRefsInRender,
        '%s is accessing findNodeHandle inside its render(). ' +
          'render() should be a pure function of props and state. It should ' +
          'never access something that requires stale data from the previous ' +
          'render, such as refs. Move this logic to componentDidMount and ' +
          'componentDidUpdate instead.',
        getComponentName(owner) || 'A component',
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
  const hostInstance = findHostInstance(componentOrHandle);
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

ReactGenericBatching.injection.injectRenderer(ReactFabricRenderer);

const roots = new Map();

const ReactFabric: ReactFabricType = {
  NativeComponent: ReactNativeComponent(findNodeHandle, findHostInstance),

  findNodeHandle,

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

  createPortal(
    children: ReactNodeList,
    containerTag: number,
    key: ?string = null,
  ) {
    return ReactPortal.createPortal(children, containerTag, null, key);
  },

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    // Used as a mixin in many createClass-based components
    NativeMethodsMixin: NativeMethodsMixin(findNodeHandle, findHostInstance),
  },
};

ReactFabricRenderer.injectIntoDevTools({
  findFiberByHostInstance: ReactNativeComponentTree.getClosestInstanceFromNode,
  getInspectorDataForViewTag: getInspectorDataForViewTag,
  bundleType: __DEV__ ? 1 : 0,
  version: ReactVersion,
  rendererPackageName: 'react-native-renderer',
});

export default ReactFabric;
