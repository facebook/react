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

export type ReactMeasureType =
  | 'commit'
  // render-idle: A measure spanning the time when a render starts, through all
  // yields and restarts, and ends when commit stops OR render is cancelled.
  | 'render-idle'
  | 'render'
  | 'layout-effects'
  | 'passive-effects';

export type BatchUID = number;

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

export type ReactHoverContextInfo = {|
  event: ReactEventV2 | null,
  measure: ReactMeasureV2 | null,
  lane: ReactLane | null,
  data: $ReadOnly<ReactProfilerDataV2> | null,
  flamechartNode: FlamechartFrame | null,
|};

export type FlamechartData = Flamechart;
