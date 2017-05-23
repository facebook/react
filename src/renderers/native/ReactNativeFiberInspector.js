/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeFiberInspector
 * @flow
 */
'use strict';

const ReactNativeComponentTree = require('ReactNativeComponentTree');
const ReactFiberTreeReflection = require('ReactFiberTreeReflection');
const getComponentName = require('getComponentName');
const emptyObject = require('fbjs/lib/emptyObject');

import type {Fiber} from 'ReactFiber';

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

  var lastNotNativeInstance = function(hierarchy) {
    for (let i = hierarchy.length - 1; i > 1; i--) {
      const instance = hierarchy[i];
      const stateNode = instance.stateNode;

      if (!stateNode.viewConfig) {
        return instance;
      }
    }
    return hierarchy[0];
  };

  var getHostProps = function(fiber) {
    return ReactFiberTreeReflection.findCurrentHostFiber(fiber).memoizedProps;
  };

  var getHostNode = function(fiber: Fiber, findNodeHandle) {
    let hostNode;
    // look for children first for the hostNode
    // as composite fibers do not have a hostNode
    while (fiber) {
      if (fiber.stateNode !== null) {
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
        hostNode: getHostNode(fiber, findNodeHandle),
        props: fiber.stateNode ? getHostProps(fiber) : emptyObject,
        source: fiber._debugSource,
      }),
    }));
  };

  const {getClosestInstanceFromNode} = ReactNativeComponentTree;

  const {findCurrentFiberUsingSlowPath} = ReactFiberTreeReflection;

  var getInspectorDataForViewTag = function(viewTag: number): Object {
    const fiber = findCurrentFiberUsingSlowPath(
      getClosestInstanceFromNode(viewTag),
    );
    const fiberHierarchy = getOwnerHierarchy(fiber);
    const instance = lastNotNativeInstance(fiberHierarchy);
    const hierarchy = createHierarchy(fiberHierarchy);
    const props = getHostProps(instance) || emptyObject;
    const source = instance._debugSource;
    const selection = fiberHierarchy.indexOf(instance);

    return {
      hierarchy,
      instance,
      props,
      selection,
      source,
    };
  };
}

module.exports = {
  getInspectorDataForViewTag,
};
