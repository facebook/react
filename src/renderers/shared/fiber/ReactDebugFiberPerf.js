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
  const warningEmoji = '\u26A0\uFE0F';
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
  // Did a lifecycle hook schedule an update? This is often a performance problem,
  // so we will keep track of it, and include it in the report.
  let hasScheduledUpdateInCurrentPhase : boolean = false;
  // Track commits caused by cascading updates.
  let commitCountInCurrentWorkLoop : number = 0;

  const formatMarkName = (markName : string) => {
    return `${reactEmoji} ${markName}`;
  };

  const formatLabel = (label : string, warning : string | null) => {
    const prefix = warning ? `${warningEmoji} ` : `${reactEmoji} `;
    const suffix = warning ? ` Warning: ${warning}` : '';
    return `${prefix}${label}${suffix}`;
  };

  const beginMark = (markName : string) => {
    performance.mark(formatMarkName(markName));
  };

  const clearMark = (markName : string) => {
    performance.clearMarks(formatMarkName(markName));
  };

  const endMark = (label : string, markName : string, warning : string | null) => {
    const formattedMarkName = formatMarkName(markName);
    const formattedLabel = formatLabel(label, warning);
    try {
      performance.measure(formattedLabel, formattedMarkName);
    } catch (err) {
      // If previous mark was missing for some reason, this will throw.
      // This could only happen if React crashed in an unexpected place earlier.
      // Don't pile on with more errors.
    }
    // Clear marks immediately to avoid growing buffer.
    performance.clearMarks(formattedMarkName);
    performance.clearMeasures(formattedLabel);
  };

  const getFiberMarkName = (fiber : Fiber, phase : MeasurementPhase | null) => {
    const debugID = ((fiber._debugID : any) : number);
    return `${debugID}:${phase || 'total'}`;
  };

  const getFiberLabel = (fiber : Fiber, phase : MeasurementPhase | null) => {
    const componentName = getComponentName(fiber) || 'Unknown';
    if (phase === null && fiber.alternate === null) {
      // These are composite component total time measurements.
      // We'll make mounts visually different from updates with a suffix.
      // Don't append a suffix for updates to avoid clutter.
      phase = '[create]';
    }
    if (phase === null) {
      // Composite component total time for updates.
      return componentName;
    } else if (phase[0] === '[') {
      // Specific phases (e.g. "div [create]", or "MyButton [attach ref]").
      // May apply to host components.
      return `${componentName} ${phase}`;
    } else {
      // Composite component methods.
      return `${componentName}.${phase}`;
    }
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
      const markName = getFiberMarkName(currentPhaseFiber, currentPhase);
      clearMark(markName);
    }
    currentPhaseFiber = null;
    currentPhase = null;
    hasScheduledUpdateInCurrentPhase = false;
  };

  const pauseTimers = () => {
    // Stops all currently active measurements so that they can be resumed
    // if we continue in a later deferred loop from the same unit of work.
    let fiber = currentFiber;
    while (fiber) {
      if (fiber._debugIsCurrentlyTiming) {
        const markName = getFiberMarkName(fiber, null);
        const label = getFiberLabel(fiber, null);
        endMark(label, markName, null);
      }
      fiber = fiber.return;
    }
  };

  const resumeTimersRecursively = (fiber : Fiber) => {
    if (fiber.return !== null) {
      resumeTimersRecursively(fiber.return);
    }
    if (fiber._debugIsCurrentlyTiming) {
      const markName = getFiberMarkName(fiber, null);
      beginMark(markName);
    }
  };

  const resumeTimers = () => {
    // Resumes all measurements that were active during the last deferred loop.
    if (currentFiber !== null) {
      resumeTimersRecursively(currentFiber);
    }
  };

  ReactDebugFiberPerf = {
    recordScheduleUpdate() : void {
      hasScheduledUpdateInCurrentPhase = true;
    },

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
      const markName = getFiberMarkName(fiber, null);
      beginMark(markName);
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
      const markName = getFiberMarkName(fiber, null);
      clearMark(markName);
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
      const markName = getFiberMarkName(fiber, null);
      const label = getFiberLabel(fiber, null);
      endMark(label, markName, null);
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
      const markName = getFiberMarkName(fiber, phase);
      beginMark(markName);
    },

    stopPhaseTimer() : void {
      if (!supportsUserTiming) {
        return;
      }
      if (currentPhase !== null && currentPhaseFiber !== null) {
        const markName = getFiberMarkName(currentPhaseFiber, currentPhase);
        const label = getFiberLabel(currentPhaseFiber, currentPhase);
        const warning = hasScheduledUpdateInCurrentPhase ?
          'Scheduled a cascading update' :
          null;
        endMark(label, markName, warning);
      }
      currentPhase = null;
      currentPhaseFiber = null;
    },

    startWorkLoopTimer() : void {
      if (!supportsUserTiming) {
        return;
      }
      commitCountInCurrentWorkLoop = 0;
      // This is top level call.
      // Any other measurements are performed within.
      beginMark('(React Tree Reconciliation)');
      // Resume any measurements that were in progress during the last loop.
      resumeTimers();
    },

    stopWorkLoopTimer() : void {
      if (!supportsUserTiming) {
        return;
      }
      // Pause any measurements until the next loop.
      pauseTimers();
      const warning = commitCountInCurrentWorkLoop > 1 ?
        'There were cascading updates' :
        null;
      endMark(
        '(React Tree Reconciliation)',
        '(React Tree Reconciliation)',
        warning
      );
      commitCountInCurrentWorkLoop = 0;
    },

    startCommitTimer() : void {
      if (!supportsUserTiming) {
        return;
      }
      beginMark('(Committing Changes)');
    },

    stopCommitTimer() : void {
      if (!supportsUserTiming) {
        return;
      }
      commitCountInCurrentWorkLoop++;
      const warning = commitCountInCurrentWorkLoop > 1 ?
        'Caused by a cascading update' :
        null;
      endMark(
        '(Committing Changes)',
        '(Committing Changes)',
        warning
      );
    },
  };
}

module.exports = ReactDebugFiberPerf;
