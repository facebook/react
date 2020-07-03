// @flow

import type {
  FlamechartData,
  ReactHoverContextInfo,
  ReactLane,
  ReactProfilerData,
} from '../types';
import type {PanAndZoomState} from '../util/usePanAndZoom';

import {
  durationToWidth,
  positionToTimestamp,
  timestampToPosition,
} from '../util/usePanAndZoom';
import {REACT_TOTAL_NUM_LANES} from '../constants';

import {getLaneHeight} from './canvasUtils';
import {
  HEADER_HEIGHT_FIXED,
  REACT_EVENT_SIZE,
  FLAMECHART_FRAME_HEIGHT,
  EVENT_ROW_HEIGHT_FIXED,
} from './constants';

/**
 * Returns a hover context info object containing the `ReactEvent` currently
 * being hovered over.
 *
 * NOTE: Assumes that the events are all in a row, and that the cursor is
 * already known to be in this row; this function only compares the X positions
 * of the cursor and events.
 */
function getHoveredReactEvent(
  data: $ReadOnly<ReactProfilerData>,
  panAndZoomState: PanAndZoomState,
): ReactHoverContextInfo | null {
  const {canvasMouseX} = panAndZoomState;
  const {events} = data;

  // Because data ranges may overlap, we want to find the last intersecting item.
  // This will always be the one on "top" (the one the user is hovering over).
  for (let index = events.length - 1; index >= 0; index--) {
    const event = events[index];
    const {timestamp} = event;

    const eventX = timestampToPosition(timestamp, panAndZoomState);
    const startX = eventX - REACT_EVENT_SIZE / 2;
    const stopX = eventX + REACT_EVENT_SIZE / 2;
    if (canvasMouseX >= startX && canvasMouseX <= stopX) {
      return {
        event,
        flamechartNode: null,
        measure: null,
        lane: null,
        data,
      };
    }
  }

  return null;
}

/**
 * Returns a hover context info object containing the `ReactMeasure` currently
 * being hovered over.
 */
function getHoveredReactMeasure(
  data: $ReadOnly<ReactProfilerData>,
  panAndZoomState: PanAndZoomState,
  stackSectionBaseY: number,
): ReactHoverContextInfo | null {
  const {canvasMouseX, canvasMouseY, offsetY} = panAndZoomState;

  // Identify the lane being hovered over
  const adjustedCanvasMouseY = canvasMouseY - stackSectionBaseY + offsetY;
  let laneMinY = 0;
  let lane = null;
  for (
    let laneIndex: ReactLane = 0;
    laneIndex < REACT_TOTAL_NUM_LANES;
    laneIndex++
  ) {
    const laneHeight = getLaneHeight(data, laneIndex);
    if (
      adjustedCanvasMouseY >= laneMinY &&
      adjustedCanvasMouseY <= laneMinY + laneHeight
    ) {
      lane = laneIndex;
      break;
    }
    laneMinY += laneHeight;
  }

  if (lane === null) {
    return null;
  }

  // Find the measure in `lane` being hovered over.
  //
  // Because data ranges may overlap, we want to find the last intersecting item.
  // This will always be the one on "top" (the one the user is hovering over).
  const {measures} = data;
  for (let index = measures.length - 1; index >= 0; index--) {
    const measure = measures[index];
    if (!measure.lanes.includes(lane)) {
      continue;
    }

    const {duration, timestamp} = measure;
    const pointerTime = positionToTimestamp(canvasMouseX, panAndZoomState);

    if (pointerTime >= timestamp && pointerTime <= timestamp + duration) {
      return {
        event: null,
        flamechartNode: null,
        measure,
        lane,
        data,
      };
    }
  }

  return null;
}

/**
 * Returns a hover context info object containing the `FlamechartFrame`
 * currently being hovered over.
 */
function getHoveredFlamechartEvent(
  data: $ReadOnly<ReactProfilerData>,
  flamechart: $ReadOnly<FlamechartData>,
  panAndZoomState: PanAndZoomState,
  stackSectionBaseY: number,
): ReactHoverContextInfo | null {
  const {canvasMouseX, canvasMouseY, offsetY} = panAndZoomState;

  const layerIndex = Math.floor(
    (canvasMouseY + offsetY - stackSectionBaseY) / FLAMECHART_FRAME_HEIGHT,
  );
  const layer = flamechart.layers[layerIndex];

  if (!layer) {
    return null;
  }

  let startIndex = 0;
  let stopIndex = layer.length - 1;
  while (startIndex <= stopIndex) {
    const currentIndex = Math.floor((startIndex + stopIndex) / 2);
    const flamechartNode = layer[currentIndex];

    const {end, start} = flamechartNode;

    const width = durationToWidth((end - start) / 1000, panAndZoomState);
    const x = Math.floor(timestampToPosition(start / 1000, panAndZoomState));

    if (x <= canvasMouseX && x + width >= canvasMouseX) {
      return {
        event: null,
        flamechartNode,
        measure: null,
        lane: null,
        data,
      };
    }

    if (x > canvasMouseX) {
      stopIndex = currentIndex - 1;
    } else {
      startIndex = currentIndex + 1;
    }
  }

  return null;
}

/**
 * Returns a hover context object if the cursor is hovering over a React
 * event/measure or a Flamechart node, otherwise returns null.
 */
export function getHoveredEvent(
  schedulerCanvasHeight: number,
  data: $ReadOnly<ReactProfilerData>,
  flamechart: $ReadOnly<FlamechartData>,
  panAndZoomState: PanAndZoomState,
): ReactHoverContextInfo | null {
  const {canvasMouseY, offsetY} = panAndZoomState;

  // These variables keep track of the current vertical stack sections' base and
  // max Y coordinates. For example, if we're at the React event row, these are
  // what the values represent:
  // ┌-----------------------------------
  // | t⁰    t¹    t²    ...
  // ├---------------------------------- <- stackSectionBaseY
  // |
  // | <events...>
  // |
  // ├---------------------------------- <- stackSectionMaxY
  // | <measures...>
  // | <measures...>
  // | <measures...>
  // ├----------------------------------
  // | <flame graph...>
  // |
  // |
  // └----------------------------------
  let stackSectionBaseY: number;
  let stackSectionMaxY: number = 0;

  // Header section: do nothing
  stackSectionBaseY = stackSectionMaxY;
  stackSectionMaxY += HEADER_HEIGHT_FIXED;
  if (canvasMouseY < stackSectionMaxY) {
    return null;
  }

  // ReactEvent row
  stackSectionBaseY = stackSectionMaxY;
  stackSectionMaxY += EVENT_ROW_HEIGHT_FIXED;
  if (canvasMouseY + offsetY < stackSectionMaxY) {
    return getHoveredReactEvent(data, panAndZoomState);
  }

  // ReactMeasure lanes
  stackSectionBaseY = stackSectionMaxY;
  stackSectionMaxY += schedulerCanvasHeight;
  if (canvasMouseY + offsetY < stackSectionMaxY) {
    return getHoveredReactMeasure(data, panAndZoomState, stackSectionBaseY);
  }

  // Flamechart area
  stackSectionBaseY = stackSectionMaxY;
  return getHoveredFlamechartEvent(
    data,
    flamechart,
    panAndZoomState,
    stackSectionBaseY,
  );
}
