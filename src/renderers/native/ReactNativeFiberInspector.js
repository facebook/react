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

if (__DEV__) {
  var traverseOwnerTreeUp = function(hierarchy, instance) {
    if (instance) {
      hierarchy.unshift(instance);
      traverseOwnerTreeUp(hierarchy, instance._debugOwner);
    }
  };

  var getOwnerHierarchy = function(instance) {
    var hierarchy = [];
    traverseOwnerTreeUp(hierarchy, instance);
    return hierarchy;
  };

  var lastNotNativeInstance = function(hierarchy) {
    for (let i = hierarchy.length - 1; i > 1; i--) {
      const instance = hierarchy[i];
      if (!instance.viewConfig) {
        return instance;
      }
    }
    return hierarchy[0];
  };

  var getHostNode = function(instance, findNodeHandle) {
    let hostNode = null;
    let fiber = instance;
    // Stateless components make this complicated.
    // Look for children first.
    while (fiber) {
      hostNode = findNodeHandle(fiber.stateNode);
      if (hostNode) {
        break;
      }
      fiber = fiber.child;
    }
    // Look for parents second.
    fiber = instance.return;
    while (fiber) {
      hostNode = findNodeHandle(fiber.stateNode);
      if (hostNode) {
        break;
      }
      fiber = fiber.return;
    }
    return hostNode;
  };

  var createHierarchy = function(fiberHierarchy) {
    return fiberHierarchy.map((fiber) => ({
      name: getComponentName(fiber),
      getInspectorData: findNodeHandle => ({
        hostNode: getHostNode(fiber, findNodeHandle),
        props: fiber.stateNode ? getFiberCurrentPropsFromNode(fiber.stateNode) : {},
        source: fiber._debugSource,
      }),
    }));
  };

  const {
    getClosestInstanceFromNode,
    getFiberCurrentPropsFromNode,
  } = ReactNativeComponentTree;

  const {
    findCurrentFiberUsingSlowPath,
  } = ReactFiberTreeReflection;

  var getInspectorDataForViewTag = function(viewTag: any): Object {
    const fiber = findCurrentFiberUsingSlowPath(getClosestInstanceFromNode(viewTag));
    const fiberHierarchy = getOwnerHierarchy(fiber);
    const instance = lastNotNativeInstance(fiberHierarchy);
    const hierarchy = createHierarchy(fiberHierarchy);
    const props = getFiberCurrentPropsFromNode(instance.stateNode) || {};
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
