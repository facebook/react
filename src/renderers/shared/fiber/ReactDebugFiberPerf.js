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
  HostRoot,
  HostComponent,
  HostText,
  HostPortal,
  YieldComponent,
  Fragment,
} = require('ReactTypeOfWork');
const getComponentName = require('getComponentName');

const supportsUserTiming =
  typeof performance !== 'undefined' &&
  typeof performance.mark === 'function' &&
  typeof performance.clearMarks === 'function' &&
  typeof performance.measure === 'function' &&
  typeof performance.clearMeasures === 'function';

// Keep track of fibers that bailed out because we clear their marks and
// don't measure them. This prevents giant flamecharts where little changed.
let bailedFibers = new Set();
// When we exit a deferred loop, we might not have finished the work. However
// the next unit of work pointer is still in the middle of the tree. We keep
// track of the parent path when exiting the loop so that we can unwind the
// flamechart measurements, and later rewind them when we resume work.
let stashedFibers = [];
// Keep track of current fiber so that we know the path to unwind on pause.
let currentFiber = null;
// If we're in the middle of user code, which fiber and method is it?
// Reusing `currentFiber` would be confusing for this because user code fiber
// can change during commit phase too, but we don't need to unwind it (since
// lifecycles in the commit phase don't resemble a tree).
let userCodePhase = null;
let userCodeFiber = null;

function performanceMeasureSafe(label, markName) {
  try {
    performance.measure(label, markName);
  } catch (err) {
    // If previous mark was missing for some reason, this will throw.
    // This could only happen if React crashed in an unexpected place earlier.
    // Don't pile on with more errors.
  }
  // Clear marks immediately to avoid growing buffer.
  performance.clearMarks(markName);
  performance.clearMeasures(label);
}

function getMarkName(fiber, phase) {
  return `react:${fiber._debugID}:${phase}`;
}

function beginMeasurement(fiber, phase) {
  const markName = getMarkName(fiber, phase);
  performance.mark(markName);
}

function clearPendingMeasurement(fiber, phase) {
  const markName = getMarkName(fiber, phase);
  performance.clearMarks(markName);
}

function completeMeasurement(fiber, phase) {
  const markName = getMarkName(fiber, phase);
  const componentName = getComponentName(fiber) || 'Unknown';
  const label = phase === 'total' ?
    `<${componentName}>` :
    `${componentName}.${phase}`;
  performanceMeasureSafe(markName, label);
}

function shouldIgnore(fiber) {
  // Host components should be skipped in the timeline.
  // We could check typeof fiber.type, but does this work with RN?
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

function clearPendingUserCodeMeasurement() {
  if (userCodePhase !== null && userCodeFiber !== null) {
    clearPendingMeasurement(userCodeFiber, userCodePhase);
  }
  userCodeFiber = null;
  userCodePhase = null;
}

function unwindStack() {
  // Stops all currently active measurements so that they can be resumed
  // if we continue in a later deferred loop from the same unit of work.
  while (currentFiber) {
    if (!shouldIgnore(currentFiber) && !bailedFibers.has(currentFiber)) {
      completeMeasurement(currentFiber, 'total');
      stashedFibers.unshift(currentFiber);
    }
    currentFiber = currentFiber.return;
  }
}

function rewindStack() {
  // Resumes all measurements that were active during the last deferred loop.
  while (stashedFibers.length) {
    const parent = stashedFibers.shift();
    beginMeasurement(parent, 'total');
  }
}

function resetStack() {
  // If we started new work, this state is no longer valid.
  stashedFibers.length = 0;
  bailedFibers.clear();
}

exports.markBeforeWork = function markBeforeWork(fiber) {
  if (!supportsUserTiming) {
    return;
  }
  clearPendingUserCodeMeasurement();
  // If we pause, this is the fiber to unwind from.
  currentFiber = fiber;
  if (shouldIgnore(fiber)) {
    return;
  }
  beginMeasurement(fiber, 'total');
};

exports.markCurrentWorkAsBailed = function markCurrentWorkAsBailed(fiber) {
  if (!supportsUserTiming) {
    return;
  }
  if (shouldIgnore(fiber)) {
    return;
  }
  // Remember we shouldn't complete measurement for this fiber.
  // Otherwise flamechart will be deep even for small updates.
  bailedFibers.add(fiber);
  clearPendingMeasurement(fiber, 'total');
};

exports.markAfterWork = function markAfterWork(fiber) {
  if (!supportsUserTiming) {
    return;
  }
  clearPendingUserCodeMeasurement();
  // If we pause, its parent is the fiber to unwind from.
  currentFiber = fiber.return;
  if (shouldIgnore(fiber)) {
    return;
  }
  if (bailedFibers.has(fiber)) {
    bailedFibers.delete(fiber);
    return;
  }
  completeMeasurement(fiber, 'total');
};

exports.markBeforeUserCode = function markBeforeUserCode(fiber, phase) {
  if (!supportsUserTiming) {
    return;
  }
  clearPendingUserCodeMeasurement();
  userCodeFiber = fiber;
  userCodePhase = phase;
  beginMeasurement(fiber, phase);
};

exports.markAfterUserCode = function markAfterUserCode() {
  if (!supportsUserTiming) {
    return;
  }
  completeMeasurement(userCodeFiber, userCodePhase);
  userCodePhase = null;
  userCodeFiber = null;
};

exports.markBeforeWorkLoop = function markBeforeWorkLoop() {
  if (!supportsUserTiming) {
    return;
  }
  // This is top level call.
  // Any other measurements are performed within.
  performance.mark('react:reconcile');
  // Resume any measurements that were in progress during the last loop.
  rewindStack();
};

exports.markAfterWorkLoop = function markAfterWorkLoop() {
  if (!supportsUserTiming) {
    return;
  }
  // Pause any measurements until the next loop.
  unwindStack();
  performance.measure('React: Reconcile Tree', 'react:reconcile');
};

exports.markBeforeCommit = function markBeforeCommit() {
  if (!supportsUserTiming) {
    return;
  }
  performance.mark('react:commit');
};

exports.markAfterCommit = function markAfterCommit() {
  if (!supportsUserTiming) {
    return;
  }
  performance.measure('React: Commit Tree', 'react:commit');
};

exports.markWorkLoopAsRestarted = function markWorkLoopAsRestarted() {
  if (!supportsUserTiming) {
    return;
  }
  resetStack();
};
