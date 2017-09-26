/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactNativeComponentTree
 */

'use strict';

var invariant = require('invariant');

var instanceCache = {};

/**
 * Drill down (through composites and empty components) until we get a host or
 * host text component.
 *
 * This is pretty polymorphic but unavoidable with the current structure we have
 * for `_renderedChildren`.
 */
function getRenderedHostOrTextFromComponent(component) {
  var rendered;
  while ((rendered = component._renderedComponent)) {
    component = rendered;
  }
  return component;
}

/**
 * Populate `_hostNode` on the rendered host/text component with the given
 * DOM node. The passed `inst` can be a composite.
 */
function precacheNode(inst, tag) {
  var nativeInst = getRenderedHostOrTextFromComponent(inst);
  instanceCache[tag] = nativeInst;
}

function uncacheNode(inst) {
  var tag = inst._rootNodeID;
  if (tag) {
    delete instanceCache[tag];
  }
}

function getInstanceFromTag(tag) {
  return instanceCache[tag] || null;
}

function getTagFromInstance(inst) {
  invariant(inst._rootNodeID, 'All native instances should have a tag.');
  return inst._rootNodeID;
}

var ReactNativeComponentTree = {
  getClosestInstanceFromNode: getInstanceFromTag,
  getInstanceFromNode: getInstanceFromTag,
  getNodeFromInstance: getTagFromInstance,
  precacheNode: precacheNode,
  uncacheNode: uncacheNode,
};

module.exports = ReactNativeComponentTree;
