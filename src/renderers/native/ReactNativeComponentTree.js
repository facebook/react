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

var invariant = require('invariant');

var instanceCache = {};
var instanceProps = {};

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

function precacheFiberNode(hostInst, tag) {
  instanceCache[tag] = hostInst;
}

function uncacheNode(inst) {
  var tag = inst._rootNodeID;
  if (tag) {
    delete instanceCache[tag];
  }
}

function uncacheFiberNode(tag) {
  delete instanceCache[tag];
}

function getInstanceFromTag(tag) {
  return instanceCache[tag] || null;
}

function getTagFromInstance(inst) {
  // TODO (bvaughn) Clean up once Stack is deprecated
  var tag = inst._rootNodeID || inst.stateNode._nativeTag;
  invariant(tag, 'All native instances should have a tag.');
  return tag;
}

function getFiberEventHandlersFromTag(tag) {
  return instanceProps[tag] || null;
}

function updateFiberEventHandlers(tag, props) {
  instanceProps[tag] = props;
}

var ReactNativeComponentTree = {
  getClosestInstanceFromNode: getInstanceFromTag,
  getInstanceFromNode: getInstanceFromTag,
  getNodeFromInstance: getTagFromInstance,
  precacheFiberNode,
  precacheNode,
  uncacheFiberNode,
  uncacheNode,
  getFiberEventHandlersFromNode: getFiberEventHandlersFromTag,
  updateFiberEventHandlers,
};

module.exports = ReactNativeComponentTree;
