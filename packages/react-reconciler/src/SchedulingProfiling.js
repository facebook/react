/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Lane, Lanes} from './ReactFiberLane';
import type {Fiber} from './ReactInternalTypes';

import {enableSchedulingProfiler} from 'shared/ReactFeatureFlags';
import {getStackByFiberInDevAndProd} from './ReactFiberComponentStack';

/**
 * If performance exists and supports the subset of the User Timing API that we
 * require.
 */
const supportsUserTiming =
  typeof performance !== 'undefined' && typeof performance.mark === 'function';

function formatLanes(laneOrLanes: Lane | Lanes): string {
  return ((laneOrLanes: any): number).toString();
}

export function markCommitStarted(lanes: Lanes): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTiming) {
      performance.mark(`--commit-start-${formatLanes(lanes)}`);
    }
  }
}

export function markCommitStopped(): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTiming) {
      performance.mark(`--commit-stop`);
    }
  }
}

const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
// $FlowFixMe: Flow cannot handle polymorphic WeakMaps
const wakeableIDs: WeakMap<Wakeable, number> = new PossiblyWeakMap();
let wakeableID: number = 0;
function getWakeableID(wakeable: Wakeable): number {
  if (!wakeableIDs.has(wakeable)) {
    wakeableIDs.set(wakeable, wakeableID++);
  }
  return ((wakeableIDs.get(wakeable): any): number);
}

export function markComponentSuspended(
  componentName: string,
  fiber: Fiber,
  wakeable: Wakeable,
): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTiming) {
      const id = getWakeableID(wakeable);
      const componentStack = getStackByFiberInDevAndProd(fiber) || '';
      // TODO (brian) Generate and store temporary ID so DevTools can match up a component stack later.
      performance.mark(
        `--suspense-suspend-${componentName}-${id}-${componentStack}`,
      );
      wakeable.then(
        () =>
          performance.mark(
            `--suspense-resolved-${componentName}-${id}-${componentStack}`,
          ),
        () =>
          performance.mark(
            `--suspense-rejected-${componentName}-${id}-${componentStack}`,
          ),
      );
    }
  }
}

export function markLayoutEffectsStarted(lanes: Lanes): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTiming) {
      performance.mark(`--layout-effects-start-${formatLanes(lanes)}`);
    }
  }
}

export function markLayoutEffectsStopped(): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTiming) {
      performance.mark('--layout-effects-stop');
    }
  }
}

export function markPassiveEffectsStarted(lanes: Lanes): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTiming) {
      performance.mark(`--passive-effects-start-${formatLanes(lanes)}`);
    }
  }
}

export function markPassiveEffectsStopped(): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTiming) {
      performance.mark('--passive-effects-stop');
    }
  }
}

export function markRenderStarted(lanes: Lanes): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTiming) {
      performance.mark(`--render-start-${formatLanes(lanes)}`);
    }
  }
}

export function markRenderYielded(): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTiming) {
      performance.mark('--render-yield');
    }
  }
}

export function markRenderStopped(): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTiming) {
      performance.mark('--render-stop');
    }
  }
}

export function markRenderScheduled(fiber: Fiber, lane: Lane): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTiming) {
      const componentStack = getStackByFiberInDevAndProd(fiber) || '';
      // TODO (brian) Generate and store temporary ID so DevTools can match up a component stack later.
      performance.mark(
        `--schedule-render-${formatLanes(lane)}-${componentStack}`,
      );
    }
  }
}

export function markForceUpdateScheduled(
  componentName: string,
  fiber: Fiber,
  lane: Lane,
): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTiming) {
      const componentStack = getStackByFiberInDevAndProd(fiber) || '';
      // TODO (brian) Generate and store temporary ID so DevTools can match up a component stack later.
      performance.mark(
        `--schedule-forced-update-${componentName}-${formatLanes(
          lane,
        )}-${componentStack}`,
      );
    }
  }
}

export function markStateUpdateScheduled(
  componentName: string,
  fiber: Fiber,
  lane: Lane,
): void {
  if (enableSchedulingProfiler) {
    if (supportsUserTiming) {
      const componentStack = getStackByFiberInDevAndProd(fiber) || '';
      // TODO (brian) Generate and store temporary ID so DevTools can match up a component stack later.
      performance.mark(
        `--schedule-state-update-${componentName}-${formatLanes(
          lane,
        )}-${componentStack}`,
      );
    }
  }
}
