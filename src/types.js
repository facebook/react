// @flow

import type {Flamechart, FlamechartFrame} from './speedscope/lib/flamechart';

// Type utilities

// Source: https://github.com/facebook/flow/issues/4002#issuecomment-323612798
// eslint-disable-next-line no-unused-vars
type Return_<R, F: (...args: Array<any>) => R> = R;
/** Get return type of a function. */
export type Return<T> = Return_<*, T>;

// Project types

export type Milliseconds = number;

/** @deprecated */
export type ReactPriority = 'unscheduled' | 'high' | 'normal' | 'low';

/** @deprecated */
export type ReactEventType =
  | 'schedule-render'
  | 'schedule-state-update'
  | 'suspend';

export type ReactMeasureType =
  | 'commit'
  // render-idle: A measure spanning the time when a render starts, through all
  // yields and restarts, and ends when commit stops OR render is cancelled.
  | 'render-idle'
  | 'render'
  | 'layout-effects'
  | 'passive-effects';

/** @deprecated */
export type ReactEvent = {|
  +type: ReactEventType,
  +priority: ReactPriority,
  +timestamp: Milliseconds,
  +componentName?: string,
  +componentStack?: string,
  +isCascading?: boolean,
|};

export type BatchUID = number;

/** @deprecated */
export type ReactMeasure = {|
  +type: ReactMeasureType,
  +priority: ReactPriority,
  +timestamp: Milliseconds,
  +duration: Milliseconds,
  +batchUID: BatchUID,
  +depth: number,
|};

/** @deprecated */
export type ReactProfilerDataPriority = {|
  events: Array<ReactEvent>,
  measures: Array<ReactMeasure>,
  maxNestedMeasures: number,
|};

/** @deprecated */
export type ReactProfilerData = {|
  startTime: number,
  duration: number,
  unscheduled: ReactProfilerDataPriority,
  high: ReactProfilerDataPriority,
  normal: ReactProfilerDataPriority,
  low: ReactProfilerDataPriority,
|};

export type ReactHoverContextInfo = {|
  /** @deprecated */
  event: ReactEvent | null,
  /** @deprecated */
  measure: ReactMeasure | null,
  /** @deprecated */
  priorityIndex: number | null,
  /** @deprecated */
  data: $ReadOnly<ReactProfilerData> | null,
  flamechartNode: FlamechartFrame | null,
|};

export type FlamechartData = Flamechart;

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

export type ReactEventV2 =
  | ReactScheduleRenderEvent
  | ReactScheduleStateUpdateEvent
  | ReactScheduleForceUpdateEvent
  | ReactSuspenseSuspendEvent
  | ReactSuspenseResolvedEvent
  | ReactSuspenseRejectedEvent;
export type ReactEventTypeV2 = $PropertyType<ReactEventV2, 'type'>;

export type ReactMeasureV2 = {|
  +type: ReactMeasureType,
  +lanes: ReactLane[],
  +timestamp: Milliseconds,
  +duration: Milliseconds,
  +batchUID: BatchUID,
  +depth: number,
|};

export type ReactProfilerDataV2 = {|
  startTime: number,
  duration: number,
  events: ReactEventV2[],
  measures: ReactMeasureV2[],
|};
