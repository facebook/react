/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from 'react-reconciler/src/ReactInternalTypes';
import type {
  BatchUID,
  Flamechart,
  InternalModuleSourceToRanges,
  LaneToLabelMap,
  NativeEvent,
  NetworkMeasure,
  Phase,
  ReactComponentMeasure,
  ReactComponentMeasureType,
  ReactLane,
  ReactMeasure,
  ReactMeasureType,
  SchedulingEvent,
  Snapshot,
  SuspenseEvent,
  SuspenseEventResolution,
  ThrownError,
  UserTimingMark,
} from 'react-devtools-timeline/src/types';

export type RecordComponentSuspendedCallback = (
  resolution: SuspenseEventResolution,
  currentTime: number,
) => void;

// Add padding to the start/stop time of the profile.
// This makes the UI nicer to use.
const TIME_OFFSET = 10;

// TODO (timeline) Handle data types from full Chrome profile.
export default class TimelineData {
  _currentBatchUID: BatchUID = 0;
  _currentReactComponentMeasure: ReactComponentMeasure | null = null;
  _currentReactMeasuresStack: Array<ReactMeasure> = [];
  _nextRenderShouldStartNewBatch: boolean = true;

  // Session wide metadata; only collected once.
  internalModuleSourceToRanges: InternalModuleSourceToRanges = new Map();
  laneToLabelMap: LaneToLabelMap;
  reactVersion: string;

  // Data logged by React during profiling session.
  componentMeasures: ReactComponentMeasure[] = [];
  schedulingEvents: SchedulingEvent[] = [];
  suspenseEvents: SuspenseEvent[] = [];
  thrownErrors: ThrownError[] = [];

  // Data inferred based on what React logs.
  batchUIDToMeasuresMap: Map<BatchUID, ReactMeasure[]> = new Map();
  duration: number = 0;
  laneToReactMeasureMap: Map<ReactLane, ReactMeasure[]> = new Map();
  startTime: number = 0;

  // Data only available in Chrome profiles.
  flamechart: Flamechart = [];
  nativeEvents: NativeEvent[] = [];
  networkMeasures: NetworkMeasure[] = [];
  otherUserTimingMarks: UserTimingMark[] = [];
  snapshots: Snapshot[] = [];
  snapshotHeight: number = 0;

  constructor(
    laneToLabelMap: LaneToLabelMap | null,
    reactVersion: string,
    currentTime: number,
  ) {
    this.laneToLabelMap = laneToLabelMap || new Map();
    this.reactVersion = reactVersion;
    this.startTime = currentTime - TIME_OFFSET;
  }

  recordCommitStarted(lanesArray: ReactLane[], currentTime: number): void {
    this._recordReactMeasureStarted('commit', lanesArray, currentTime);

    // TODO (timeline) Re-think this approach to "batching"; I don't think it works for Suspense or pre-rendering.
    // This issue applies to the User Timing data also.
    this._nextRenderShouldStartNewBatch = true;
  }

  recordCommitStopped(currentTime: number): void {
    this._recordReactMeasureStopped('commit', currentTime);
    this._recordReactMeasureStopped('render-idle', currentTime);
  }

  recordComponentRenderStarted(
    fiber: Fiber | null,
    componentName: string,
    currentTime: number,
  ): void {
    this._recordReactComponentMeasureStarted(
      'render',
      fiber,
      componentName,
      currentTime,
    );
  }

  recordComponentRenderStopped(currentTime: number): void {
    this._recordReactComponentMeasureStopped('render', currentTime);
  }

  recordComponentLayoutEffectMountStarted(
    fiber: Fiber | null,
    componentName: string,
    currentTime: number,
  ): void {
    this._recordReactComponentMeasureStarted(
      'layout-effect-mount',
      fiber,
      componentName,
      currentTime,
    );
  }

  recordComponentLayoutEffectMountStopped(currentTime: number): void {
    this._recordReactComponentMeasureStopped(
      'layout-effect-mount',
      currentTime,
    );
  }

  recordComponentLayoutEffectUnmountStarted(
    fiber: Fiber | null,
    componentName: string,
    currentTime: number,
  ): void {
    this._recordReactComponentMeasureStarted(
      'layout-effect-unmount',
      fiber,
      componentName,
      currentTime,
    );
  }

  recordComponentLayoutEffectUnmountStopped(currentTime: number): void {
    this._recordReactComponentMeasureStopped(
      'layout-effect-unmount',
      currentTime,
    );
  }

  recordComponentPassiveEffectMountStarted(
    fiber: Fiber | null,
    componentName: string,
    currentTime: number,
  ): void {
    this._recordReactComponentMeasureStarted(
      'passive-effect-mount',
      fiber,
      componentName,
      currentTime,
    );
  }

  recordComponentPassiveEffectMountStopped(currentTime: number): void {
    this._recordReactComponentMeasureStopped(
      'passive-effect-mount',
      currentTime,
    );
  }

  recordComponentPassiveEffectUnmountStarted(
    fiber: Fiber | null,
    componentName: string,
    currentTime: number,
  ): void {
    this._recordReactComponentMeasureStarted(
      'passive-effect-unmount',
      fiber,
      componentName,
      currentTime,
    );
  }

  recordComponentPassiveEffectUnmountStopped(currentTime: number): void {
    this._recordReactComponentMeasureStopped(
      'passive-effect-unmount',
      currentTime,
    );
  }

  recordComponentErrored(
    fiber: Fiber | null,
    message: string,
    phase: Phase,
    lanesArray: ReactLane[],
    componentName: string,
    currentTime: number,
  ): void {
    // TODO (timeline) Record and cache component stack

    this.thrownErrors.push({
      componentName,
      message,
      phase,
      timestamp: currentTime - this.startTime,
      type: 'thrown-error',
    });
  }

  recordComponentSuspended(
    fiber: Fiber | null,
    componentName: string,
    phase: Phase,
    wakeableID: number,
    wakeableDisplayName: string,
    lanesArray: ReactLane[],
    currentStartTime: number,
  ): RecordComponentSuspendedCallback {
    // TODO (timeline) Record and cache component stack

    const suspenseEvent: SuspenseEvent = {
      componentName,
      depth: 0,
      duration: 0,
      id: `${wakeableID}`,
      phase,
      promiseName: wakeableDisplayName,
      resolution: 'unresolved',
      timestamp: currentStartTime - this.startTime,
      type: 'suspense',
      warning: null,
    };

    this.suspenseEvents.push(suspenseEvent);

    return function resolveOrReject(
      resolution: SuspenseEventResolution,
      currentStopTime: number,
    ): void {
      suspenseEvent.duration = currentStopTime - currentStartTime;
      suspenseEvent.resolution = resolution;
    };
  }

  recordLayoutEffectsStarted(
    lanesArray: ReactLane[],
    currentTime: number,
  ): void {
    this._recordReactMeasureStarted('layout-effects', lanesArray, currentTime);
  }

  recordLayoutEffectsStopped(currentTime: number): void {
    this._recordReactMeasureStopped('layout-effects', currentTime);
  }

  recordPassiveEffectsStarted(
    lanesArray: ReactLane[],
    currentTime: number,
  ): void {
    this._recordReactMeasureStarted('passive-effects', lanesArray, currentTime);
  }

  recordPassiveEffectsStopped(currentTime: number): void {
    this._recordReactMeasureStopped('passive-effects', currentTime);
  }

  recordRenderStarted(lanesArray: ReactLane[], currentTime: number): void {
    if (this._nextRenderShouldStartNewBatch) {
      this._nextRenderShouldStartNewBatch = false;
      this._currentBatchUID++;
    }

    // If this is a new batch of work, wrap an "idle" measure around it.
    // Log it before the "render" measure to preserve the stack ordering.
    const top =
      this._currentReactMeasuresStack.length > 0
        ? this._currentReactMeasuresStack[
            this._currentReactMeasuresStack.length - 1
          ]
        : null;
    if (!top || top.type !== 'render-idle') {
      this._recordReactMeasureStarted('render-idle', lanesArray, currentTime);
    }

    this._recordReactMeasureStarted('render', lanesArray, currentTime);
  }

  recordRenderYielded(currentTime: number): void {
    this._recordReactMeasureStopped('render', currentTime);
  }

  recordRenderStopped(currentTime: number): void {
    this._recordReactMeasureStopped('render', currentTime);
  }

  recordRenderScheduled(lanesArray: ReactLane[], currentTime: number): void {
    this.schedulingEvents.push({
      lanes: lanesArray,
      timestamp: currentTime - this.startTime,
      type: 'schedule-render',
      warning: null,
    });
  }

  recordForceUpdateScheduled(
    fiber: Fiber | null,
    componentName: string,
    lanesArray: ReactLane[],
    currentTime: number,
  ): void {
    this.schedulingEvents.push({
      componentName,
      lanes: lanesArray,
      timestamp: currentTime - this.startTime,
      type: 'schedule-force-update',
      warning: null,
    });
  }

  recordStateUpdateScheduled(
    fiber: Fiber | null,
    componentName: string,
    lanesArray: ReactLane[],
    currentTime: number,
  ): void {
    this.schedulingEvents.push({
      componentName,
      lanes: lanesArray,
      timestamp: currentTime - this.startTime,
      type: 'schedule-state-update',
      warning: null,
    });
  }

  _recordReactComponentMeasureStarted(
    type: ReactComponentMeasureType,
    fiber: Fiber | null,
    componentName: string,
    currentTime: number,
  ): void {
    if (this._currentReactComponentMeasure) {
      console.warn(
        'React component measure started unexpected. Type "%s" incomplete.',
        this._currentReactComponentMeasure.type,
      );
    }

    // TODO (timeline) Record and cache component stack

    this._currentReactComponentMeasure = {
      componentName,
      duration: 0,
      timestamp: currentTime - this.startTime,
      type,
      warning: null,
    };
  }

  _recordReactComponentMeasureStopped(
    expectedType: ReactComponentMeasureType,
    currentTime: number,
  ): void {
    const reactComponentMeasure = this._currentReactComponentMeasure;

    this._currentReactComponentMeasure = null;

    if (reactComponentMeasure) {
      if (reactComponentMeasure.type !== expectedType) {
        console.warn(
          'React component measure completed unexpected. Type "%s" was expected but type "%s" was found.',
          expectedType,
          reactComponentMeasure.type,
        );
      } else {
        this.componentMeasures.push(reactComponentMeasure);

        const relativeTime = currentTime - this.startTime;

        reactComponentMeasure.duration =
          relativeTime - reactComponentMeasure.timestamp;
      }
    } else {
      console.warn(
        'React component measure completed unexpected. No measure found.',
      );
    }
  }

  _recordReactMeasureStarted(
    type: ReactMeasureType,
    lanesArray: ReactLane[],
    currentTime: number,
  ): void {
    // Decide what depth thi work should be rendered at, based on what's on the top of the stack.
    // It's okay to render over top of "idle" work but everything else should be on its own row.
    let depth = 0;
    if (this._currentReactMeasuresStack.length > 0) {
      const top = this._currentReactMeasuresStack[
        this._currentReactMeasuresStack.length - 1
      ];
      depth = top.type === 'render-idle' ? top.depth : top.depth + 1;
    }

    const reactMeasure: ReactMeasure = {
      type,
      batchUID: this._currentBatchUID,
      depth,
      lanes: lanesArray,
      timestamp: currentTime - this.startTime,
      duration: 0,
    };

    this._currentReactMeasuresStack.push(reactMeasure);

    let reactMeasures = this.batchUIDToMeasuresMap.get(this._currentBatchUID);
    if (reactMeasures != null) {
      reactMeasures.push(reactMeasure);
    } else {
      this.batchUIDToMeasuresMap.set(this._currentBatchUID, [reactMeasure]);
    }

    lanesArray.forEach(lane => {
      reactMeasures = this.laneToReactMeasureMap.get(lane);
      if (reactMeasures) {
        reactMeasures.push(reactMeasure);
      } else {
        this.laneToReactMeasureMap.set(lane, [reactMeasure]);
      }
    });
  }

  _recordReactMeasureStopped(
    type: ReactMeasureType,
    currentTime: number,
  ): void {
    if (this._currentReactMeasuresStack.length === 0) {
      console.error(
        'Unexpected type "%s" completed at %sms while React measures stack is empty.',
        type,
        currentTime,
      );
      // Ignore work "completion" user timing mark that doesn't complete anything
      return;
    }

    const top = this._currentReactMeasuresStack.pop();
    if (top.type !== type) {
      console.error(
        'Unexpected type "%s" completed at %sms before "%s" completed.',
        type,
        currentTime,
        top.type,
      );
    }

    const relativeTime = currentTime - this.startTime;

    // $FlowFixMe This property should not be writable outside of this function.
    top.duration = relativeTime - top.timestamp;

    this.duration = relativeTime + TIME_OFFSET;
  }
}
