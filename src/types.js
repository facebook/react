// @flow

import type {Flamechart, FlamechartFrame} from './speedscope/lib/flamechart';

// Type utilities

// Source: https://github.com/facebook/flow/issues/4002#issuecomment-323612798
type Return_<R, F: (...args: Array<any>) => R> = R;
/** Get return type of a function. */
export type Return<T> = Return_<*, T>;

// Project types

export type Milliseconds = number;

export type ReactPriority = 'unscheduled' | 'high' | 'normal' | 'low';

export type ReactEventType =
  | 'schedule-render'
  | 'schedule-state-update'
  | 'suspend';

export type ReactMeasureType =
  | 'commit'
  | 'render-idle'
  | 'render'
  | 'layout-effects'
  | 'passive-effects';

export type ReactEvent = {|
  +type: ReactEventType,
  +priority: ReactPriority,
  +timestamp: Milliseconds,
  +componentName?: string,
  +componentStack?: string,
  +isCascading?: boolean,
|};

export type BatchUID = number;

export type ReactMeasure = {|
  +type: ReactMeasureType,
  +priority: ReactPriority,
  +timestamp: Milliseconds,
  +duration: Milliseconds,
  +batchUID: BatchUID,
  +depth: number,
|};

export type ReactProfilerDataPriority = {|
  events: Array<ReactEvent>,
  measures: Array<ReactMeasure>,
  maxNestedMeasures: number,
|};

export type ReactProfilerData = {|
  startTime: number,
  duration: number,
  unscheduled: ReactProfilerDataPriority,
  high: ReactProfilerDataPriority,
  normal: ReactProfilerDataPriority,
  low: ReactProfilerDataPriority,
|};

export type ReactHoverContextInfo = {|
  event: ReactEvent | null,
  measure: ReactMeasure | null,
  priorityIndex: number | null,
  data: ReactProfilerData | null,
  flamechartNode: FlamechartFrame | null,
|};

export type FlamechartData = Flamechart;
