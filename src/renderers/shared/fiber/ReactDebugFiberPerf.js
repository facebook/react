/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDebugFiberPerf
 * @flow
 */

const {
  IndeterminateComponent,
  FunctionalComponent,
  ClassComponent,
  HostRoot,
  HostComponent,
  HostText,
  HostPortal,
  CoroutineComponent,
  CoroutineHandlerPhase,
  YieldComponent,
  Fragment,
} = require('ReactTypeOfWork');

const getComponentName = require('getComponentName');

// TODO
let isProfiling = true;

// TODO: individual render methods

function getMarkName(fiber) {
  return `react:${fiber._debugID}`;
}

function shouldIgnore(fiber) {
  switch (fiber.tag) {
    case HostRoot:
    case HostComponent:
    case HostText:
    case HostPortal:
    case YieldComponent:
    case Fragment:
      return true;
    default:
      return false;
  }
}

let bailedFibers = new Set();

function markBeginWork(fiber) {
  if (shouldIgnore(fiber)) {
    return;
  }
  performance.mark(getMarkName(fiber));
}

function markBailWork(fiber) {
  if (shouldIgnore(fiber)) {
    return;
  }
  bailedFibers.add(fiber);
  performance.clearMarks(getMarkName(fiber));
}

function markCompleteWork(fiber) {
  if (shouldIgnore(fiber)) {
    return;
  }
  if (bailedFibers.has(fiber)) {
    bailedFibers.delete(fiber);
  } else {
    performance.measure(getComponentName(fiber), getMarkName(fiber));
  }
}

function markWillCommit() {
  performance.mark('react:commit');
}

function markDidCommit() {
  performance.measure('Commit React Tree', 'react:commit');
}

function markWillReconcile() {
  performance.mark('react:reconcile');
}

function markDidReconcile() {
  performance.measure('Reconcile React Tree', 'react:reconcile');
}

exports.markBeginWork = markBeginWork;
exports.markBailWork = markBailWork;
exports.markCompleteWork = markCompleteWork;
exports.markWillCommit = markWillCommit;
exports.markDidCommit = markDidCommit;
exports.markWillReconcile = markWillReconcile;
exports.markDidReconcile = markDidReconcile;
