/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactFiber';

import {enableUserTimingAPI} from 'shared/ReactFeatureFlags';
import getComponentName from 'shared/getComponentName';
import {
  HostRoot,
  HostComponent,
  HostText,
  HostPortal,
  ReturnComponent,
  Fragment,
} from 'shared/ReactTypeOfWork';

type MeasurementPhase =
  | 'componentWillMount'
  | 'componentWillUnmount'
  | 'componentWillReceiveProps'
  | 'shouldComponentUpdate'
  | 'componentWillUpdate'
  | 'componentDidUpdate'
  | 'componentDidMount'
  | 'getChildContext';

// Prefix measurements so that it's possible to filter them.
// Longer prefixes are hard to read in DevTools.
const reactEmoji = '\u269B';
const warningEmoji = '\u26D4';
const supportsUserTiming =
  typeof performance !== 'undefined' &&
  typeof performance.mark === 'function' &&
  typeof performance.clearMarks === 'function' &&
  typeof performance.measure === 'function' &&
  typeof performance.clearMeasures === 'function';

// Keep track of current fiber so that we know the path to unwind on pause.
// TODO: this looks the same as nextUnitOfWork in scheduler. Can we unify them?
let currentFiber: Fiber | null = null;
// If we're in the middle of user code, which fiber and method is it?
// Reusing `currentFiber` would be confusing for this because user code fiber
// can change during commit phase too, but we don't need to unwind it (since
// lifecycles in the commit phase don't resemble a tree).
let currentPhase: MeasurementPhase | null = null;
let currentPhaseFiber: Fiber | null = null;
// Did lifecycle hook schedule an update? This is often a performance problem,
// so we will keep track of it, and include it in the report.
// Track commits caused by cascading updates.
let isCommitting: boolean = false;
let hasScheduledUpdateInCurrentCommit: boolean = false;
let hasScheduledUpdateInCurrentPhase: boolean = false;
let commitCountInCurrentWorkLoop: number = 0;
let effectCountInCurrentCommit: number = 0;
// During commits, we only show a measurement once per method name
// to avoid stretch the commit phase with measurement overhead.
const labelsInCurrentCommit: Set<string> = new Set();

const formatMarkName = (markName: string) => {
  return `${reactEmoji} ${markName}`;
};

const formatLabel = (label: string, warning: string | null) => {
  const prefix = warning ? `${warningEmoji} ` : `${reactEmoji} `;
  const suffix = warning ? ` Warning: ${warning}` : '';
  return `${prefix}${label}${suffix}`;
};

const beginMark = (markName: string) => {
  performance.mark(formatMarkName(markName));
};

const clearMark = (markName: string) => {
  performance.clearMarks(formatMarkName(markName));
};

const endMark = (label: string, markName: string, warning: string | null) => {
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

const getFiberMarkName = (label: string, debugID: number) => {
  return `${label} (#${debugID})`;
};

const getFiberLabel = (
  componentName: string,
  isMounted: boolean,
  phase: MeasurementPhase | null,
) => {
  if (phase === null) {
    // These are composite component total time measurements.
    return `${componentName} [${isMounted ? 'update' : 'mount'}]`;
  } else {
    // Composite component methods.
    return `${componentName}.${phase}`;
  }
};

const beginFiberMark = (
  fiber: Fiber,
  phase: MeasurementPhase | null,
): boolean => {
  const componentName = getComponentName(fiber) || 'Unknown';
  const debugID = ((fiber._debugID: any): number);
  const isMounted = fiber.alternate !== null;
  const label = getFiberLabel(componentName, isMounted, phase);

  if (isCommitting && labelsInCurrentCommit.has(label)) {
    // During the commit phase, we don't show duplicate labels because
    // there is a fixed overhead for every measurement, and we don't
    // want to stretch the commit phase beyond necessary.
    return false;
  }
  labelsInCurrentCommit.add(label);

  const markName = getFiberMarkName(label, debugID);
  beginMark(markName);
  return true;
};

const clearFiberMark = (fiber: Fiber, phase: MeasurementPhase | null) => {
  const componentName = getComponentName(fiber) || 'Unknown';
  const debugID = ((fiber._debugID: any): number);
  const isMounted = fiber.alternate !== null;
  const label = getFiberLabel(componentName, isMounted, phase);
  const markName = getFiberMarkName(label, debugID);
  clearMark(markName);
};

const endFiberMark = (
  fiber: Fiber,
  phase: MeasurementPhase | null,
  warning: string | null,
) => {
  const componentName = getComponentName(fiber) || 'Unknown';
  const debugID = ((fiber._debugID: any): number);
  const isMounted = fiber.alternate !== null;
  const label = getFiberLabel(componentName, isMounted, phase);
  const markName = getFiberMarkName(label, debugID);
  endMark(label, markName, warning);
};

const shouldIgnoreFiber = (fiber: Fiber): boolean => {
  // Host components should be skipped in the timeline.
  // We could check typeof fiber.type, but does this work with RN?
  switch (fiber.tag) {
    case HostRoot:
    case HostComponent:
    case HostText:
    case HostPortal:
    case ReturnComponent:
    case Fragment:
      return true;
    default:
      return false;
  }
};

const clearPendingPhaseMeasurement = () => {
  if (currentPhase !== null && currentPhaseFiber !== null) {
    clearFiberMark(currentPhaseFiber, currentPhase);
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
      endFiberMark(fiber, null, null);
    }
    fiber = fiber.return;
  }
};

const resumeTimersRecursively = (fiber: Fiber) => {
  if (fiber.return !== null) {
    resumeTimersRecursively(fiber.return);
  }
  if (fiber._debugIsCurrentlyTiming) {
    beginFiberMark(fiber, null);
  }
};

const resumeTimers = () => {
  // Resumes all measurements that were active during the last deferred loop.
  if (currentFiber !== null) {
    resumeTimersRecursively(currentFiber);
  }
};

export function recordEffect(): void {
  if (enableUserTimingAPI) {
    effectCountInCurrentCommit++;
  }
}

export function recordScheduleUpdate(): void {
  if (enableUserTimingAPI) {
    if (isCommitting) {
      hasScheduledUpdateInCurrentCommit = true;
    }
    if (
      currentPhase !== null &&
      currentPhase !== 'componentWillMount' &&
      currentPhase !== 'componentWillReceiveProps'
    ) {
      hasScheduledUpdateInCurrentPhase = true;
    }
  }
}

export function startWorkTimer(fiber: Fiber): void {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming || shouldIgnoreFiber(fiber)) {
      return;
    }
    // If we pause, this is the fiber to unwind from.
    currentFiber = fiber;
    if (!beginFiberMark(fiber, null)) {
      return;
    }
    fiber._debugIsCurrentlyTiming = true;
  }
}

export function cancelWorkTimer(fiber: Fiber): void {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming || shouldIgnoreFiber(fiber)) {
      return;
    }
    // Remember we shouldn't complete measurement for this fiber.
    // Otherwise flamechart will be deep even for small updates.
    fiber._debugIsCurrentlyTiming = false;
    clearFiberMark(fiber, null);
  }
}

export function stopWorkTimer(fiber: Fiber): void {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming || shouldIgnoreFiber(fiber)) {
      return;
    }
    // If we pause, its parent is the fiber to unwind from.
    currentFiber = fiber.return;
    if (!fiber._debugIsCurrentlyTiming) {
      return;
    }
    fiber._debugIsCurrentlyTiming = false;
    endFiberMark(fiber, null, null);
  }
}

export function stopFailedWorkTimer(fiber: Fiber): void {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming || shouldIgnoreFiber(fiber)) {
      return;
    }
    // If we pause, its parent is the fiber to unwind from.
    currentFiber = fiber.return;
    if (!fiber._debugIsCurrentlyTiming) {
      return;
    }
    fiber._debugIsCurrentlyTiming = false;
    const warning = 'An error was thrown inside this error boundary';
    endFiberMark(fiber, null, warning);
  }
}

export function startPhaseTimer(fiber: Fiber, phase: MeasurementPhase): void {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming) {
      return;
    }
    clearPendingPhaseMeasurement();
    if (!beginFiberMark(fiber, phase)) {
      return;
    }
    currentPhaseFiber = fiber;
    currentPhase = phase;
  }
}

export function stopPhaseTimer(): void {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming) {
      return;
    }
    if (currentPhase !== null && currentPhaseFiber !== null) {
      const warning = hasScheduledUpdateInCurrentPhase
        ? 'Scheduled a cascading update'
        : null;
      endFiberMark(currentPhaseFiber, currentPhase, warning);
    }
    currentPhase = null;
    currentPhaseFiber = null;
  }
}

export function startWorkLoopTimer(nextUnitOfWork: Fiber | null): void {
  if (enableUserTimingAPI) {
    currentFiber = nextUnitOfWork;
    if (!supportsUserTiming) {
      return;
    }
    commitCountInCurrentWorkLoop = 0;
    // This is top level call.
    // Any other measurements are performed within.
    beginMark('(React Tree Reconciliation)');
    // Resume any measurements that were in progress during the last loop.
    resumeTimers();
  }
}

export function stopWorkLoopTimer(interruptedBy: Fiber | null): void {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming) {
      return;
    }
    let warning = null;
    if (interruptedBy !== null) {
      if (interruptedBy.tag === HostRoot) {
        warning = 'A top-level update interrupted the previous render';
      } else {
        const componentName = getComponentName(interruptedBy) || 'Unknown';
        warning = `An update to ${componentName} interrupted the previous render`;
      }
    } else if (commitCountInCurrentWorkLoop > 1) {
      warning = 'There were cascading updates';
    }
    commitCountInCurrentWorkLoop = 0;
    // Pause any measurements until the next loop.
    pauseTimers();
    endMark(
      '(React Tree Reconciliation)',
      '(React Tree Reconciliation)',
      warning,
    );
  }
}

export function startCommitTimer(): void {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming) {
      return;
    }
    isCommitting = true;
    hasScheduledUpdateInCurrentCommit = false;
    labelsInCurrentCommit.clear();
    beginMark('(Committing Changes)');
  }
}

export function stopCommitTimer(): void {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming) {
      return;
    }

    let warning = null;
    if (hasScheduledUpdateInCurrentCommit) {
      warning = 'Lifecycle hook scheduled a cascading update';
    } else if (commitCountInCurrentWorkLoop > 0) {
      warning = 'Caused by a cascading update in earlier commit';
    }
    hasScheduledUpdateInCurrentCommit = false;
    commitCountInCurrentWorkLoop++;
    isCommitting = false;
    labelsInCurrentCommit.clear();

    endMark('(Committing Changes)', '(Committing Changes)', warning);
  }
}

export function startCommitHostEffectsTimer(): void {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming) {
      return;
    }
    effectCountInCurrentCommit = 0;
    beginMark('(Committing Host Effects)');
  }
}

export function stopCommitHostEffectsTimer(): void {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming) {
      return;
    }
    const count = effectCountInCurrentCommit;
    effectCountInCurrentCommit = 0;
    endMark(
      `(Committing Host Effects: ${count} Total)`,
      '(Committing Host Effects)',
      null,
    );
  }
}

export function startCommitLifeCyclesTimer(): void {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming) {
      return;
    }
    effectCountInCurrentCommit = 0;
    beginMark('(Calling Lifecycle Methods)');
  }
}

export function stopCommitLifeCyclesTimer(): void {
  if (enableUserTimingAPI) {
    if (!supportsUserTiming) {
      return;
    }
    const count = effectCountInCurrentCommit;
    effectCountInCurrentCommit = 0;
    endMark(
      `(Calling Lifecycle Methods: ${count} Total)`,
      '(Calling Lifecycle Methods)',
      null,
    );
  }
}
