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

import type { Fiber } from 'ReactFiber';

type UserCodePhase =
  'constructor' |
  'render' |
  'componentWillMount' |
  'componentWillUnmount' |
  'componentWillReceiveProps' |
  'shouldComponentUpdate' |
  'componentWillUpdate' |
  'componentDidUpdate' |
  'componentDidMount' |
  'getChildContext';

type MeasurementPhase = UserCodePhase | 'total';

// Trust the developer to only use this with a __DEV__ check
let ReactDebugFiberPerf = ((null: any): typeof ReactDebugFiberPerf);

if (__DEV__) {
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

  // Keep track of current fiber so that we know the path to unwind on pause.
  // TODO: this looks the same as nextUnitOfWork in scheduler. Can we unify them?
  let currentFiber : Fiber | null = null;
  // If we're in the middle of user code, which fiber and method is it?
  // Reusing `currentFiber` would be confusing for this because user code fiber
  // can change during commit phase too, but we don't need to unwind it (since
  // lifecycles in the commit phase don't resemble a tree).
  let userCodePhase : UserCodePhase | null = null;
  let userCodeFiber : Fiber | null = null;

  const performanceMeasureSafe = (label : string, markName : string) => {
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
  };

  const getMarkName = (fiber : Fiber, phase : MeasurementPhase) => {
    const debugID = ((fiber._debugID : any) : number);
    return `${reactEmoji} ${debugID}:${phase}`;
  };

  const beginMeasurement = (fiber : Fiber, phase : MeasurementPhase) => {
    const markName = getMarkName(fiber, phase);
    performance.mark(markName);
  };

  const clearPendingMeasurement = (fiber : Fiber, phase : MeasurementPhase) => {
    const markName = getMarkName(fiber, phase);
    performance.clearMarks(markName);
  };

  const completeMeasurement = (fiber : Fiber, phase : MeasurementPhase) => {
    const markName = getMarkName(fiber, phase);
    const componentName = getComponentName(fiber) || 'Unknown';
    const label = phase === 'total' ?
      `${reactEmoji} ${componentName}` :
      `${reactEmoji} ${componentName}.${phase}`;
    performanceMeasureSafe(label, markName);
  };

  const shouldIgnore = (fiber : Fiber) : boolean => {
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
  };

  const clearPendingUserCodeMeasurement = () => {
    if (userCodePhase !== null && userCodeFiber !== null) {
      clearPendingMeasurement(userCodeFiber, userCodePhase);
    }
    userCodeFiber = null;
    userCodePhase = null;
  };

  const pauseTimers = () => {
    // Stops all currently active measurements so that they can be resumed
    // if we continue in a later deferred loop from the same unit of work.
    let fiber = currentFiber;
    while (fiber) {
      if (fiber._debugIsCurrentlyTiming) {
        completeMeasurement(fiber, 'total');
      }
      fiber = fiber.return;
    }
  };

  const resumeTimersRecursively = (fiber : Fiber) => {
    if (fiber.return !== null) {
      resumeTimersRecursively(fiber.return);
    }
    if (fiber._debugIsCurrentlyTiming) {
      beginMeasurement(fiber, 'total');
    }
  };

  const resumeTimers = () => {
    // Resumes all measurements that were active during the last deferred loop.
    if (currentFiber !== null) {
      resumeTimersRecursively(currentFiber);
    }
  };

  ReactDebugFiberPerf = {
    startWorkTimer(fiber : Fiber) : void {
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
    },

    cancelWorkTimer(fiber : Fiber) : void {
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
    },

    stopWorkTimer(fiber : Fiber) : void {
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
    },

    startUserCodeTimer(
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
    },

    stopUserCodeTimer() : void {
      if (!supportsUserTiming) {
        return;
      }
      if (userCodePhase !== null && userCodeFiber !== null) {
        completeMeasurement(userCodeFiber, userCodePhase);
      }
      userCodePhase = null;
      userCodeFiber = null;
    },

    startWorkLoopTimer() : void {
      if (!supportsUserTiming) {
        return;
      }
      // This is top level call.
      // Any other measurements are performed within.
      performance.mark(reconcileLabel);
      // Resume any measurements that were in progress during the last loop.
      resumeTimers();
    },

    stopWorkLoopTimer() : void {
      if (!supportsUserTiming) {
        return;
      }
      // Pause any measurements until the next loop.
      pauseTimers();
      performanceMeasureSafe(reconcileLabel, reconcileLabel);
    },

    startCommitTimer() : void {
      if (!supportsUserTiming) {
        return;
      }
      performance.mark(commitLabel);
    },

    stopCommitTimer() : void {
      if (!supportsUserTiming) {
        return;
      }
      performanceMeasureSafe(commitLabel, commitLabel);
    },
  };
}

module.exports = ReactDebugFiberPerf;
