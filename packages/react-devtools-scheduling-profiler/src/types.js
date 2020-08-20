/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Type utilities

// Source: https://github.com/facebook/flow/issues/4002#issuecomment-323612798
// eslint-disable-next-line no-unused-vars
type Return_<R, F: (...args: Array<any>) => R> = R;
/** Get return type of a function. */
export type Return<T> = Return_<*, T>;

// Project types

export type Milliseconds = number;

export type ReactLane = number;

type BaseReactEvent = {|
  +componentName?: string,
  +componentStack?: string,
  +timestamp: Milliseconds,
|};

type BaseReactScheduleEvent = {|
  ...BaseReactEvent,
  +lanes: ReactLane[],
|};
export type ReactScheduleRenderEvent = {|
  ...BaseReactScheduleEvent,
  type: 'schedule-render',
|};
export type ReactScheduleStateUpdateEvent = {|
  ...BaseReactScheduleEvent,
  type: 'schedule-state-update',
  isCascading: boolean,
|};
export type ReactScheduleForceUpdateEvent = {|
  ...BaseReactScheduleEvent,
  type: 'schedule-force-update',
  isCascading: boolean,
|};

type BaseReactSuspenseEvent = {|
  ...BaseReactEvent,
  id: string,
|};
export type ReactSuspenseSuspendEvent = {|
  ...BaseReactSuspenseEvent,
  type: 'suspense-suspend',
|};
export type ReactSuspenseResolvedEvent = {|
  ...BaseReactSuspenseEvent,
  type: 'suspense-resolved',
|};
export type ReactSuspenseRejectedEvent = {|
  ...BaseReactSuspenseEvent,
  type: 'suspense-rejected',
|};

export type ReactEvent =
  | ReactScheduleRenderEvent
  | ReactScheduleStateUpdateEvent
  | ReactScheduleForceUpdateEvent
  | ReactSuspenseSuspendEvent
  | ReactSuspenseResolvedEvent
  | ReactSuspenseRejectedEvent;
export type ReactEventType = $PropertyType<ReactEvent, 'type'>;

export type ReactMeasureType =
  | 'commit'
  // render-idle: A measure spanning the time when a render starts, through all
  // yields and restarts, and ends when commit stops OR render is cancelled.
  | 'render-idle'
  | 'render'
  | 'layout-effects'
  | 'passive-effects';

export type BatchUID = number;

export type ReactMeasure = {|
  +type: ReactMeasureType,
  +lanes: ReactLane[],
  +timestamp: Milliseconds,
  +duration: Milliseconds,
  +batchUID: BatchUID,
  +depth: number,
|};

/**
 * A flamechart stack frame belonging to a stack trace.
 */
export type FlamechartStackFrame = {|
  name: string,
  timestamp: Milliseconds,
  duration: Milliseconds,
  scriptUrl?: string,
  locationLine?: number,
  locationColumn?: number,
|};

export type UserTimingMark = {|
  name: string,
  timestamp: Milliseconds,
|};

/**
 * A "layer" of stack frames in the profiler UI, i.e. all stack frames of the
 * same depth across all stack traces. Displayed as a flamechart row in the UI.
 */
export type FlamechartStackLayer = FlamechartStackFrame[];

export type Flamechart = FlamechartStackLayer[];

export type ReactProfilerData = {|
  startTime: number,
  duration: number,
  events: ReactEvent[],
  measures: ReactMeasure[],
  flamechart: Flamechart,
  otherUserTimingMarks: UserTimingMark[],
|};

export type ReactHoverContextInfo = {|
  event: ReactEvent | null,
  measure: ReactMeasure | null,
  data: $ReadOnly<ReactProfilerData> | null,
  flamechartStackFrame: FlamechartStackFrame | null,
  userTimingMark: UserTimingMark | null,
|};
