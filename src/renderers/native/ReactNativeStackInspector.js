/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeStackInspector
 * @flow
 */
'use strict';

const ReactNativeComponentTree = require('ReactNativeComponentTree');

if (__DEV__) {
  var traverseOwnerTreeUp = function (hierarchy, instance) {
    if (instance) {
      hierarchy.unshift(instance);
      traverseOwnerTreeUp(hierarchy, instance._currentElement._owner);
    }
  };

  var getOwnerHierarchy = function (instance) {
    var hierarchy = [];
    traverseOwnerTreeUp(hierarchy, instance);
    return hierarchy;
  };

  var lastNotNativeInstance = function (hierarchy) {
    for (let i = hierarchy.length - 1; i > 1; i--) {
      const instance = hierarchy[i];
      if (!instance.viewConfig) {
        return instance;
      }
    }
    return hierarchy[0];
  };

  var getInspectorDataForViewTag = function(viewTag: any): Object {
    const component = ReactNativeComponentTree.getClosestInstanceFromNode(viewTag);
    const hierarchy = getOwnerHierarchy(component);
    const instance = lastNotNativeInstance(hierarchy);
    const props = (instance._instance || {}).props || {};
    const source = instance._currentElement && instance._currentElement._source;
    
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

