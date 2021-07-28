/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export const LABEL_SIZE = 80;
export const MARKER_HEIGHT = 20;
export const MARKER_TICK_HEIGHT = 8;
export const FONT_SIZE = 10;
export const MARKER_TEXT_PADDING = 8;
export const COLOR_HOVER_DIM_DELTA = 5;
export const TOP_ROW_PADDING = 4;
export const NATIVE_EVENT_HEIGHT = 14;
export const REACT_EVENT_DIAMETER = 6;
export const USER_TIMING_MARK_SIZE = 8;
export const REACT_MEASURE_HEIGHT = 9;
export const BORDER_SIZE = 1;
export const FLAMECHART_FRAME_HEIGHT = 14;
export const TEXT_PADDING = 3;

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

// TODO Replace this with "export let" vars
export let COLORS = {
  BACKGROUND: '',
  NATIVE_EVENT: '',
  NATIVE_EVENT_HOVER: '',
  PRIORITY_BACKGROUND: '',
  PRIORITY_BORDER: '',
  PRIORITY_LABEL: '',
  USER_TIMING: '',
  USER_TIMING_HOVER: '',
  REACT_IDLE: '',
  REACT_IDLE_HOVER: '',
  REACT_RENDER: '',
  REACT_RENDER_HOVER: '',
  REACT_COMMIT: '',
  REACT_COMMIT_HOVER: '',
  REACT_LAYOUT_EFFECTS: '',
  REACT_LAYOUT_EFFECTS_HOVER: '',
  REACT_PASSIVE_EFFECTS: '',
  REACT_PASSIVE_EFFECTS_HOVER: '',
  REACT_RESIZE_BAR: '',
  REACT_RESOLVE: '',
  REACT_RESOLVE_HOVER: '',
  REACT_SCHEDULE: '',
  REACT_SCHEDULE_HOVER: '',
  REACT_SUSPEND: '',
  REACT_SUSPEND_HOVER: '',
  REACT_WORK_BORDER: '',
  TEXT_COLOR: '',
  TIME_MARKER_LABEL: '',
  WARNING_BACKGROUND: '',
  WARNING_BACKGROUND_HOVER: '',
  WARNING_TEXT: '',
  WARNING_TEXT_INVERED: '',
};

export function updateColorsToMatchTheme(): void {
  const computedStyle = getComputedStyle((document.body: any));

  COLORS = {
    BACKGROUND: computedStyle.getPropertyValue('--color-background'),
    NATIVE_EVENT: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-native-event',
    ),
    NATIVE_EVENT_HOVER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-native-event-hover',
    ),
    PRIORITY_BACKGROUND: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-priority-background',
    ),
    PRIORITY_BORDER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-priority-border',
    ),
    PRIORITY_LABEL: computedStyle.getPropertyValue('--color-text'),
    USER_TIMING: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-user-timing',
    ),
    USER_TIMING_HOVER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-user-timing-hover',
    ),
    REACT_IDLE: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-idle',
    ),
    REACT_IDLE_HOVER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-idle-hover',
    ),
    REACT_RENDER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-render',
    ),
    REACT_RENDER_HOVER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-render-hover',
    ),
    REACT_COMMIT: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-commit',
    ),
    REACT_COMMIT_HOVER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-commit-hover',
    ),
    REACT_LAYOUT_EFFECTS: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-layout-effects',
    ),
    REACT_LAYOUT_EFFECTS_HOVER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-layout-effects-hover',
    ),
    REACT_PASSIVE_EFFECTS: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-passive-effects',
    ),
    REACT_PASSIVE_EFFECTS_HOVER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-passive-effects-hover',
    ),
    REACT_RESIZE_BAR: computedStyle.getPropertyValue('--color-resize-bar'),
    REACT_RESOLVE: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-resolve',
    ),
    REACT_RESOLVE_HOVER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-resolve-hover',
    ),
    REACT_SCHEDULE: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-schedule',
    ),
    REACT_SCHEDULE_HOVER: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-react-schedule-hover',
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
    TEXT_COLOR: computedStyle.getPropertyValue(
      '--color-scheduling-profiler-text-color',
    ),
    TIME_MARKER_LABEL: computedStyle.getPropertyValue('--color-text'),
    WARNING_BACKGROUND: computedStyle.getPropertyValue(
      '--color-warning-background',
    ),
    WARNING_BACKGROUND_HOVER: computedStyle.getPropertyValue(
      '--color-warning-background-hover',
    ),
    WARNING_TEXT: computedStyle.getPropertyValue('--color-warning-text-color'),
    WARNING_TEXT_INVERED: computedStyle.getPropertyValue(
      '--color-warning-text-color-inverted',
    ),
  };
}
