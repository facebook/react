/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactFiber';

import {
  findCurrentHostFiber,
  findCurrentFiberUsingSlowPath,
} from 'shared/ReactFiberTreeReflection';
import getComponentName from 'shared/getComponentName';
import {HostComponent} from 'shared/ReactTypeOfWork';
import emptyObject from 'fbjs/lib/emptyObject';
import invariant from 'fbjs/lib/invariant';
// Module provided by RN:
import UIManager from 'UIManager';

import {getClosestInstanceFromNode} from './ReactNativeComponentTree';

let getInspectorDataForViewTag;

if (__DEV__) {
  var traverseOwnerTreeUp = function(hierarchy, instance: any) {
    if (instance) {
      hierarchy.unshift(instance);
      traverseOwnerTreeUp(hierarchy, instance._debugOwner);
    }
  };

  var getOwnerHierarchy = function(instance: any) {
    var hierarchy = [];
    traverseOwnerTreeUp(hierarchy, instance);
    return hierarchy;
  };

  var lastNonHostInstance = function(hierarchy) {
    for (let i = hierarchy.length - 1; i > 1; i--) {
      const instance = hierarchy[i];

      if (instance.tag !== HostComponent) {
        return instance;
      }
    }
    return hierarchy[0];
  };

  var getHostProps = function(fiber) {
    const host = findCurrentHostFiber(fiber);
    if (host) {
      return host.memoizedProps || emptyObject;
    }
    return emptyObject;
  };

  var getHostNode = function(fiber: Fiber | null, findNodeHandle) {
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

  var createHierarchy = function(fiberHierarchy) {
    return fiberHierarchy.map(fiber => ({
      name: getComponentName(fiber),
      getInspectorData: findNodeHandle => ({
        measure: callback =>
          UIManager.measure(getHostNode(fiber, findNodeHandle), callback),
        props: getHostProps(fiber),
        source: fiber._debugSource,
      }),
    }));
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
} else {
  getInspectorDataForViewTag = () => {
    invariant(
      false,
      'getInspectorDataForViewTag() is not available in production',
    );
  };
}

export {getInspectorDataForViewTag};
