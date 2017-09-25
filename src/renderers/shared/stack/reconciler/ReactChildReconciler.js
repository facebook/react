/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactChildReconciler
 */

'use strict';

var KeyEscapeUtils = require('KeyEscapeUtils');
var ReactReconciler = require('ReactReconciler');

var instantiateReactComponent = require('instantiateReactComponent');
var shouldUpdateReactComponent = require('shouldUpdateReactComponent');
var traverseStackChildren = require('traverseStackChildren');

if (__DEV__) {
  var warning = require('fbjs/lib/warning');
}

var ReactComponentTreeHook;

if (
  typeof process !== 'undefined' &&
  process.env &&
  process.env.NODE_ENV === 'test'
) {
  // Temporary hack.
  // Inline requires don't work well with Jest:
  // https://github.com/facebook/react/issues/7240
  // Remove the inline requires when we don't need them anymore:
  // https://github.com/facebook/react/pull/7178
  ReactComponentTreeHook = require('ReactGlobalSharedState')
    .ReactComponentTreeHook;
}

function instantiateChild(childInstances, child, name, selfDebugID) {
  // We found a component instance.
  var keyUnique = childInstances[name] === undefined;
  if (__DEV__) {
    if (!ReactComponentTreeHook) {
      ReactComponentTreeHook = require('ReactGlobalSharedState')
        .ReactComponentTreeHook;
    }
    if (!keyUnique) {
      warning(
        false,
        'flattenChildren(...): ' +
          'Encountered two children with the same key, `%s`. ' +
          'Keys should be unique so that components maintain their identity ' +
          'across updates. Non-unique keys may cause children to be ' +
          'duplicated and/or omitted — the behavior is unsupported and ' +
          'could change in a future version.%s',
        KeyEscapeUtils.unescapeInDev(name),
        ReactComponentTreeHook.getStackAddendumByID(selfDebugID),
      );
    }
  }
  if (child != null && keyUnique) {
    childInstances[name] = instantiateReactComponent(child, true);
  }
}

/**
 * ReactChildReconciler provides helpers for initializing or updating a set of
 * children. Its output is suitable for passing it onto ReactMultiChild which
 * does diffed reordering and insertion.
 */
var ReactChildReconciler = {
  /**
   * Generates a "mount image" for each of the supplied children. In the case
   * of `ReactDOMComponent`, a mount image is a string of markup.
   *
   * @param {?object} nestedChildNodes Nested child maps.
   * @return {?object} A set of child instances.
   * @internal
   */
  instantiateChildren: function(
    nestedChildNodes,
    transaction,
    context,
    selfDebugID, // 0 in production and for roots
  ) {
    if (nestedChildNodes == null) {
      return null;
    }
    var childInstances = {};

    if (__DEV__) {
      traverseStackChildren(
        nestedChildNodes,
        (childInsts, child, name) =>
          instantiateChild(childInsts, child, name, selfDebugID),
        childInstances,
      );
    } else {
      traverseStackChildren(nestedChildNodes, instantiateChild, childInstances);
    }
    return childInstances;
  },

  /**
   * Updates the rendered children and returns a new set of children.
   *
   * @param {?object} prevChildren Previously initialized set of children.
   * @param {?object} nextChildren Flat child element maps.
   * @param {ReactReconcileTransaction} transaction
   * @param {object} context
   * @return {?object} A new set of child instances.
   * @internal
   */
  updateChildren: function(
    prevChildren,
    nextChildren,
    mountImages,
    removedNodes,
    transaction,
    hostParent,
    hostContainerInfo,
    context,
    selfDebugID, // 0 in production and for roots
  ) {
    // We currently don't have a way to track moves here but if we use iterators
    // instead of for..in we can zip the iterators and check if an item has
    // moved.
    // TODO: If nothing has changed, return the prevChildren object so that we
    // can quickly bailout if nothing has changed.
    if (!nextChildren && !prevChildren) {
      return;
    }
    var name;
    var prevChild;
    for (name in nextChildren) {
      if (!nextChildren.hasOwnProperty(name)) {
        continue;
      }
      prevChild = prevChildren && prevChildren[name];
      var prevElement = prevChild && prevChild._currentElement;
      var nextElement = nextChildren[name];
      if (
        prevChild != null &&
        shouldUpdateReactComponent(prevElement, nextElement)
      ) {
        ReactReconciler.receiveComponent(
          prevChild,
          nextElement,
          transaction,
          context,
        );
        nextChildren[name] = prevChild;
      } else {
        // The child must be instantiated before it's mounted.
        var nextChildInstance = instantiateReactComponent(nextElement, true);
        nextChildren[name] = nextChildInstance;
        // Creating mount image now ensures refs are resolved in right order
        // (see https://github.com/facebook/react/pull/7101 for explanation).
        var nextChildMountImage = ReactReconciler.mountComponent(
          nextChildInstance,
          transaction,
          hostParent,
          hostContainerInfo,
          context,
          selfDebugID,
        );
        mountImages.push(nextChildMountImage);
        if (prevChild) {
          removedNodes[name] = ReactReconciler.getHostNode(prevChild);
          ReactReconciler.unmountComponent(
            prevChild,
            false /* safely */,
            false /* skipLifecycle */,
          );
        }
      }
    }
    // Unmount children that are no longer present.
    for (name in prevChildren) {
      if (
        prevChildren.hasOwnProperty(name) &&
        !(nextChildren && nextChildren.hasOwnProperty(name))
      ) {
        prevChild = prevChildren[name];
        removedNodes[name] = ReactReconciler.getHostNode(prevChild);
        ReactReconciler.unmountComponent(
          prevChild,
          false /* safely */,
          false /* skipLifecycle */,
        );
      }
    }
  },

  /**
   * Unmounts all rendered children. This should be used to clean up children
   * when this component is unmounted.
   *
   * @param {?object} renderedChildren Previously initialized set of children.
   * @internal
   */
  unmountChildren: function(renderedChildren, safely, skipLifecycle) {
    for (var name in renderedChildren) {
      if (renderedChildren.hasOwnProperty(name)) {
        var renderedChild = renderedChildren[name];
        ReactReconciler.unmountComponent(renderedChild, safely, skipLifecycle);
      }
    }
  },
};

module.exports = ReactChildReconciler;
