/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
import getComponentNameFromType from 'shared/getComponentNameFromType';
import {HostComponent} from 'react-reconciler/src/ReactWorkTags';
// Module provided by RN:
import {UIManager} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';
import {enableGetInspectorDataForInstanceInProduction} from 'shared/ReactFeatureFlags';
import {getClosestInstanceFromNode} from './ReactNativeComponentTree';
import {getInternalInstanceHandleFromPublicInstance} from './ReactFabricPublicInstanceUtils';
import {getNodeFromInternalInstanceHandle} from './ReactNativePublicCompat';

const emptyObject = {};
if (__DEV__) {
  Object.freeze(emptyObject);
}

let createHierarchy;
let getHostNode;
let getHostProps;
let lastNonHostInstance;
let getInspectorDataForInstance: (
  closestInstance: Fiber | null,
) => InspectorData;
let getOwnerHierarchy;
let traverseOwnerTreeUp: (hierarchy: Array<$FlowFixMe>, instance: any) => void;

if (__DEV__ || enableGetInspectorDataForInstanceInProduction) {
  // $FlowFixMe[missing-local-annot]
  createHierarchy = function (fiberHierarchy) {
    return fiberHierarchy.map(fiber => ({
      name: getComponentNameFromType(fiber.type),
      getInspectorData: findNodeHandle => {
        return {
          props: getHostProps(fiber),
          source: fiber._debugSource,
          measure: callback => {
            // If this is Fabric, we'll find a shadow node and use that to measure.
            const hostFiber = findCurrentHostFiber(fiber);
            const node =
              hostFiber != null &&
              hostFiber.stateNode !== null &&
              hostFiber.stateNode.node;

            if (node) {
              nativeFabricUIManager.measure(node, callback);
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

  // $FlowFixMe[missing-local-annot]
  getHostNode = function (fiber: Fiber | null, findNodeHandle) {
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

  // $FlowFixMe[missing-local-annot]
  getHostProps = function (fiber) {
    const host = findCurrentHostFiber(fiber);
    if (host) {
      return host.memoizedProps || emptyObject;
    }
    return emptyObject;
  };

  getInspectorDataForInstance = function (
    closestInstance: Fiber | null,
  ): InspectorData {
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
      closestInstance: instance,
      hierarchy,
      props,
      selectedIndex,
      source,
    };
  };

  getOwnerHierarchy = function (instance: any) {
    const hierarchy: Array<$FlowFixMe> = [];
    traverseOwnerTreeUp(hierarchy, instance);
    return hierarchy;
  };

  // $FlowFixMe[missing-local-annot]
  lastNonHostInstance = function (hierarchy) {
    for (let i = hierarchy.length - 1; i > 1; i--) {
      const instance = hierarchy[i];

      if (instance.tag !== HostComponent) {
        return instance;
      }
    }
    return hierarchy[0];
  };

  // $FlowFixMe[missing-local-annot]
  traverseOwnerTreeUp = function (hierarchy, instance: any): void {
    if (instance) {
      hierarchy.unshift(instance);
      traverseOwnerTreeUp(hierarchy, instance._debugOwner);
    }
  };
}

let getInspectorDataForViewTag: (viewTag: number) => Object;
let getInspectorDataForViewAtPoint: (
  findNodeHandle: (componentOrHandle: any) => ?number,
  inspectedView: Object,
  locationX: number,
  locationY: number,
  callback: (viewData: TouchedViewDataAtPoint) => mixed,
) => void;

if (__DEV__) {
  getInspectorDataForViewTag = function (viewTag: number): Object {
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

  getInspectorDataForViewAtPoint = function (
    findNodeHandle: (componentOrHandle: any) => ?number,
    inspectedView: Object,
    locationX: number,
    locationY: number,
    callback: (viewData: TouchedViewDataAtPoint) => mixed,
  ): void {
    let closestInstance = null;

    const fabricInstanceHandle =
      getInternalInstanceHandleFromPublicInstance(inspectedView);
    const fabricNode =
      fabricInstanceHandle != null
        ? getNodeFromInternalInstanceHandle(fabricInstanceHandle)
        : null;
    if (fabricNode) {
      // For Fabric we can look up the instance handle directly and measure it.
      nativeFabricUIManager.findNodeAtPoint(
        fabricNode,
        locationX,
        locationY,
        internalInstanceHandle => {
          const node =
            internalInstanceHandle != null
              ? getNodeFromInternalInstanceHandle(internalInstanceHandle)
              : null;
          if (internalInstanceHandle == null || node == null) {
            callback({
              pointerY: locationY,
              frame: {left: 0, top: 0, width: 0, height: 0},
              ...getInspectorDataForInstance(closestInstance),
            });
            return;
          }

          closestInstance =
            internalInstanceHandle.stateNode.internalInstanceHandle;

          // Note: this is deprecated and we want to remove it ASAP. Keeping it here for React DevTools compatibility for now.
          const nativeViewTag = internalInstanceHandle.stateNode.nativeTag;

          nativeFabricUIManager.measure(
            node,
            (x, y, width, height, pageX, pageY) => {
              const inspectorData =
                getInspectorDataForInstance(closestInstance);
              callback({
                ...inspectorData,
                pointerY: locationY,
                frame: {left: pageX, top: pageY, width, height},
                touchedViewTag: nativeViewTag,
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
    throw new Error(
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
    throw new Error(
      'getInspectorDataForViewAtPoint() is not available in production.',
    );
  };
}

export {
  getInspectorDataForInstance,
  getInspectorDataForViewAtPoint,
  getInspectorDataForViewTag,
};
