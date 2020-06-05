// @flow

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
  unscheduled: ReactProfilerDataPriority,
  high: ReactProfilerDataPriority,
  normal: ReactProfilerDataPriority,
  low: ReactProfilerDataPriority,
|};

export type ReactHoverContextInfo = {|
  event: ReactEvent | null,
  measure: ReactMeasure | null,
  priorityIndex: number,
  reactProfilerData: ReactProfilerData,
  zeroAt: Milliseconds,
|};

export type FlamechartData = any;
