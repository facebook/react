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

  const {
    getClosestInstanceFromNode,
    getFiberCurrentPropsFromNode,
  } = ReactNativeComponentTree;

  const {
    findCurrentFiberUsingSlowPath,
  } = ReactFiberTreeReflection;

  var getInspectorDataForViewTag = function(viewTag: any): Object {
    const fiber = findCurrentFiberUsingSlowPath(getClosestInstanceFromNode(viewTag));
    const hierarchy = getOwnerHierarchy(fiber);
    const instance = lastNotNativeInstance(hierarchy);
    const props = getFiberCurrentPropsFromNode(instance.stateNode) || {};
    const source = instance._debugSource;

    return {
      hierarchy,
      instance,
      props,
      source,
    };
  };
}

module.exports = {
  getInspectorDataForViewTag,
};
