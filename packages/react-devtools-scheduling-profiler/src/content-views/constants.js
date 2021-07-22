/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export const LABEL_SIZE = 80;
export const LABEL_FONT_SIZE = 11;
export const MARKER_HEIGHT = 20;
export const MARKER_TICK_HEIGHT = 8;
export const MARKER_FONT_SIZE = 10;
export const MARKER_TEXT_PADDING = 8;
export const COLOR_HOVER_DIM_DELTA = 5;

export const INTERVAL_TIMES = [
  1,
  2,
  5,
  10,
  20,
  50,
  100,
  200,
  500,
  1000,
  2000,
  5000,
];
export const MIN_INTERVAL_SIZE_PX = 70;

export const EVENT_ROW_PADDING = 4;
export const EVENT_DIAMETER = 6;
export const USER_TIMING_MARK_SIZE = 8;
export const REACT_MEASURE_HEIGHT = 9;
export const BORDER_SIZE = 1;

export const FLAMECHART_FONT_SIZE = 10;
export const FLAMECHART_FRAME_HEIGHT = 16;
export const FLAMECHART_TEXT_PADDING = 3;

// TODO Replace this with "export let" vars
export let COLORS = {
  BACKGROUND: '',
  PRIORITY_BACKGROUND: '',
  PRIORITY_BORDER: '',
  PRIORITY_LABEL: '',
  FLAME_GRAPH_LABEL: '',
  USER_TIMING: '',
  USER_TIMING_HOVER: '',
  REACT_IDLE: '',
  REACT_IDLE_SELECTED: '',
  REACT_IDLE_HOVER: '',
  REACT_RENDER: '',
  REACT_RENDER_SELECTED: '',
  REACT_RENDER_HOVER: '',
  REACT_COMMIT: '',
  REACT_COMMIT_SELECTED: '',
  REACT_COMMIT_HOVER: '',
  REACT_LAYOUT_EFFECTS: '',
  REACT_LAYOUT_EFFECTS_SELECTED: '',
  REACT_LAYOUT_EFFECTS_HOVER: '',
  REACT_PASSIVE_EFFECTS: '',
  REACT_PASSIVE_EFFECTS_SELECTED: '',
  REACT_PASSIVE_EFFECTS_HOVER: '',
  REACT_RESIZE_BAR: '',
  REACT_SCHEDULE: '',
  REACT_SCHEDULE_HOVER: '',
  REACT_SCHEDULE_CASCADING: '',
  REACT_SCHEDULE_CASCADING_HOVER: '',
  REACT_SUSPEND: '',
  REACT_SUSPEND_HOVER: '',
  REACT_WORK_BORDER: '',
  TIME_MARKER_LABEL: '',
};

export function updateColorsToMatchTheme(): void {
  const computedStyle = getComputedStyle((document.body: any));

  COLORS = {
    BACKGROUND: computedStyle.getPropertyValue('--color-background'),
    PRIORITY_BACKGROUND: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-priority-background',
    ),
    PRIORITY_BORDER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-priority-border',
    ),
    PRIORITY_LABEL: computedStyle.getPropertyValue('--color-text'),
    FLAME_GRAPH_LABEL: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-flame-graph-label',
    ),
    USER_TIMING: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-user-timing',
    ),
    USER_TIMING_HOVER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-user-timing-hover',
    ),
    REACT_IDLE: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-idle',
    ),
    REACT_IDLE_SELECTED: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-idle-selected',
    ),
    REACT_IDLE_HOVER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-idle-hover',
    ),
    REACT_RENDER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-render',
    ),
    REACT_RENDER_SELECTED: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-render-selected',
    ),
    REACT_RENDER_HOVER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-render-hover',
    ),
    REACT_COMMIT: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-commit',
    ),
    REACT_COMMIT_SELECTED: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-commit-selected',
    ),
    REACT_COMMIT_HOVER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-commit-hover',
    ),
    REACT_LAYOUT_EFFECTS: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-layout-effects',
    ),
    REACT_LAYOUT_EFFECTS_SELECTED: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-layout-effects-selected',
    ),
    REACT_LAYOUT_EFFECTS_HOVER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-layout-effects-hover',
    ),
    REACT_PASSIVE_EFFECTS: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-passive-effects',
    ),
    REACT_PASSIVE_EFFECTS_SELECTED: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-passive-effects-selected',
    ),
    REACT_PASSIVE_EFFECTS_HOVER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-passive-effects-hover',
    ),
    REACT_RESIZE_BAR: computedStyle.getPropertyValue('--color-resize-bar'),
    REACT_SCHEDULE: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-schedule',
    ),
    REACT_SCHEDULE_HOVER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-schedule-hover',
    ),
    REACT_SCHEDULE_CASCADING: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-schedule-cascading',
    ),
    REACT_SCHEDULE_CASCADING_HOVER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-schedule-cascading-hover',
    ),
    REACT_SUSPEND: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-suspend',
    ),
    REACT_SUSPEND_HOVER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-suspend-hover',
    ),
    REACT_WORK_BORDER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-work-border',
    ),
    TIME_MARKER_LABEL: computedStyle.getPropertyValue('--color-text'),
  };
}
