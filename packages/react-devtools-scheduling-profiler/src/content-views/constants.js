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

export const COLORS = Object.freeze({
  BACKGROUND: '#ffffff',
  PRIORITY_BACKGROUND: '#ededf0',
  PRIORITY_BORDER: '#d7d7db',
  PRIORITY_LABEL: '#272727',
  USER_TIMING: '#c9cacd',
  USER_TIMING_HOVER: '#93959a',
  REACT_IDLE: '#edf6ff',
  REACT_IDLE_SELECTED: '#EDF6FF',
  REACT_IDLE_HOVER: '#EDF6FF',
  REACT_RENDER: '#9fc3f3',
  REACT_RENDER_SELECTED: '#64A9F5',
  REACT_RENDER_HOVER: '#2683E2',
  REACT_COMMIT: '#ff718e',
  REACT_COMMIT_SELECTED: '#FF5277',
  REACT_COMMIT_HOVER: '#ed0030',
  REACT_LAYOUT_EFFECTS: '#c88ff0',
  REACT_LAYOUT_EFFECTS_SELECTED: '#934FC1',
  REACT_LAYOUT_EFFECTS_HOVER: '#601593',
  REACT_PASSIVE_EFFECTS: '#c88ff0',
  REACT_PASSIVE_EFFECTS_SELECTED: '#934FC1',
  REACT_PASSIVE_EFFECTS_HOVER: '#601593',
  REACT_SCHEDULE: '#9fc3f3',
  REACT_SCHEDULE_HOVER: '#2683E2',
  REACT_SCHEDULE_CASCADING: '#ff718e',
  REACT_SCHEDULE_CASCADING_HOVER: '#ed0030',
  REACT_SUSPEND: '#a6e59f',
  REACT_SUSPEND_HOVER: '#13bc00',
  REACT_WORK_BORDER: '#ffffff',
  TIME_MARKER_LABEL: '#18212b',
});
