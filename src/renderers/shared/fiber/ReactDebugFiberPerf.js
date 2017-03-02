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

// Prefix measurements so that it's possible to filter them.
// Longer prefixes are hard to read in DevTools.
const reactEmoji = '\u269B';
const reconcileLabel = `${reactEmoji} (React Tree Reconciliation)`;
const commitLabel = `${reactEmoji} (Committing Changes)`;
const supportsUserTiming =
  typeof performance !== 'undefined' &&
  typeof performance.mark === 'function' &&
  typeof performance.clearMarks === 'function' &&
  typeof performance.measure === 'function' &&
  typeof performance.clearMeasures === 'function';

// Keep track of fibers that bailed out because we clear their marks and
// don't measure them. This prevents giant flamecharts where little changed.
let skippedFibers = new Set();
// When we exit a deferred loop, we might not have finished the work. However
// the next unit of work pointer is still in the middle of the tree. We keep
// track of the parent path when exiting the loop so that we can unwind the
// flamechart measurements, and later rewind them when we resume work.
let pausedFibers = [];
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
  return `${reactEmoji} ${fiber._debugID}:${phase}`;
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
    `${reactEmoji} ${componentName}` :
    `${reactEmoji} ${componentName}.${phase}`;
  performanceMeasureSafe(label, markName);
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

function pauseTimers() {
  // Stops all currently active measurements so that they can be resumed
  // if we continue in a later deferred loop from the same unit of work.
  while (currentFiber) {
    if (!shouldIgnore(currentFiber) && !skippedFibers.has(currentFiber)) {
      completeMeasurement(currentFiber, 'total');
      pausedFibers.unshift(currentFiber);
    }
    currentFiber = currentFiber.return;
  }
}

function resumeTimers() {
  // Resumes all measurements that were active during the last deferred loop.
  while (pausedFibers.length) {
    const parent = pausedFibers.shift();
    beginMeasurement(parent, 'total');
  }
}

function resetTimers() {
  // If we started new work, this state is no longer valid.
  pausedFibers.length = 0;
  skippedFibers.clear();
}

exports.startWorkTimer = function startWorkTimer(fiber) {
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

exports.cancelWorkTimer = function cancelWorkTimer(fiber) {
  if (!supportsUserTiming) {
    return;
  }
  if (shouldIgnore(fiber)) {
    return;
  }
  // Remember we shouldn't complete measurement for this fiber.
  // Otherwise flamechart will be deep even for small updates.
  skippedFibers.add(fiber);
  clearPendingMeasurement(fiber, 'total');
};

exports.stopWorkTimer = function stopWorkTimer(fiber) {
  if (!supportsUserTiming) {
    return;
  }
  clearPendingUserCodeMeasurement();
  // If we pause, its parent is the fiber to unwind from.
  currentFiber = fiber.return;
  if (shouldIgnore(fiber)) {
    return;
  }
  if (skippedFibers.has(fiber)) {
    skippedFibers.delete(fiber);
    return;
  }
  completeMeasurement(fiber, 'total');
};

exports.startUserCodeTimer = function startUserCodeTimer(fiber, phase) {
  if (!supportsUserTiming) {
    return;
  }
  clearPendingUserCodeMeasurement();
  userCodeFiber = fiber;
  userCodePhase = phase;
  beginMeasurement(fiber, phase);
};

exports.stopUserCodeTimer = function stopUserCodeTimer() {
  if (!supportsUserTiming) {
    return;
  }
  completeMeasurement(userCodeFiber, userCodePhase);
  userCodePhase = null;
  userCodeFiber = null;
};

exports.startWorkLoopTimer = function startWorkLoopTimer() {
  if (!supportsUserTiming) {
    return;
  }
  // This is top level call.
  // Any other measurements are performed within.
  performance.mark(reconcileLabel);
  // Resume any measurements that were in progress during the last loop.
  resumeTimers();
};

exports.stopWorkLoopTimer = function stopWorkLoopTimer() {
  if (!supportsUserTiming) {
    return;
  }
  // Pause any measurements until the next loop.
  pauseTimers();
  performanceMeasureSafe(reconcileLabel, reconcileLabel);
};

exports.startCommitTimer = function startCommitTimer() {
  if (!supportsUserTiming) {
    return;
  }
  performance.mark(commitLabel);
};

exports.stopCommitTimer = function stopCommitTimer() {
  if (!supportsUserTiming) {
    return;
  }
  performanceMeasureSafe(commitLabel, commitLabel);
};

exports.resetPausedWorkTimers = function resetPausedWorkTimers() {
  if (!supportsUserTiming) {
    return;
  }
  resetTimers();
};
