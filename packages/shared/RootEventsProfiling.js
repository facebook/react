/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {enableRootEventMarks} from 'shared/ReactFeatureFlags';
import getComponentName from 'shared/getComponentName';
import {getStackByFiberInDevAndProd} from 'react-reconciler/src/ReactCurrentFiber';

import type {Fiber} from 'react-reconciler/src/ReactFiber';

const supportsUserTiming =
  typeof performance !== 'undefined' &&
  typeof performance.mark === 'function' &&
  typeof performance.clearMarks === 'function' &&
  typeof performance.measure === 'function' &&
  typeof performance.clearMeasures === 'function';

export type PriorityLabel = 'high' | 'normal' | 'low';
export type WorkType = 'render' | 'state-update';

export function schedulerStarted(priorityLabel: PriorityLabel): void {
  if (enableRootEventMarks) {
    if (supportsUserTiming) {
      performance.mark(`--scheduler-start-${priorityLabel}`);
    }
  }
}

export function schedulerStopped(priorityLabel: PriorityLabel): void {
  if (enableRootEventMarks) {
    if (supportsUserTiming) {
      performance.mark(`--scheduler-stop-${priorityLabel}`);
    }
  }
}

export function commitStarted(): void {
  if (enableRootEventMarks) {
    if (supportsUserTiming) {
      performance.mark(`--commit-start`);
    }
  }
}

export function commitStopped(): void {
  if (enableRootEventMarks) {
    if (supportsUserTiming) {
      performance.mark(`--commit-stop`);
    }
  }
}

export function layoutEffectsStarted(): void {
  if (enableRootEventMarks) {
    if (supportsUserTiming) {
      performance.mark(`--layout-effects-start`);
    }
  }
}

export function layoutEffectsStopped(): void {
  if (enableRootEventMarks) {
    if (supportsUserTiming) {
      performance.mark(`--layout-effects-stop`);
    }
  }
}

export function passiveEffectsStarted(): void {
  if (enableRootEventMarks) {
    if (supportsUserTiming) {
      performance.mark(`--passive-effects-start`);
    }
  }
}

export function passiveEffectsStopped(): void {
  if (enableRootEventMarks) {
    if (supportsUserTiming) {
      performance.mark(`--passive-effects-stop`);
    }
  }
}

export function renderStarted(): void {
  if (enableRootEventMarks) {
    if (supportsUserTiming) {
      performance.mark('--render-start');
    }
  }
}

export function renderAbandoned(): void {
  if (enableRootEventMarks) {
    if (supportsUserTiming) {
      performance.mark('--render-cancel');
    }
  }
}

export function renderStopped(didCompleteRoot: boolean): void {
  if (enableRootEventMarks) {
    if (supportsUserTiming) {
      performance.mark(`--render-${didCompleteRoot ? 'stop' : 'yield'}`);
    }
  }
}

export function componentSuspended(fiber: Fiber): void {
  if (enableRootEventMarks) {
    if (supportsUserTiming) {
      const componentStack = getStackByFiberInDevAndProd(fiber) || '';
      const name = getComponentName(fiber.type) || '';
      // TODO (brian) Generate and store temporary ID so DevTools can match up a component stack later.
      performance.mark(`--suspend-${name}-${componentStack}`);
    }
  }
}

// TODO (brian) Log updates at the priority they are scheduled with (not the current priority)
export function workScheduled(
  type: WorkType,
  // TODO priorityLabel: PriorityLabel,
  fiber: Fiber | null,
): void {
  if (enableRootEventMarks) {
    if (supportsUserTiming) {
      let componentStack = null;
      let name = null;
      if (fiber != null) {
        componentStack = getStackByFiberInDevAndProd(fiber);
        name = getComponentName(fiber.type);
      }
      // TODO (brian) Generate and store temporary ID so DevTools can match up a component stack later.
      performance.mark(
        `--schedule-${type}-${name || ''}-${componentStack || ''}`,
      );
    }
  }
}
