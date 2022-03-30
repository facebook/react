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
import type {LaneToLabelMap} from 'react-devtools-timeline/src/types';
import type {RecordComponentSuspendedCallback} from 'react-devtools-timeline/src/TimelineData';

import TimelineData from 'react-devtools-timeline/src/TimelineData';
import isArray from 'shared/isArray';
import {
  REACT_TOTAL_NUM_LANES,
  SCHEDULING_PROFILER_VERSION,
} from 'react-devtools-timeline/src/constants';

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

// Some environments (e.g. React Native / Hermes) don't support the performance API yet.
const getCurrentTime =
  typeof performance === 'object' && typeof performance.now === 'function'
    ? () => performance.now()
    : () => Date.now();

// Mocking the Performance Object (and User Timing APIs) for testing is fragile.
// This API allows tests to directly override the User Timing APIs.
export function setPerformanceMock_ONLY_FOR_TESTING(
  performanceMock: Performance | null,
) {
  performanceTarget = performanceMock;
  supportsUserTiming = performanceMock !== null;
  supportsUserTimingV3 = performanceMock !== null;
}

export type GetTimelineData = () => TimelineData | null;
export type ToggleProfilingStatus = (value: boolean) => void;

type Response = {|
  getTimelineData: GetTimelineData,
  profilingHooks: DevToolsProfilingHooks,
  toggleProfilingStatus: ToggleProfilingStatus,
|};

export function createProfilingHooks({
  getDisplayNameForFiber,
  getIsProfiling,
  getLaneLabelMap,
  reactVersion,
}: {|
  getDisplayNameForFiber: (fiber: Fiber) => string | null,
  getIsProfiling: () => boolean,
  getLaneLabelMap?: () => Map<Lane, string> | null,
  reactVersion: string,
|}): Response {
  let currentTimelineData: TimelineData | null = null;
  let isProfiling: boolean = false;

  const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;

  // $FlowFixMe: Flow cannot handle polymorphic WeakMaps
  const wakeableIDs: WeakMap<Wakeable, number> = new PossiblyWeakMap();
  let wakeableIDCounter: number = 0;
  function getWakeableID(wakeable: Wakeable): number {
    if (!wakeableIDs.has(wakeable)) {
      wakeableIDs.set(wakeable, wakeableIDCounter++);
    }
    return ((wakeableIDs.get(wakeable): any): number);
  }

  function getInternalModuleRanges() {
    /* global __REACT_DEVTOOLS_GLOBAL_HOOK__ */
    if (
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.getInternalModuleRanges ===
        'function'
    ) {
      // Ask the DevTools hook for module ranges that may have been reported by the current renderer(s).
      // Don't do this eagerly like the laneToLabelMap,
      // because some modules might not yet have registered their boundaries when the renderer is injected.
      const ranges = __REACT_DEVTOOLS_GLOBAL_HOOK__.getInternalModuleRanges();

      // This check would not be required,
      // except that it's possible for things to override __REACT_DEVTOOLS_GLOBAL_HOOK__.
      if (isArray(ranges)) {
        return ranges;
      }
    }

    return null;
  }

  function getTimelineData(): TimelineData | null {
    return currentTimelineData;
  }

  function laneToLanesArray(lanes: Lane) {
    const lanesArray = [];

    let lane = 1;
    for (let index = 0; index < REACT_TOTAL_NUM_LANES; index++) {
      if (lane & lanes) {
        lanesArray.push(lane);
      }
      lane *= 2;
    }

    return lanesArray;
  }

  const laneToLabelMap: LaneToLabelMap | null =
    typeof getLaneLabelMap === 'function' ? getLaneLabelMap() : null;

  function markMetadata() {
    markAndClear(`--react-version-${reactVersion}`);
    markAndClear(`--profiler-version-${SCHEDULING_PROFILER_VERSION}`);

    const ranges = getInternalModuleRanges();
    if (ranges) {
      for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        if (isArray(range) && range.length === 2) {
          const [startStackFrame, stopStackFrame] = ranges[i];

          markAndClear(`--react-internal-module-start-${startStackFrame}`);
          markAndClear(`--react-internal-module-stop-${stopStackFrame}`);
        }
      }
    }

    if (laneToLabelMap != null) {
      const labels = Array.from(laneToLabelMap.values()).join(',');
      markAndClear(`--react-lane-labels-${labels}`);
    }
  }

  function markAndClear(markName) {
    // This method won't be called unless these functions are defined, so we can skip the extra typeof check.
    ((performanceTarget: any): Performance).mark(markName);
    ((performanceTarget: any): Performance).clearMarks(markName);
  }

  function markCommitStarted(lanes: Lanes): void {
    if (isProfiling && currentTimelineData) {
      currentTimelineData.recordCommitStarted(
        laneToLanesArray(lanes),
        getCurrentTime(),
      );
    }

    if (supportsUserTimingV3) {
      markAndClear(`--commit-start-${lanes}`);

      // Some metadata only needs to be logged once per session,
      // but if profiling information is being recorded via the Performance tab,
      // DevTools has no way of knowing when the recording starts.
      // Because of that, we log thie type of data periodically (once per commit).
      markMetadata();
    }
  }

  function markCommitStopped(): void {
    if (isProfiling && currentTimelineData) {
      currentTimelineData.recordCommitStopped(getCurrentTime());
    }

    if (supportsUserTimingV3) {
      markAndClear('--commit-stop');
    }
  }

  function markComponentRenderStarted(fiber: Fiber): void {
    if ((isProfiling && currentTimelineData) || supportsUserTimingV3) {
      const componentName = getDisplayNameForFiber(fiber) || 'Unknown';

      if (isProfiling && currentTimelineData) {
        currentTimelineData.recordComponentRenderStarted(
          fiber,
          componentName,
          getCurrentTime(),
        );
      }

      if (supportsUserTimingV3) {
        markAndClear(`--component-render-start-${componentName}`);
      }
    }
  }

  function markComponentRenderStopped(): void {
    if (isProfiling && currentTimelineData) {
      currentTimelineData.recordComponentRenderStopped(getCurrentTime());
    }

    if (supportsUserTimingV3) {
      markAndClear('--component-render-stop');
    }
  }

  function markComponentLayoutEffectMountStarted(fiber: Fiber): void {
    if ((isProfiling && currentTimelineData) || supportsUserTimingV3) {
      const componentName = getDisplayNameForFiber(fiber) || 'Unknown';

      if (isProfiling && currentTimelineData) {
        currentTimelineData.recordComponentLayoutEffectMountStarted(
          fiber,
          componentName,
          getCurrentTime(),
        );
      }

      if (supportsUserTimingV3) {
        markAndClear(`--component-layout-effect-mount-start-${componentName}`);
      }
    }
  }

  function markComponentLayoutEffectMountStopped(): void {
    if (isProfiling && currentTimelineData) {
      currentTimelineData.recordComponentLayoutEffectMountStopped(
        getCurrentTime(),
      );
    }

    if (supportsUserTimingV3) {
      markAndClear('--component-layout-effect-mount-stop');
    }
  }

  function markComponentLayoutEffectUnmountStarted(fiber: Fiber): void {
    if ((isProfiling && currentTimelineData) || supportsUserTimingV3) {
      const componentName = getDisplayNameForFiber(fiber) || 'Unknown';

      if (isProfiling && currentTimelineData) {
        currentTimelineData.recordComponentLayoutEffectUnmountStarted(
          fiber,
          componentName,
          getCurrentTime(),
        );
      }

      if (supportsUserTimingV3) {
        markAndClear(
          `--component-layout-effect-unmount-start-${componentName}`,
        );
      }
    }
  }

  function markComponentLayoutEffectUnmountStopped(): void {
    if (isProfiling && currentTimelineData) {
      currentTimelineData.recordComponentLayoutEffectUnmountStopped(
        getCurrentTime(),
      );
    }

    if (supportsUserTimingV3) {
      markAndClear('--component-layout-effect-unmount-stop');
    }
  }

  function markComponentPassiveEffectMountStarted(fiber: Fiber): void {
    if ((isProfiling && currentTimelineData) || supportsUserTimingV3) {
      const componentName = getDisplayNameForFiber(fiber) || 'Unknown';

      if (isProfiling && currentTimelineData) {
        currentTimelineData.recordComponentPassiveEffectMountStarted(
          fiber,
          componentName,
          getCurrentTime(),
        );
      }

      if (supportsUserTimingV3) {
        markAndClear(`--component-passive-effect-mount-start-${componentName}`);
      }
    }
  }

  function markComponentPassiveEffectMountStopped(): void {
    if (isProfiling && currentTimelineData) {
      currentTimelineData.recordComponentPassiveEffectMountStopped(
        getCurrentTime(),
      );
    }

    if (supportsUserTimingV3) {
      markAndClear('--component-passive-effect-mount-stop');
    }
  }

  function markComponentPassiveEffectUnmountStarted(fiber: Fiber): void {
    if ((isProfiling && currentTimelineData) || supportsUserTimingV3) {
      const componentName = getDisplayNameForFiber(fiber) || 'Unknown';

      if (isProfiling && currentTimelineData) {
        currentTimelineData.recordComponentPassiveEffectUnmountStarted(
          fiber,
          componentName,
          getCurrentTime(),
        );
      }

      if (supportsUserTimingV3) {
        markAndClear(
          `--component-passive-effect-unmount-start-${componentName}`,
        );
      }
    }
  }

  function markComponentPassiveEffectUnmountStopped(): void {
    if (isProfiling && currentTimelineData) {
      currentTimelineData.recordComponentPassiveEffectUnmountStopped(
        getCurrentTime(),
      );
    }

    if (supportsUserTimingV3) {
      markAndClear('--component-passive-effect-unmount-stop');
    }
  }

  function markComponentErrored(
    fiber: Fiber,
    thrownValue: mixed,
    lanes: Lanes,
  ): void {
    if ((isProfiling && currentTimelineData) || supportsUserTimingV3) {
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

      if (isProfiling && currentTimelineData) {
        currentTimelineData.recordComponentErrored(
          fiber,
          message,
          phase,
          laneToLanesArray(lanes),
          getDisplayNameForFiber(fiber) || 'Unknown',
          getCurrentTime(),
        );
      }

      if (supportsUserTimingV3) {
        markAndClear(`--error-${componentName}-${phase}-${message}`);
      }
    }
  }

  function markComponentSuspended(
    fiber: Fiber,
    wakeable: Wakeable,
    lanes: Lanes,
  ): void {
    if ((isProfiling && currentTimelineData) || supportsUserTimingV3) {
      const componentName = getDisplayNameForFiber(fiber) || 'Unknown';
      const phase = fiber.alternate === null ? 'mount' : 'update';

      // Following the non-standard fn.displayName convention,
      // frameworks like Relay may also annotate Promises with a displayName,
      // describing what operation/data the thrown Promise is related to.
      // When this is available we should pass it along to the Timeline.
      const wakeableDisplayName = (wakeable: any).displayName || '';

      const eventType = wakeableIDs.has(wakeable) ? 'resuspend' : 'suspend';
      const wakeableID = getWakeableID(wakeable);

      let resolveOrRejectCallback: RecordComponentSuspendedCallback | null = null;

      if (isProfiling && currentTimelineData) {
        resolveOrRejectCallback = currentTimelineData.recordComponentSuspended(
          fiber,
          componentName,
          phase,
          wakeableID,
          wakeableDisplayName,
          laneToLanesArray(lanes),
          getCurrentTime(),
        );
      }

      if (supportsUserTimingV3) {
        markAndClear(
          `--suspense-${eventType}-${wakeableID}-${componentName}-${phase}-${lanes}-${wakeableDisplayName}`,
        );
      }

      wakeable.then(
        () => {
          if (resolveOrRejectCallback !== null) {
            resolveOrRejectCallback('resolved', getCurrentTime());
          }

          if (supportsUserTimingV3) {
            markAndClear(`--suspense-resolved-${wakeableID}-${componentName}`);
          }
        },
        () => {
          if (resolveOrRejectCallback !== null) {
            resolveOrRejectCallback('rejected', getCurrentTime());
          }

          if (supportsUserTimingV3) {
            markAndClear(`--suspense-rejected-${wakeableID}-${componentName}`);
          }
        },
      );
    }
  }

  function markLayoutEffectsStarted(lanes: Lanes): void {
    if (isProfiling && currentTimelineData) {
      currentTimelineData.recordLayoutEffectsStarted(
        laneToLanesArray(lanes),
        getCurrentTime(),
      );
    }

    if (supportsUserTimingV3) {
      markAndClear(`--layout-effects-start-${lanes}`);
    }
  }

  function markLayoutEffectsStopped(): void {
    if (isProfiling && currentTimelineData) {
      currentTimelineData.recordLayoutEffectsStopped(getCurrentTime());
    }

    if (supportsUserTimingV3) {
      markAndClear('--layout-effects-stop');
    }
  }

  function markPassiveEffectsStarted(lanes: Lanes): void {
    if (isProfiling && currentTimelineData) {
      currentTimelineData.recordPassiveEffectsStarted(
        laneToLanesArray(lanes),
        getCurrentTime(),
      );
    }

    if (supportsUserTimingV3) {
      markAndClear(`--passive-effects-start-${lanes}`);
    }
  }

  function markPassiveEffectsStopped(): void {
    if (isProfiling && currentTimelineData) {
      currentTimelineData.recordPassiveEffectsStopped(getCurrentTime());
    }

    if (supportsUserTimingV3) {
      markAndClear('--passive-effects-stop');
    }
  }

  function markRenderStarted(lanes: Lanes): void {
    if (isProfiling && currentTimelineData) {
      currentTimelineData.recordRenderStarted(
        laneToLanesArray(lanes),
        getCurrentTime(),
      );
    }

    if (supportsUserTimingV3) {
      markAndClear(`--render-start-${lanes}`);
    }
  }

  function markRenderYielded(): void {
    if (isProfiling && currentTimelineData) {
      currentTimelineData.recordRenderYielded(getCurrentTime());
    }

    if (supportsUserTimingV3) {
      markAndClear('--render-yield');
    }
  }

  function markRenderStopped(): void {
    if (isProfiling && currentTimelineData) {
      currentTimelineData.recordRenderStopped(getCurrentTime());
    }

    if (supportsUserTimingV3) {
      markAndClear('--render-stop');
    }
  }

  function markRenderScheduled(lane: Lane): void {
    if (isProfiling && currentTimelineData) {
      currentTimelineData.recordRenderScheduled(
        laneToLanesArray(lane),
        getCurrentTime(),
      );
    }

    if (supportsUserTimingV3) {
      markAndClear(`--schedule-render-${lane}`);
    }
  }

  function markForceUpdateScheduled(fiber: Fiber, lane: Lane): void {
    if ((isProfiling && currentTimelineData) || supportsUserTimingV3) {
      const componentName = getDisplayNameForFiber(fiber) || 'Unknown';

      if (isProfiling && currentTimelineData) {
        currentTimelineData.recordForceUpdateScheduled(
          fiber,
          componentName,
          laneToLanesArray(lane),
          getCurrentTime(),
        );
      }

      if (supportsUserTimingV3) {
        markAndClear(`--schedule-forced-update-${lane}-${componentName}`);
      }
    }
  }

  function markStateUpdateScheduled(fiber: Fiber, lane: Lane): void {
    if ((isProfiling && currentTimelineData) || supportsUserTimingV3) {
      const componentName = getDisplayNameForFiber(fiber) || 'Unknown';

      if (isProfiling && currentTimelineData) {
        currentTimelineData.recordStateUpdateScheduled(
          fiber,
          componentName,
          laneToLanesArray(lane),
          getCurrentTime(),
        );
      }

      if (supportsUserTimingV3) {
        markAndClear(`--schedule-state-update-${lane}-${componentName}`);
      }
    }
  }

  function toggleProfilingStatus(value: boolean) {
    if (isProfiling !== value) {
      isProfiling = value;

      if (isProfiling) {
        if (supportsUserTimingV3) {
          const ranges = getInternalModuleRanges();
          if (ranges) {
            for (let i = 0; i < ranges.length; i++) {
              const range = ranges[i];
              if (isArray(range) && range.length === 2) {
                const [startStackFrame, stopStackFrame] = ranges[i];

                markAndClear(
                  `--react-internal-module-start-${startStackFrame}`,
                );
                markAndClear(`--react-internal-module-stop-${stopStackFrame}`);
              }
            }
          }
        }

        currentTimelineData = new TimelineData(
          laneToLabelMap,
          reactVersion,
          getCurrentTime(),
        );
      }
    }
  }

  return {
    getTimelineData,
    profilingHooks: {
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
    },
    toggleProfilingStatus,
  };
}
