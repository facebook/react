// @flow
// Contains helper functions for rendering canvas elements

import type {
  ReactProfilerData,
  FlamechartData,
  ReactHoverContextInfo,
  ReactPriority,
} from '../types';
import type {PanAndZoomState} from '../util/usePanAndZoom';

import memoize from 'memoize-one';
import {
  INTERVAL_TIMES,
  MAX_INTERVAL_SIZE_PX,
  LABEL_FIXED_WIDTH,
  HEADER_HEIGHT_FIXED,
  REACT_PRIORITIES,
  REACT_GUTTER_SIZE,
  REACT_EVENT_SIZE,
  REACT_WORK_SIZE,
  REACT_PRIORITY_BORDER_SIZE,
  FLAMECHART_FRAME_HEIGHT,
} from './constants';
import {
  durationToWidth,
  positionToTimestamp,
  timestampToPosition,
} from '../util/usePanAndZoom';

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
  data: $ReadOnly<ReactProfilerData>,
  flamechart: $ReadOnly<FlamechartData>,
  state: PanAndZoomState,
): ReactHoverContextInfo | null {
  const {canvasMouseX, canvasMouseY, offsetY} = state;

  if (canvasMouseX < LABEL_FIXED_WIDTH || canvasMouseY < HEADER_HEIGHT_FIXED) {
    return null;
  }

  if (canvasMouseY + offsetY < schedulerCanvasHeight) {
    const adjustedCanvasMouseY = canvasMouseY - HEADER_HEIGHT_FIXED + offsetY;
    let priorityMinY = HEADER_HEIGHT_FIXED;
    let priorityIndex = null;
    let priority: ReactPriority = 'unscheduled';
    for (let index = 0; index < REACT_PRIORITIES.length; index++) {
      priority = REACT_PRIORITIES[index];

      const priorityHeight = getPriorityHeight(data, priority);
      if (
        adjustedCanvasMouseY >= priorityMinY &&
        adjustedCanvasMouseY <= priorityMinY + priorityHeight
      ) {
        priorityIndex = index;
        break;
      }
      priorityMinY += priorityHeight;
    }

    if (priorityIndex === null) {
      return null;
    }

    const baseY = priorityMinY - offsetY;
    const eventMinY = baseY + REACT_GUTTER_SIZE / 2;
    const eventMaxY = eventMinY + REACT_EVENT_SIZE + REACT_GUTTER_SIZE;
    const measureMinY = eventMaxY;
    const measureMaxY = measureMinY + REACT_WORK_SIZE + REACT_GUTTER_SIZE;

    let events = null;
    let measures = null;
    if (canvasMouseY >= eventMinY && canvasMouseY <= eventMaxY) {
      events = data[priority].events;
    } else if (canvasMouseY >= measureMinY && canvasMouseY <= measureMaxY) {
      measures = data[priority].measures;
    }

    if (events !== null) {
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
            priorityIndex,
            data,
          };
        }
      }
    } else if (measures !== null) {
      // Because data ranges may overlap, we want to find the last intersecting item.
      // This will always be the one on "top" (the one the user is hovering over).
      for (let index = measures.length - 1; index >= 0; index--) {
        const measure = measures[index];
        const {duration, timestamp} = measure;

        const pointerTime = positionToTimestamp(canvasMouseX, state);

        if (pointerTime >= timestamp && pointerTime <= timestamp + duration) {
          return {
            event: null,
            flamechartNode: null,
            measure,
            priorityIndex,
            data,
          };
        }
      }
    }
  } else {
    const layerIndex = Math.floor(
      (canvasMouseY + offsetY - HEADER_HEIGHT_FIXED - schedulerCanvasHeight) /
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
            priorityIndex: null,
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

const cachedPriorityHeights = new Map();
export const getPriorityHeight = (
  data: $ReadOnly<ReactProfilerData>,
  priority: ReactPriority,
): number => {
  if (cachedPriorityHeights.has(priority)) {
    // We know the value must be present because we've just checked.
    return ((cachedPriorityHeights.get(priority): any): number);
  } else {
    const numMeasures = data[priority].maxNestedMeasures;
    const events = data[priority].events;

    let priorityHeight = 0;
    if (numMeasures > 0 && events.length > 0) {
      priorityHeight =
        REACT_GUTTER_SIZE +
        REACT_EVENT_SIZE +
        REACT_WORK_SIZE * numMeasures +
        REACT_GUTTER_SIZE * numMeasures +
        REACT_PRIORITY_BORDER_SIZE;
    } else if (numMeasures > 0) {
      priorityHeight =
        REACT_GUTTER_SIZE +
        REACT_WORK_SIZE * numMeasures +
        REACT_GUTTER_SIZE * numMeasures +
        REACT_PRIORITY_BORDER_SIZE;
    } else if (events.length > 0) {
      priorityHeight =
        REACT_GUTTER_SIZE +
        REACT_EVENT_SIZE +
        REACT_GUTTER_SIZE +
        REACT_PRIORITY_BORDER_SIZE;
    }

    cachedPriorityHeights.set(priority, priorityHeight);

    return priorityHeight;
  }
};
