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

import type { Fiber } from 'ReactFiber';

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

// TODO: are we running all those?
type UserCodePhase =
  'constructor' |
  'render' |
  'componentWillMount' |
  'componentWillUnmount' |
  'componentWillReceiveProps' |
  'shouldComponentUpdate' |
  'componentWillUpdate' |
  'componentDidUpdate' |
  'componentDidMount';
type MeasurementPhase = UserCodePhase | 'total';

// Keep track of current fiber so that we know the path to unwind on pause.
// TODO: this looks the same as nextUnitOfWork in scheduler. Can we unify them?
let currentFiber : Fiber | null = null;
// If we're in the middle of user code, which fiber and method is it?
// Reusing `currentFiber` would be confusing for this because user code fiber
// can change during commit phase too, but we don't need to unwind it (since
// lifecycles in the commit phase don't resemble a tree).
let userCodePhase : UserCodePhase | null = null;
let userCodeFiber : Fiber | null = null;

function performanceMeasureSafe(label : string, markName : string) {
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

function getMarkName(fiber : Fiber, phase : MeasurementPhase) {
  const debugID = ((fiber._debugID : any) : number);
  return `${reactEmoji} ${debugID}:${phase}`;
}

function beginMeasurement(fiber : Fiber, phase : MeasurementPhase) {
  const markName = getMarkName(fiber, phase);
  performance.mark(markName);
}

function clearPendingMeasurement(fiber : Fiber, phase : MeasurementPhase) {
  const markName = getMarkName(fiber, phase);
  performance.clearMarks(markName);
}

function completeMeasurement(fiber : Fiber, phase : MeasurementPhase) {
  const markName = getMarkName(fiber, phase);
  const componentName = getComponentName(fiber) || 'Unknown';
  const label = phase === 'total' ?
    `${reactEmoji} ${componentName}` :
    `${reactEmoji} ${componentName}.${phase}`;
  performanceMeasureSafe(label, markName);
}

function shouldIgnore(fiber : Fiber) : boolean {
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
  let fiber = currentFiber;
  while (fiber) {
    if (fiber._debugIsCurrentlyTiming) {
      completeMeasurement(fiber, 'total');
    }
    fiber = fiber.return;
  }
}

function resumeTimersRecursively(fiber : Fiber) {
  if (fiber.return !== null) {
    resumeTimersRecursively(fiber.return);
  }
  if (fiber._debugIsCurrentlyTiming) {
    beginMeasurement(fiber, 'total');
  }
}

function resumeTimers() {
  // Resumes all measurements that were active during the last deferred loop.
  if (currentFiber !== null) {
    resumeTimersRecursively(currentFiber);
  }
}

exports.startWorkTimer = function startWorkTimer(fiber : Fiber) : void {
  if (!supportsUserTiming) {
    return;
  }
  clearPendingUserCodeMeasurement();
  // If we pause, this is the fiber to unwind from.
  currentFiber = fiber;
  if (shouldIgnore(fiber)) {
    return;
  }
  fiber._debugIsCurrentlyTiming = true;
  beginMeasurement(fiber, 'total');
};

exports.cancelWorkTimer = function cancelWorkTimer(fiber : Fiber) : void {
  if (!supportsUserTiming) {
    return;
  }
  if (shouldIgnore(fiber)) {
    return;
  }
  // Remember we shouldn't complete measurement for this fiber.
  // Otherwise flamechart will be deep even for small updates.
  fiber._debugIsCurrentlyTiming = false;
  clearPendingMeasurement(fiber, 'total');
};

exports.stopWorkTimer = function stopWorkTimer(fiber : Fiber) : void {
  if (!supportsUserTiming) {
    return;
  }
  clearPendingUserCodeMeasurement();
  // If we pause, its parent is the fiber to unwind from.
  currentFiber = fiber.return;
  if (shouldIgnore(fiber)) {
    return;
  }
  if (!fiber._debugIsCurrentlyTiming) {
    return;
  }
  fiber._debugIsCurrentlyTiming = false;
  completeMeasurement(fiber, 'total');
};

exports.startUserCodeTimer = function startUserCodeTimer(
  fiber : Fiber,
  phase : UserCodePhase,
) : void {
  if (!supportsUserTiming) {
    return;
  }
  clearPendingUserCodeMeasurement();
  userCodeFiber = fiber;
  userCodePhase = phase;
  beginMeasurement(fiber, phase);
};

exports.stopUserCodeTimer = function stopUserCodeTimer() : void {
  if (!supportsUserTiming) {
    return;
  }
  if (userCodePhase !== null && userCodeFiber !== null) {
    completeMeasurement(userCodeFiber, userCodePhase);
  }
  userCodePhase = null;
  userCodeFiber = null;
};

exports.startWorkLoopTimer = function startWorkLoopTimer() : void {
  if (!supportsUserTiming) {
    return;
  }
  // This is top level call.
  // Any other measurements are performed within.
  performance.mark(reconcileLabel);
  // Resume any measurements that were in progress during the last loop.
  resumeTimers();
};

exports.stopWorkLoopTimer = function stopWorkLoopTimer() : void {
  if (!supportsUserTiming) {
    return;
  }
  // Pause any measurements until the next loop.
  pauseTimers();
  performanceMeasureSafe(reconcileLabel, reconcileLabel);
};

exports.startCommitTimer = function startCommitTimer() : void {
  if (!supportsUserTiming) {
    return;
  }
  performance.mark(commitLabel);
};

exports.stopCommitTimer = function stopCommitTimer() : void {
  if (!supportsUserTiming) {
    return;
  }
  performanceMeasureSafe(commitLabel, commitLabel);
};

