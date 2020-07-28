// @flow
// Contains helper functions for rendering canvas elements

import type {Rect} from '../layout';

import memoize from 'memoize-one';
import {INTERVAL_TIMES, MAX_INTERVAL_SIZE_PX} from './constants';

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

export function positioningScaleFactor(
  intrinsicWidth: number,
  frame: Rect,
): number {
  return frame.size.width / intrinsicWidth;
}

export function timestampToPosition(
  timestamp: number,
  scaleFactor: number,
  frame: Rect,
): number {
  return frame.origin.x + timestamp * scaleFactor;
}

export function positionToTimestamp(
  position: number,
  scaleFactor: number,
  frame: Rect,
): number {
  return (position - frame.origin.x) / scaleFactor;
}

export function durationToWidth(duration: number, scaleFactor: number): number {
  return duration * scaleFactor;
}

export function widthToDuration(width: number, scaleFactor: number): number {
  return width / scaleFactor;
}
