/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactFiber';
import type {
  ReactFabricType,
  HostComponent as ReactNativeHostComponent,
} from './ReactNativeTypes';

import {
  findCurrentHostFiber,
  findCurrentFiberUsingSlowPath,
} from 'react-reconciler/reflection';
import getComponentName from 'shared/getComponentName';
import {HostComponent} from 'shared/ReactWorkTags';
import invariant from 'shared/invariant';
// Module provided by RN:
import {UIManager} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';

import {getClosestInstanceFromNode} from './ReactNativeComponentTree';

const emptyObject = {};
if (__DEV__) {
  Object.freeze(emptyObject);
}

let getInspectorDataForViewTag;
let getInspectorDataForViewAtPoint;

if (__DEV__) {
  const traverseOwnerTreeUp = function(hierarchy, instance: any) {
    if (instance) {
      hierarchy.unshift(instance);
      traverseOwnerTreeUp(hierarchy, instance._debugOwner);
    }
  };

  const getOwnerHierarchy = function(instance: any) {
    const hierarchy = [];
    traverseOwnerTreeUp(hierarchy, instance);
    return hierarchy;
  };

  const lastNonHostInstance = function(hierarchy) {
    for (let i = hierarchy.length - 1; i > 1; i--) {
      const instance = hierarchy[i];

      if (instance.tag !== HostComponent) {
        return instance;
      }
    }
    return hierarchy[0];
  };

  const getHostProps = function(fiber) {
    const host = findCurrentHostFiber(fiber);
    if (host) {
      return host.memoizedProps || emptyObject;
    }
    return emptyObject;
  };

  const getHostNode = function(fiber: Fiber | null, findNodeHandle) {
    let hostNode;
    // look for children first for the hostNode
    // as composite fibers do not have a hostNode
    while (fiber) {
      if (fiber.stateNode !== null && fiber.tag === HostComponent) {
        hostNode = findNodeHandle(fiber.stateNode);
      }
      if (hostNode) {
        return hostNode;
      }
      fiber = fiber.child;
    }
    return null;
  };

  const createHierarchy = function(fiberHierarchy) {
    return fiberHierarchy.map(fiber => ({
      name: getComponentName(fiber.type),
      getInspectorData: findNodeHandle => ({
        measure: callback =>
          UIManager.measure(getHostNode(fiber, findNodeHandle), callback),
        props: getHostProps(fiber),
        source: fiber._debugSource,
      }),
    }));
  };

  const getInspectorDataForInstance = function(closestInstance, frame): Object {
    // Handle case where user clicks outside of ReactNative
    if (!closestInstance) {
      return {
        hierarchy: [],
        props: emptyObject,
        selection: null,
        source: null,
      };
    }

    const fiber = findCurrentFiberUsingSlowPath(closestInstance);
    const fiberHierarchy = getOwnerHierarchy(fiber);
    const instance = lastNonHostInstance(fiberHierarchy);
    const hierarchy = createHierarchy(fiberHierarchy);
    const props = getHostProps(instance);
    const source = instance._debugSource;
    const selection = fiberHierarchy.indexOf(instance);

    return {
      hierarchy,
      frame,
      props,
      selection,
      source,
    };
  };

  getInspectorDataForViewTag = function(viewTag: number): Object {
    const closestInstance = getClosestInstanceFromNode(viewTag);

    // Handle case where user clicks outside of ReactNative
    if (!closestInstance) {
      return {
        hierarchy: [],
        props: emptyObject,
        selection: null,
        source: null,
      };
    }

    const fiber = findCurrentFiberUsingSlowPath(closestInstance);
    const fiberHierarchy = getOwnerHierarchy(fiber);
    const instance = lastNonHostInstance(fiberHierarchy);
    const hierarchy = createHierarchy(fiberHierarchy);
    const props = getHostProps(instance);
    const source = instance._debugSource;
    const selection = fiberHierarchy.indexOf(instance);

    return {
      hierarchy,
      props,
      selection,
      source,
    };
  };

  getInspectorDataForViewAtPoint = function(
    findNodeHandle,
    inspectedView: ?React.ElementRef<ReactNativeHostComponent<mixed>>,
    x: number,
    y: number,
    callback: (obj: Object) => mixed,
  ): void {
    let closestInstance = null;
    let frame = {
      left: 0,
      top: 0,
      width: 0,
      height: 0,
    };

    if (inspectedView._internalInstanceHandle != null) {
      // For Fabric we can look up the instance handle directly and measure it.
      nativeFabricUIManager.findNodeAtPoint(
        inspectedView._internalInstanceHandle.stateNode.node,
        x,
        y,
        shadowNode => {
          if (shadowNode == null) {
            callback(getInspectorDataForInstance(closestInstance, frame));
          }

          closestInstance =
            shadowNode.stateNode.canonical._internalInstanceHandle;
          nativeFabricUIManager.measure(
            shadowNode.stateNode.node,
            (x, y, width, height, pageX, pageY) => {
              frame = {
                left: pageX,
                top: pageY,
                width,
                height,
              };

              callback(getInspectorDataForInstance(closestInstance, frame));
            },
          );
        },
      );
    } else if (inspectedView._internalFiberInstanceHandle != null) {
      // For Paper we fall back to the old strategy using the React tag.
      UIManager.findSubviewIn(
        findNodeHandle(inspectedView),
        [x, y],
        (nativeViewTag, left, top, width, height) => {
          frame = {
            left,
            top,
            width,
            height,
          };
          const inspectorData = getInspectorDataForInstance(
            getClosestInstanceFromNode(nativeViewTag),
            frame,
          );
          callback({...inspectorData, nativeViewTag});
        },
      );
    } else if (__DEV__) {
      console.error(
        'getInspectorDataForViewAtPoint expects to receieve a host component',
      );

      return;
    }
  };
} else {
  getInspectorDataForViewTag = () => {
    invariant(
      false,
      'getInspectorDataForViewTag() is not available in production',
    );
  };

  getInspectorDataForViewAtPoint = () => {
    invariant(
      false,
      'getInspectorDataForViewAtPoint() is not available in production',
    );
  };
}

export {getInspectorDataForViewAtPoint, getInspectorDataForViewTag};
