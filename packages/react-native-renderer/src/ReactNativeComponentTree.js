/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactNativeComponentTree
 */

'use strict';

var invariant = require('fbjs/lib/invariant');

var instanceCache = {};
var instanceProps = {};

function precacheFiberNode(hostInst, tag) {
  instanceCache[tag] = hostInst;
}

function uncacheFiberNode(tag) {
  delete instanceCache[tag];
  delete instanceProps[tag];
}

function getInstanceFromTag(tag) {
  return instanceCache[tag] || null;
}

function getTagFromInstance(inst) {
  var tag = inst.stateNode._nativeTag;
  invariant(tag, 'All native instances should have a tag.');
  return tag;
}

function getFiberCurrentPropsFromNode(stateNode) {
  return instanceProps[stateNode._nativeTag] || null;
}

function updateFiberProps(tag, props) {
  instanceProps[tag] = props;
}

var ReactNativeComponentTree = {
  getClosestInstanceFromNode: getInstanceFromTag,
  getInstanceFromNode: getInstanceFromTag,
  getNodeFromInstance: getTagFromInstance,
  precacheFiberNode,
  uncacheFiberNode,
  getFiberCurrentPropsFromNode,
  updateFiberProps,
};

module.exports = ReactNativeComponentTree;
