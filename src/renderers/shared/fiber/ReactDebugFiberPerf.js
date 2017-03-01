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
  return `react:${flushIndex}:${fiber._debugID}`;
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
let lastCompletedFiber = null;
let pausedFibers = [];
let flushIndex = 0;

function markBeginWork(fiber) {
  lastCompletedFiber = null;
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
  lastCompletedFiber = fiber;
  if (shouldIgnore(fiber)) {
    return false;
  }
  if (bailedFibers.has(fiber)) {
    bailedFibers.delete(fiber);
  } else {
    performance.measure(getComponentName(fiber), getMarkName(fiber));
  }
  return true;
}

function markWillCommit() {
  performance.mark('react:commit');
}

function markDidCommit() {
  performance.measure('(React) Commit Tree', 'react:commit');
}

function markWillReconcile() {
  flushIndex++;
  performance.mark('react:reconcile');
  resumeStack();
}

function markDidReconcile() {
  rewindStack();
  performance.measure('(React) Reconcile Tree', 'react:reconcile');
}

function markReset() {
  resetStack();
}

function rewindStack() {
  while (lastCompletedFiber) {
    const parent = lastCompletedFiber.return;
    if (parent) {
      if (markCompleteWork(parent)) {
        pausedFibers.unshift(parent);
      }
    }
    lastCompletedFiber = parent;
  }
}

function resumeStack() {
  while (pausedFibers.length) {
    const parent = pausedFibers.shift();
    markBeginWork(parent);
  }
}

function resetStack() {
  pausedFibers.length = 0;
  bailedFibers.clear();
}

exports.markBeginWork = markBeginWork;
exports.markBailWork = markBailWork;
exports.markCompleteWork = markCompleteWork;
exports.markWillCommit = markWillCommit;
exports.markDidCommit = markDidCommit;
exports.markWillReconcile = markWillReconcile;
exports.markDidReconcile = markDidReconcile;
exports.markReset = markReset;