/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule findNodeHandle
 * @flow
 */

'use strict';

var ReactCurrentOwner = require('ReactCurrentOwner');
var ReactInstanceMap = require('ReactInstanceMap');
var ReactNativeTagHandles = require('ReactNativeTagHandles');

var invariant = require('invariant');
var warning = require('warning');

/**
 * ReactNative vs ReactWeb
 * -----------------------
 * React treats some pieces of data opaquely. This means that the information
 * is first class (it can be passed around), but cannot be inspected. This
 * allows us to build infrastructure that reasons about resources, without
 * making assumptions about the nature of those resources, and this allows that
 * infra to be shared across multiple platforms, where the resources are very
 * different. General infra (such as `ReactMultiChild`) reasons opaquely about
 * the data, but platform specific code (such as `ReactNativeBaseComponent`) can
 * make assumptions about the data.
 *
 *
 * `rootNodeID`, uniquely identifies a position in the generated native view
 * tree. Many layers of composite components (created with `React.createClass`)
 * can all share the same `rootNodeID`.
 *
 * `nodeHandle`: A sufficiently unambiguous way to refer to a lower level
 * resource (dom node, native view etc). The `rootNodeID` is sufficient for web
 * `nodeHandle`s, because the position in a tree is always enough to uniquely
 * identify a DOM node (we never have nodes in some bank outside of the
 * document). The same would be true for `ReactNative`, but we must maintain a
 * mapping that we can send efficiently serializable
 * strings across native boundaries.
 *
 * Opaque name      TodaysWebReact   FutureWebWorkerReact   ReactNative
 * ----------------------------------------------------------------------------
 * nodeHandle       N/A              rootNodeID             tag
 */

function findNodeHandle(componentOrHandle: any): ?number {
  if (__DEV__) {
    var owner = ReactCurrentOwner.current;
    if (owner !== null) {
      warning(
        owner._warnedAboutRefsInRender,
        '%s is accessing findNodeHandle inside its render(). ' +
        'render() should be a pure function of props and state. It should ' +
        'never access something that requires stale data from the previous ' +
        'render, such as refs. Move this logic to componentDidMount and ' +
        'componentDidUpdate instead.',
        owner.getName() || 'A component'
      );
      owner._warnedAboutRefsInRender = true;
    }
  }
  if (componentOrHandle == null) {
    return null;
  }
  if (typeof componentOrHandle === 'number') {
    // Already a node handle
    return componentOrHandle;
  }

  var component = componentOrHandle;

  // TODO (balpert): Wrap iOS native components in a composite wrapper, then
  // ReactInstanceMap.get here will always succeed for mounted components
  var internalInstance = ReactInstanceMap.get(component);
  if (internalInstance) {
    return ReactNativeTagHandles.rootNodeIDToTag[internalInstance._rootNodeID];
  } else {
    var rootNodeID = component._rootNodeID;
    if (rootNodeID) {
      return ReactNativeTagHandles.rootNodeIDToTag[rootNodeID];
    } else {
      invariant(
        (
          // Native
          typeof component === 'object' &&
          '_rootNodeID' in component
        ) || (
          // Composite
          component.render != null &&
          typeof component.render === 'function'
        ),
        'findNodeHandle(...): Argument is not a component ' +
        '(type: %s, keys: %s)',
        typeof component,
        Object.keys(component)
      );
      invariant(
        false,
        'findNodeHandle(...): Unable to find node handle for unmounted ' +
        'component.'
      );
    }
  }
}

module.exports = findNodeHandle;
