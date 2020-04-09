/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import type {TouchedViewDataAtPoint, InspectorData} from './ReactNativeTypes';

import {
  findCurrentHostFiber,
  findCurrentFiberUsingSlowPath,
} from 'react-reconciler/src/ReactFiberTreeReflection';
import getComponentName from 'shared/getComponentName';
import {HostComponent} from 'react-reconciler/src/ReactWorkTags';
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
      getInspectorData: findNodeHandle => {
        return {
          props: getHostProps(fiber),
          source: fiber._debugSource,
          measure: callback => {
            // If this is Fabric, we'll find a ShadowNode and use that to measure.
            const hostFiber = findCurrentHostFiber(fiber);
            const shadowNode =
              hostFiber != null &&
              hostFiber.stateNode !== null &&
              hostFiber.stateNode.node;

            if (shadowNode) {
              nativeFabricUIManager.measure(shadowNode, callback);
            } else {
              return UIManager.measure(
                getHostNode(fiber, findNodeHandle),
                callback,
              );
            }
          },
        };
      },
    }));
  };

  const getInspectorDataForInstance = function(closestInstance): InspectorData {
    // Handle case where user clicks outside of ReactNative
    if (!closestInstance) {
      return {
        hierarchy: [],
        props: emptyObject,
        selectedIndex: null,
        source: null,
      };
    }

    const fiber = findCurrentFiberUsingSlowPath(closestInstance);
    const fiberHierarchy = getOwnerHierarchy(fiber);
    const instance = lastNonHostInstance(fiberHierarchy);
    const hierarchy = createHierarchy(fiberHierarchy);
    const props = getHostProps(instance);
    const source = instance._debugSource;
    const selectedIndex = fiberHierarchy.indexOf(instance);

    return {
      hierarchy,
      props,
      selectedIndex,
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
        selectedIndex: null,
        source: null,
      };
    }

    const fiber = findCurrentFiberUsingSlowPath(closestInstance);
    const fiberHierarchy = getOwnerHierarchy(fiber);
    const instance = lastNonHostInstance(fiberHierarchy);
    const hierarchy = createHierarchy(fiberHierarchy);
    const props = getHostProps(instance);
    const source = instance._debugSource;
    const selectedIndex = fiberHierarchy.indexOf(instance);

    return {
      hierarchy,
      props,
      selectedIndex,
      source,
    };
  };

  getInspectorDataForViewAtPoint = function(
    findNodeHandle: (componentOrHandle: any) => ?number,
    inspectedView: Object,
    locationX: number,
    locationY: number,
    callback: (viewData: TouchedViewDataAtPoint) => mixed,
  ): void {
    let closestInstance = null;

    if (inspectedView._internalInstanceHandle != null) {
      // For Fabric we can look up the instance handle directly and measure it.
      nativeFabricUIManager.findNodeAtPoint(
        inspectedView._internalInstanceHandle.stateNode.node,
        locationX,
        locationY,
        internalInstanceHandle => {
          if (internalInstanceHandle == null) {
            callback({
              pointerY: locationY,
              frame: {left: 0, top: 0, width: 0, height: 0},
              ...getInspectorDataForInstance(closestInstance),
            });
          }

          closestInstance =
            internalInstanceHandle.stateNode.canonical._internalInstanceHandle;
          nativeFabricUIManager.measure(
            internalInstanceHandle.stateNode.node,
            (x, y, width, height, pageX, pageY) => {
              callback({
                pointerY: locationY,
                frame: {left: pageX, top: pageY, width, height},
                ...getInspectorDataForInstance(closestInstance),
              });
            },
          );
        },
      );
    } else if (inspectedView._internalFiberInstanceHandleDEV != null) {
      // For Paper we fall back to the old strategy using the React tag.
      UIManager.findSubviewIn(
        findNodeHandle(inspectedView),
        [locationX, locationY],
        (nativeViewTag, left, top, width, height) => {
          const inspectorData = getInspectorDataForInstance(
            getClosestInstanceFromNode(nativeViewTag),
          );
          callback({
            ...inspectorData,
            pointerY: locationY,
            frame: {left, top, width, height},
            touchedViewTag: nativeViewTag,
          });
        },
      );
    } else {
      console.error(
        'getInspectorDataForViewAtPoint expects to receive a host component',
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

  getInspectorDataForViewAtPoint = (
    findNodeHandle: (componentOrHandle: any) => ?number,
    inspectedView: Object,
    locationX: number,
    locationY: number,
    callback: (viewData: TouchedViewDataAtPoint) => mixed,
  ): void => {
    invariant(
      false,
      'getInspectorDataForViewAtPoint() is not available in production.',
    );
  };
}

export {getInspectorDataForViewAtPoint, getInspectorDataForViewTag};
