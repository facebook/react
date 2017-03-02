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

function getMarkName(fiber, kind) {
  return `react:${flushIndex}:${fiber._debugID}:${kind}`;
}

function setBeginMark(fiber) {
  performance.mark(getMarkName(fiber, 'total'));
}

function clearBeginMark(fiber) {
  performance.clearMarks(getMarkName(fiber, 'total'));
}

function setCompleteMark(fiber) {
  try {
    performance.measure(`<${getComponentName(fiber) || 'Unknown'}>`, getMarkName(fiber, 'total'));
  } catch (err) {
    // Ignore.
  }
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
let currentFiber = null;
let stashedFibers = [];
let flushIndex = 0;
let lifecycleFiber = null;
let lifecyclePhase = null;

function markBeginWork(fiber) {
  clearLifecycle();
  currentFiber = fiber;
  if (shouldIgnore(fiber)) {
    return;
  }
  setBeginMark(fiber);
}

function markBailWork(fiber) {
  if (shouldIgnore(fiber)) {
    return;
  }
  bailedFibers.add(fiber);
  clearBeginMark(fiber);
}

function markCompleteWork(fiber) {
  currentFiber = fiber.return;
  if (shouldIgnore(fiber)) {
    return;
  }
  if (bailedFibers.has(fiber)) {
    bailedFibers.delete(fiber);
    return;
  }
  setCompleteMark(fiber);
}

function markWillLifecycle(fiber, phase) {
  clearLifecycle();
  lifecycleFiber = fiber;
  lifecyclePhase = phase;
  performance.mark(getMarkName(fiber, phase));
}

function markDidLifecycle() {
  try {
    performance.measure(
      `${getComponentName(lifecycleFiber) || 'Unknown'}.${lifecyclePhase}`,
      getMarkName(lifecycleFiber, lifecyclePhase)
    );
  } catch (err) {
    // Ignore errors.
  }
  lifecycleFiber = null;
  lifecyclePhase = null;
}

function clearLifecycle() {
  if (lifecycleFiber) {
    performance.clearMarks(getMarkName(lifecycleFiber, lifecyclePhase));
  }
  lifecycleFiber = null;
  lifecyclePhase = null;
}

function markWillCommit() {
  performance.mark('react:commit');
}

function markDidCommit() {
  performance.measure('React: Commit Tree', 'react:commit');
}

function markWillReconcile() {
  flushIndex++;
  performance.mark('react:reconcile');
  rewindStack();
}

function markDidReconcile() {
  unwindStack();
  performance.measure('React: Reconcile Tree', 'react:reconcile');
}

function markReset() {
  resetStack();
}

function unwindStack() {
  while (currentFiber) {
    if (!shouldIgnore(currentFiber) && !bailedFibers.has(currentFiber)) {
      setCompleteMark(currentFiber);
      stashedFibers.unshift(currentFiber);
    }
    currentFiber = currentFiber.return;
  }
}

function rewindStack() {
  while (stashedFibers.length) {
    const parent = stashedFibers.shift();
    setBeginMark(parent);
  }
}

function resetStack() {
  stashedFibers.length = 0;
  bailedFibers.clear();
}

exports.markBeginWork = markBeginWork;
exports.markBailWork = markBailWork;
exports.markCompleteWork = markCompleteWork;
exports.markWillCommit = markWillCommit;
exports.markDidCommit = markDidCommit;
exports.markWillReconcile = markWillReconcile;
exports.markDidReconcile = markDidReconcile;
exports.markWillLifecycle = markWillLifecycle;
exports.markDidLifecycle = markDidLifecycle;
exports.markReset = markReset;