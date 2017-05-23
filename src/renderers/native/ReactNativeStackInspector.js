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
const getComponentName = require('getComponentName');
const emptyObject = require('fbjs/lib/emptyObject');
const UIManager = require('UIManager');

if (__DEV__) {
  var traverseOwnerTreeUp = function(hierarchy, instance) {
    if (instance) {
      hierarchy.unshift(instance);
      traverseOwnerTreeUp(hierarchy, instance._currentElement._owner);
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

  var createHierarchy = function(componentHierarchy) {
    return componentHierarchy.map(component => ({
      name: getComponentName(component),
      getInspectorData: () => ({
        measure: callback =>
          UIManager.measure(component.getHostNode(), callback),
        props: (component._instance || emptyObject).props || emptyObject,
        source: component._currentElement && component._currentElement._source,
      }),
    }));
  };

  var getInspectorDataForViewTag = function(viewTag: any): Object {
    const component = ReactNativeComponentTree.getClosestInstanceFromNode(
      viewTag,
    );
    const componentHierarchy = getOwnerHierarchy(component);
    const instance = lastNotNativeInstance(componentHierarchy);
    const hierarchy = createHierarchy(componentHierarchy);
    const props = (instance._instance || emptyObject).props || emptyObject;
    const source = instance._currentElement && instance._currentElement._source;
    const selection = componentHierarchy.indexOf(instance);

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
