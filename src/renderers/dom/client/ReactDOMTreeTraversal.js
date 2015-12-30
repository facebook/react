/**
 * Copyright 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMTreeTraversal
 */

'use strict';

var invariant = require('invariant');

/**
 * Return the lowest common ancestor of A and B, or null if they are in
 * different trees.
 */
function getLowestCommonAncestor(instA, instB) {
  invariant('_nativeNode' in instA, 'getNodeFromInstance: Invalid argument.');
  invariant('_nativeNode' in instB, 'getNodeFromInstance: Invalid argument.');

  var depthA = 0;
  for (var tempA = instA; tempA; tempA = tempA._nativeParent) {
    depthA++;
  }
  var depthB = 0;
  for (var tempB = instB; tempB; tempB = tempB._nativeParent) {
    depthB++;
  }

  // If A is deeper, crawl up.
  while (depthA - depthB > 0) {
    instA = instA._nativeParent;
    depthA--;
  }

  // If B is deeper, crawl up.
  while (depthB - depthA > 0) {
    instB = instB._nativeParent;
    depthB--;
  }

  // Walk in lockstep until we find a match.
  var depth = depthA;
  while (depth--) {
    if (instA === instB) {
      return instA;
    }
    instA = instA._nativeParent;
    instB = instB._nativeParent;
  }
  return null;
}

/**
 * Return if A is an ancestor of B.
 */
function isAncestor(instA, instB) {
  invariant('_nativeNode' in instA, 'isAncestor: Invalid argument.');
  invariant('_nativeNode' in instB, 'isAncestor: Invalid argument.');

  while (instB) {
    if (instB === instA) {
      return true;
    }
    instB = instB._nativeParent;
  }
  return false;
}

/**
 * Return the parent instance of the passed-in instance.
 */
function getParentInstance(inst) {
  invariant('_nativeNode' in inst, 'getParentInstance: Invalid argument.');

  return inst._nativeParent;
}

/**
 * Simulates the traversal of a two-phase, capture/bubble event dispatch.
 */
function traverseTwoPhase(inst, fn, arg) {
  var path = [];
  while (inst) {
    path.push(inst);
    inst = inst._nativeParent;
  }
  var i;
  for (i = path.length; i-- > 0;) {
    fn(path[i], false, arg);
  }
  for (i = 0; i < path.length; i++) {
    fn(path[i], true, arg);
  }
}

/**
 * Traverses the ID hierarchy and invokes the supplied `cb` on any IDs that
 * should would receive a `mouseEnter` or `mouseLeave` event.
 *
 * Does not invoke the callback on the nearest common ancestor because nothing
 * "entered" or "left" that element.
 */
function traverseEnterLeave(from, to, fn, argFrom, argTo) {
  var common = from && to ? getLowestCommonAncestor(from, to) : null;
  var pathFrom = [];
  while (from && from !== common) {
    pathFrom.push(from);
    from = from._nativeParent;
  }
  var pathTo = [];
  while (to && to !== common) {
    pathTo.push(to);
    to = to._nativeParent;
  }
  var i;
  for (i = 0; i < pathFrom.length; i++) {
    fn(pathFrom[i], true, argFrom);
  }
  for (i = pathTo.length; i-- > 0;) {
    fn(pathTo[i], false, argTo);
  }
}

module.exports = {
  isAncestor: isAncestor,
  getLowestCommonAncestor: getLowestCommonAncestor,
  getParentInstance: getParentInstance,
  traverseTwoPhase: traverseTwoPhase,
  traverseEnterLeave: traverseEnterLeave,
};
