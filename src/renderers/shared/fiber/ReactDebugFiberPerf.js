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

type MeasurementPhase =
  'constructor' |
  'render' |
  'componentWillMount' |
  'componentWillUnmount' |
  'componentWillReceiveProps' |
  'shouldComponentUpdate' |
  'componentWillUpdate' |
  'componentDidUpdate' |
  'componentDidMount' |
  'getChildContext' |
  '[attach ref]' |
  '[call callbacks]' |
  '[clear]' |
  '[create]' |
  '[compute diff]' |
  '[detach ref]' |
  '[mount]' |
  '[update]' |
  '[unmount]';

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
  let currentPhase : MeasurementPhase | null = null;
  let currentPhaseFiber : Fiber | null = null;

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

  const getMarkName = (fiber : Fiber, phase : MeasurementPhase | null) => {
    const debugID = ((fiber._debugID : any) : number);
    return `${reactEmoji} ${debugID}:${phase || 'total'}`;
  };

  const startMeasurement = (fiber : Fiber, phase : MeasurementPhase | null) => {
    const markName = getMarkName(fiber, phase);
    performance.mark(markName);
  };

  const cancelMeasurement = (fiber : Fiber, phase : MeasurementPhase | null) => {
    const markName = getMarkName(fiber, phase);
    performance.clearMarks(markName);
  };

  const stopMeasurement = (fiber : Fiber, phase : MeasurementPhase | null) => {
    const markName = getMarkName(fiber, phase);
    const componentName = getComponentName(fiber) || 'Unknown';
    let label;
    if (phase === null) {
      // These are composite component total time measurements.
      // We'll make mounts visually different from updates with a suffix.
      // Don't append a suffix for updates to avoid clutter.
      label = `${reactEmoji} ${componentName}${fiber.alternate ? '' : ' [create]'}`;
    } else if (phase[0] === '[') {
      // Specific phases (e.g. "div [create]", or "MyButton [attach ref]").
      // May apply to host components.
      label = `${reactEmoji} ${componentName} ${phase}`;
    } else {
      // Composite component methods.
      label = `${reactEmoji} ${componentName}.${phase}`;
    }
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

  const clearPendingPhaseMeasurement = () => {
    if (currentPhase !== null && currentPhaseFiber !== null) {
      cancelMeasurement(currentPhaseFiber, currentPhase);
    }
    currentPhaseFiber = null;
    currentPhase = null;
  };

  const pauseTimers = () => {
    // Stops all currently active measurements so that they can be resumed
    // if we continue in a later deferred loop from the same unit of work.
    let fiber = currentFiber;
    while (fiber) {
      if (fiber._debugIsCurrentlyTiming) {
        stopMeasurement(fiber, null);
      }
      fiber = fiber.return;
    }
  };

  const resumeTimersRecursively = (fiber : Fiber) => {
    if (fiber.return !== null) {
      resumeTimersRecursively(fiber.return);
    }
    if (fiber._debugIsCurrentlyTiming) {
      startMeasurement(fiber, null);
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
      clearPendingPhaseMeasurement();
      // If we pause, this is the fiber to unwind from.
      currentFiber = fiber;
      if (shouldIgnore(fiber)) {
        return;
      }
      fiber._debugIsCurrentlyTiming = true;
      startMeasurement(fiber, null);
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
      cancelMeasurement(fiber, null);
    },

    stopWorkTimer(fiber : Fiber) : void {
      if (!supportsUserTiming) {
        return;
      }
      clearPendingPhaseMeasurement();
      // If we pause, its parent is the fiber to unwind from.
      currentFiber = fiber.return;
      if (shouldIgnore(fiber)) {
        return;
      }
      if (!fiber._debugIsCurrentlyTiming) {
        return;
      }
      fiber._debugIsCurrentlyTiming = false;
      stopMeasurement(fiber, null);
    },

    startPhaseTimer(
      fiber : Fiber,
      phase : MeasurementPhase,
    ) : void {
      if (!supportsUserTiming) {
        return;
      }
      clearPendingPhaseMeasurement();
      currentPhaseFiber = fiber;
      currentPhase = phase;
      startMeasurement(fiber, phase);
    },

    stopPhaseTimer() : void {
      if (!supportsUserTiming) {
        return;
      }
      if (currentPhase !== null && currentPhaseFiber !== null) {
        stopMeasurement(currentPhaseFiber, currentPhase);
      }
      currentPhase = null;
      currentPhaseFiber = null;
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
