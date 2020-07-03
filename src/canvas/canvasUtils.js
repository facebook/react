// @flow
// Contains helper functions for rendering canvas elements

import type {
  FlamechartData,
  ReactHoverContextInfo,
  ReactLane,
  ReactProfilerDataV2,
} from '../types';
import type {PanAndZoomState} from '../util/usePanAndZoom';

import memoize from 'memoize-one';
import {
  INTERVAL_TIMES,
  MAX_INTERVAL_SIZE_PX,
  HEADER_HEIGHT_FIXED,
  REACT_GUTTER_SIZE,
  REACT_EVENT_SIZE,
  REACT_WORK_SIZE,
  REACT_PRIORITY_BORDER_SIZE,
  FLAMECHART_FRAME_HEIGHT,
  EVENT_ROW_HEIGHT_FIXED,
} from './constants';
import {
  durationToWidth,
  positionToTimestamp,
  timestampToPosition,
} from '../util/usePanAndZoom';
import {REACT_TOTAL_NUM_LANES} from '../constants';

// hidpi canvas: https://www.html5rocks.com/en/tutorials/canvas/hidpi/
function configureRetinaCanvas(canvas, height, width) {
  const dpr: number = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  return dpr;
}

export const getCanvasContext = memoize(
  (
    canvas: HTMLCanvasElement,
    height: number,
    width: number,
    scaleCanvas: boolean = true,
  ): CanvasRenderingContext2D => {
    const context = canvas.getContext('2d', {alpha: false});
    if (scaleCanvas) {
      const dpr = configureRetinaCanvas(canvas, height, width);
      // Scale all drawing operations by the dpr, so you don't have to worry about the difference.
      context.scale(dpr, dpr);
    }
    return context;
  },
);

export function getCanvasMousePos(
  canvas: HTMLCanvasElement,
  mouseEvent: MouseEvent,
) {
  const rect =
    canvas instanceof HTMLCanvasElement
      ? canvas.getBoundingClientRect()
      : {left: 0, top: 0};
  const canvasMouseX = mouseEvent.clientX - rect.left;
  const canvasMouseY = mouseEvent.clientY - rect.top;

  return {canvasMouseX, canvasMouseY};
}

// Time mark intervals vary based on the current zoom range and the time it represents.
// In Chrome, these seem to range from 70-140 pixels wide.
// Time wise, they represent intervals of e.g. 1s, 500ms, 200ms, 100ms, 50ms, 20ms.
// Based on zoom, we should determine which amount to actually show.
export function getTimeTickInterval(zoomLevel: number) {
  let interval = INTERVAL_TIMES[0];
  for (let i = 0; i < INTERVAL_TIMES.length; i++) {
    const currentInterval = INTERVAL_TIMES[i];
    const pixels = currentInterval * zoomLevel;
    if (pixels <= MAX_INTERVAL_SIZE_PX) {
      interval = currentInterval;
    }
  }
  return interval;
}

const cachedFlamegraphTextWidths = new Map();
export const trimFlamegraphText = (
  context: CanvasRenderingContext2D,
  text: string,
  width: number,
) => {
  for (let i = text.length - 1; i >= 0; i--) {
    const trimmedText = i === text.length - 1 ? text : text.substr(0, i) + '…';

    let measuredWidth = cachedFlamegraphTextWidths.get(trimmedText);
    if (measuredWidth == null) {
      measuredWidth = context.measureText(trimmedText).width;
      cachedFlamegraphTextWidths.set(trimmedText, measuredWidth);
    }

    if (measuredWidth <= width) {
      return trimmedText;
    }
  }

  return null;
};

export function getHoveredEvent(
  schedulerCanvasHeight: number,
  data: $ReadOnly<ReactProfilerDataV2>,
  flamechart: $ReadOnly<FlamechartData>,
  state: PanAndZoomState,
): ReactHoverContextInfo | null {
  const {canvasMouseX, canvasMouseY, offsetY} = state;

  if (canvasMouseY < HEADER_HEIGHT_FIXED) {
    return null;
  }

  if (canvasMouseY + offsetY < HEADER_HEIGHT_FIXED + EVENT_ROW_HEIGHT_FIXED) {
    // Find hovered React event

    const {events} = data;

    // Because data ranges may overlap, we want to find the last intersecting item.
    // This will always be the one on "top" (the one the user is hovering over).
    for (let index = events.length - 1; index >= 0; index--) {
      const event = events[index];
      const {timestamp} = event;

      const eventX = timestampToPosition(timestamp, state);
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
  } else if (
    canvasMouseY + offsetY <
    HEADER_HEIGHT_FIXED + EVENT_ROW_HEIGHT_FIXED + schedulerCanvasHeight
  ) {
    // Find hovered React measure

    const adjustedCanvasMouseY = canvasMouseY - HEADER_HEIGHT_FIXED + offsetY;
    let laneMinY = EVENT_ROW_HEIGHT_FIXED;
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

    // Because data ranges may overlap, we want to find the last intersecting item.
    // This will always be the one on "top" (the one the user is hovering over).
    const {measures} = data;
    for (let index = measures.length - 1; index >= 0; index--) {
      const measure = measures[index];
      if (!measure.lanes.includes(lane)) {
        continue;
      }

      const {duration, timestamp} = measure;
      const pointerTime = positionToTimestamp(canvasMouseX, state);

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
  } else {
    // Find hovered flamechart event

    const layerIndex = Math.floor(
      (canvasMouseY +
        offsetY -
        HEADER_HEIGHT_FIXED -
        EVENT_ROW_HEIGHT_FIXED -
        schedulerCanvasHeight) /
        FLAMECHART_FRAME_HEIGHT,
    );
    const layer = flamechart.layers[layerIndex];

    if (layer != null) {
      let startIndex = 0;
      let stopIndex = layer.length - 1;
      while (startIndex <= stopIndex) {
        const currentIndex = Math.floor((startIndex + stopIndex) / 2);
        const flamechartNode = layer[currentIndex];

        const {end, start} = flamechartNode;

        const width = durationToWidth((end - start) / 1000, state);
        const x = Math.floor(timestampToPosition(start / 1000, state));

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
    }
  }

  return null;
}

export const getLaneHeight = (
  data: $ReadOnly<ReactProfilerDataV2>,
  lane: ReactLane,
): number => {
  // TODO: Return 0 if data has no data for lane
  return (
    REACT_GUTTER_SIZE +
    REACT_WORK_SIZE +
    REACT_GUTTER_SIZE +
    REACT_PRIORITY_BORDER_SIZE
  );
};
