/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Lane,
  Lanes,
  DevToolsProfilingHooks,
} from 'react-devtools-shared/src/backend/types';
import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import type {Wakeable} from 'shared/ReactTypes';

import isArray from 'shared/isArray';
import {SCHEDULING_PROFILER_VERSION} from 'react-devtools-timeline/src/constants';

let performanceTarget: Performance | null = null;

// If performance exists and supports the subset of the User Timing API that we require.
let supportsUserTiming =
  typeof performance !== 'undefined' &&
  typeof performance.mark === 'function' &&
  typeof performance.clearMarks === 'function';

let supportsUserTimingV3 = false;
if (supportsUserTiming) {
  const CHECK_V3_MARK = '__v3';
  const markOptions = {};
  // $FlowFixMe: Ignore Flow complaining about needing a value
  Object.defineProperty(markOptions, 'startTime', {
    get: function() {
      supportsUserTimingV3 = true;
      return 0;
    },
    set: function() {},
  });

  try {
    // $FlowFixMe: Flow expects the User Timing level 2 API.
    performance.mark(CHECK_V3_MARK, markOptions);
  } catch (error) {
    // Ignore
  } finally {
    performance.clearMarks(CHECK_V3_MARK);
  }
}

if (supportsUserTimingV3) {
  performanceTarget = performance;
}

// Mocking the Performance Object (and User Timing APIs) for testing is fragile.
// This API allows tests to directly override the User Timing APIs.
export function setPerformanceMock_ONLY_FOR_TESTING(
  performanceMock: Performance | null,
) {
  performanceTarget = performanceMock;
  supportsUserTiming = performanceMock !== null;
  supportsUserTimingV3 = performanceMock !== null;
}

function markAndClear(markName) {
  // This method won't be called unless these functions are defined, so we can skip the extra typeof check.
  ((performanceTarget: any): Performance).mark(markName);
  ((performanceTarget: any): Performance).clearMarks(markName);
}

export function createProfilingHooks({
  getDisplayNameForFiber,
  getLaneLabelMap,
  reactVersion,
}: {|
  getDisplayNameForFiber: (fiber: Fiber) => string | null,
  getLaneLabelMap?: () => Map<Lane, string> | null,
  reactVersion: string,
|}): DevToolsProfilingHooks {
  function markMetadata() {
    markAndClear(`--react-version-${reactVersion}`);
    markAndClear(`--profiler-version-${SCHEDULING_PROFILER_VERSION}`);

    /* global __REACT_DEVTOOLS_GLOBAL_HOOK__ */
    if (
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.getInternalModuleRanges ===
        'function'
    ) {
      // Ask the DevTools hook for module ranges that may have been reported by the current renderer(s).
      const ranges = __REACT_DEVTOOLS_GLOBAL_HOOK__.getInternalModuleRanges();

      // This check would not be required,
      // except that it's possible for things to override __REACT_DEVTOOLS_GLOBAL_HOOK__.
      if (isArray(ranges)) {
        for (let i = 0; i < ranges.length; i++) {
          const range = ranges[i];
          if (isArray(range) && range.length === 2) {
            const [startStackFrame, stopStackFrame] = ranges[i];

            markAndClear(`--react-internal-module-start-${startStackFrame}`);
            markAndClear(`--react-internal-module-stop-${stopStackFrame}`);
          }
        }
      }
    }

    if (typeof getLaneLabelMap === 'function') {
      const map = getLaneLabelMap();
      if (map != null) {
        const labels = Array.from(map.values()).join(',');
        markAndClear(`--react-lane-labels-${labels}`);
      }
    }
  }

  function markCommitStarted(lanes: Lanes): void {
    if (supportsUserTimingV3) {
      markAndClear(`--commit-start-${lanes}`);

      // Certain types of metadata should be logged infrequently.
      // Normally we would log this during module init,
      // but there's no guarantee a user is profiling at that time.
      // Commits happen infrequently (less than renders or state updates)
      // so we log this extra information along with a commit.
      // It will likely be logged more than once but that's okay.
      //
      // TODO (timeline) Only log this once, when profiling starts.
      // For the first phase– refactoring– we'll match the previous behavior.
      markMetadata();
    }
  }

  function markCommitStopped(): void {
    if (supportsUserTimingV3) {
      markAndClear('--commit-stop');
    }
  }

  function markComponentRenderStarted(fiber: Fiber): void {
    if (supportsUserTimingV3) {
      const componentName = getDisplayNameForFiber(fiber) || 'Unknown';
      // TODO (timeline) Record and cache component stack
      markAndClear(`--component-render-start-${componentName}`);
    }
  }

  function markComponentRenderStopped(): void {
    if (supportsUserTimingV3) {
      markAndClear('--component-render-stop');
    }
  }

  function markComponentPassiveEffectMountStarted(fiber: Fiber): void {
    if (supportsUserTimingV3) {
      const componentName = getDisplayNameForFiber(fiber) || 'Unknown';
      // TODO (timeline) Record and cache component stack
      markAndClear(`--component-passive-effect-mount-start-${componentName}`);
    }
  }

  function markComponentPassiveEffectMountStopped(): void {
    if (supportsUserTimingV3) {
      markAndClear('--component-passive-effect-mount-stop');
    }
  }

  function markComponentPassiveEffectUnmountStarted(fiber: Fiber): void {
    if (supportsUserTimingV3) {
      const componentName = getDisplayNameForFiber(fiber) || 'Unknown';
      // TODO (timeline) Record and cache component stack
      markAndClear(`--component-passive-effect-unmount-start-${componentName}`);
    }
  }

  function markComponentPassiveEffectUnmountStopped(): void {
    if (supportsUserTimingV3) {
      markAndClear('--component-passive-effect-unmount-stop');
    }
  }

  function markComponentLayoutEffectMountStarted(fiber: Fiber): void {
    if (supportsUserTimingV3) {
      const componentName = getDisplayNameForFiber(fiber) || 'Unknown';
      // TODO (timeline) Record and cache component stack
      markAndClear(`--component-layout-effect-mount-start-${componentName}`);
    }
  }

  function markComponentLayoutEffectMountStopped(): void {
    if (supportsUserTimingV3) {
      markAndClear('--component-layout-effect-mount-stop');
    }
  }

  function markComponentLayoutEffectUnmountStarted(fiber: Fiber): void {
    if (supportsUserTimingV3) {
      const componentName = getDisplayNameForFiber(fiber) || 'Unknown';
      // TODO (timeline) Record and cache component stack
      markAndClear(`--component-layout-effect-unmount-start-${componentName}`);
    }
  }

  function markComponentLayoutEffectUnmountStopped(): void {
    if (supportsUserTimingV3) {
      markAndClear('--component-layout-effect-unmount-stop');
    }
  }

  function markComponentErrored(
    fiber: Fiber,
    thrownValue: mixed,
    lanes: Lanes,
  ): void {
    if (supportsUserTimingV3) {
      const componentName = getDisplayNameForFiber(fiber) || 'Unknown';
      const phase = fiber.alternate === null ? 'mount' : 'update';

      let message = '';
      if (
        thrownValue !== null &&
        typeof thrownValue === 'object' &&
        typeof thrownValue.message === 'string'
      ) {
        message = thrownValue.message;
      } else if (typeof thrownValue === 'string') {
        message = thrownValue;
      }

      // TODO (timeline) Record and cache component stack
      markAndClear(`--error-${componentName}-${phase}-${message}`);
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

  function markComponentSuspended(
    fiber: Fiber,
    wakeable: Wakeable,
    lanes: Lanes,
  ): void {
    if (supportsUserTimingV3) {
      const eventType = wakeableIDs.has(wakeable) ? 'resuspend' : 'suspend';
      const id = getWakeableID(wakeable);
      const componentName = getDisplayNameForFiber(fiber) || 'Unknown';
      const phase = fiber.alternate === null ? 'mount' : 'update';

      // Following the non-standard fn.displayName convention,
      // frameworks like Relay may also annotate Promises with a displayName,
      // describing what operation/data the thrown Promise is related to.
      // When this is available we should pass it along to the Timeline.
      const displayName = (wakeable: any).displayName || '';

      // TODO (timeline) Record and cache component stack
      markAndClear(
        `--suspense-${eventType}-${id}-${componentName}-${phase}-${lanes}-${displayName}`,
      );
      wakeable.then(
        () => markAndClear(`--suspense-resolved-${id}-${componentName}`),
        () => markAndClear(`--suspense-rejected-${id}-${componentName}`),
      );
    }
  }

  function markLayoutEffectsStarted(lanes: Lanes): void {
    if (supportsUserTimingV3) {
      markAndClear(`--layout-effects-start-${lanes}`);
    }
  }

  function markLayoutEffectsStopped(): void {
    if (supportsUserTimingV3) {
      markAndClear('--layout-effects-stop');
    }
  }

  function markPassiveEffectsStarted(lanes: Lanes): void {
    if (supportsUserTimingV3) {
      markAndClear(`--passive-effects-start-${lanes}`);
    }
  }

  function markPassiveEffectsStopped(): void {
    if (supportsUserTimingV3) {
      markAndClear('--passive-effects-stop');
    }
  }

  function markRenderStarted(lanes: Lanes): void {
    if (supportsUserTimingV3) {
      markAndClear(`--render-start-${lanes}`);
    }
  }

  function markRenderYielded(): void {
    if (supportsUserTimingV3) {
      markAndClear('--render-yield');
    }
  }

  function markRenderStopped(): void {
    if (supportsUserTimingV3) {
      markAndClear('--render-stop');
    }
  }

  function markRenderScheduled(lane: Lane): void {
    if (supportsUserTimingV3) {
      markAndClear(`--schedule-render-${lane}`);
    }
  }

  function markForceUpdateScheduled(fiber: Fiber, lane: Lane): void {
    if (supportsUserTimingV3) {
      const componentName = getDisplayNameForFiber(fiber) || 'Unknown';
      // TODO (timeline) Record and cache component stack
      markAndClear(`--schedule-forced-update-${lane}-${componentName}`);
    }
  }

  function markStateUpdateScheduled(fiber: Fiber, lane: Lane): void {
    if (supportsUserTimingV3) {
      const componentName = getDisplayNameForFiber(fiber) || 'Unknown';
      // TODO (timeline) Record and cache component stack
      markAndClear(`--schedule-state-update-${lane}-${componentName}`);
    }
  }

  return {
    markCommitStarted,
    markCommitStopped,
    markComponentRenderStarted,
    markComponentRenderStopped,
    markComponentPassiveEffectMountStarted,
    markComponentPassiveEffectMountStopped,
    markComponentPassiveEffectUnmountStarted,
    markComponentPassiveEffectUnmountStopped,
    markComponentLayoutEffectMountStarted,
    markComponentLayoutEffectMountStopped,
    markComponentLayoutEffectUnmountStarted,
    markComponentLayoutEffectUnmountStopped,
    markComponentErrored,
    markComponentSuspended,
    markLayoutEffectsStarted,
    markLayoutEffectsStopped,
    markPassiveEffectsStarted,
    markPassiveEffectsStopped,
    markRenderStarted,
    markRenderYielded,
    markRenderStopped,
    markRenderScheduled,
    markForceUpdateScheduled,
    markStateUpdateScheduled,
  };
}
