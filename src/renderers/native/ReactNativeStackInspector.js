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
const invariant = require('fbjs/lib/invariant');

let getInspectorDataForViewTag;

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

  var getHostProps = function(component) {
    const instance = component._instance;
    if (instance) {
      return instance.props || emptyObject;
    }
    return emptyObject;
  };

  var createHierarchy = function(componentHierarchy) {
    return componentHierarchy.map(component => ({
      name: getComponentName(component),
      getInspectorData: () => ({
        measure: callback =>
          UIManager.measure(component.getHostNode(), callback),
        props: getHostProps(component),
        source: component._currentElement && component._currentElement._source,
      }),
    }));
  };

  getInspectorDataForViewTag = function(viewTag: any): Object {
    const component = ReactNativeComponentTree.getClosestInstanceFromNode(
      viewTag,
    );

    // Handle case where user clicks outside of ReactNative
    if (!component) {
      return {
        hierarchy: [],
        props: emptyObject,
        selection: null,
        source: null,
      };
    }

    const componentHierarchy = getOwnerHierarchy(component);
    const instance = lastNotNativeInstance(componentHierarchy);
    const hierarchy = createHierarchy(componentHierarchy);
    const props = getHostProps(instance);
    const source = instance._currentElement && instance._currentElement._source;
    const selection = componentHierarchy.indexOf(instance);

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

module.exports = {
  getInspectorDataForViewTag,
};
