/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeComponentTree
 */

'use strict';

var _prodInvariant = require('./reactProdInvariant');

var invariant = require('fbjs/lib/invariant');

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
  while (rendered = component._renderedComponent) {
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
  !inst._rootNodeID ? process.env.NODE_ENV !== 'production' ? invariant(false, 'All native instances should have a tag.') : _prodInvariant('17') : void 0;
  return inst._rootNodeID;
}

var ReactNativeComponentTree = {
  getClosestInstanceFromNode: getInstanceFromTag,
  getInstanceFromNode: getInstanceFromTag,
  getNodeFromInstance: getTagFromInstance,
  precacheNode: precacheNode,
  uncacheNode: uncacheNode
};

module.exports = ReactNativeComponentTree;