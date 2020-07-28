// @flow

import type {Rect, Size} from '../../layout';

import {
  durationToWidth,
  positioningScaleFactor,
  positionToTimestamp,
  timestampToPosition,
} from '../canvasUtils';
import {
  View,
  Surface,
  rectIntersectsRect,
  rectIntersectionWithRect,
} from '../../layout';
import {
  COLORS,
  HEADER_HEIGHT_FIXED,
  INTERVAL_TIMES,
  LABEL_FIXED_WIDTH,
  MARKER_FONT_SIZE,
  MARKER_HEIGHT,
  MARKER_TEXT_PADDING,
  MARKER_TICK_HEIGHT,
  MIN_INTERVAL_SIZE_PX,
  REACT_WORK_BORDER_SIZE,
} from '../constants';

export class TimeAxisMarkersView extends View {
  totalDuration: number;
  intrinsicSize: Size;

  constructor(surface: Surface, frame: Rect, totalDuration: number) {
    super(surface, frame);
    this.totalDuration = totalDuration;
    this.intrinsicSize = {
      width: this.totalDuration,
      height: HEADER_HEIGHT_FIXED,
    };
  }

  desiredSize() {
    return this.intrinsicSize;
  }

  // Time mark intervals vary based on the current zoom range and the time it represents.
  // In Chrome, these seem to range from 70-140 pixels wide.
  // Time wise, they represent intervals of e.g. 1s, 500ms, 200ms, 100ms, 50ms, 20ms.
  // Based on zoom, we should determine which amount to actually show.
  getTimeTickInterval(scaleFactor: number): number {
    for (let i = 0; i < INTERVAL_TIMES.length; i++) {
      const currentInterval = INTERVAL_TIMES[i];
      const intervalWidth = durationToWidth(currentInterval, scaleFactor);
      if (intervalWidth > MIN_INTERVAL_SIZE_PX) {
        return currentInterval;
      }
    }
    return INTERVAL_TIMES[0];
  }

  draw(context: CanvasRenderingContext2D) {
    const {frame, intrinsicSize, visibleArea} = this;
    const clippedFrame = {
      origin: frame.origin,
      size: {
        width: frame.size.width,
        height: intrinsicSize.height,
      },
    };
    const drawableRect = rectIntersectionWithRect(clippedFrame, visibleArea);

    // Clear background
    context.fillStyle = COLORS.BACKGROUND;
    context.fillRect(
      drawableRect.origin.x,
      drawableRect.origin.y,
      drawableRect.size.width,
      drawableRect.size.height,
    );

    const scaleFactor = positioningScaleFactor(
      intrinsicSize.width,
      clippedFrame,
    );
    const interval = this.getTimeTickInterval(scaleFactor);
    const firstIntervalTimestamp =
      Math.ceil(
        positionToTimestamp(
          drawableRect.origin.x - LABEL_FIXED_WIDTH,
          scaleFactor,
          clippedFrame,
        ) / interval,
      ) * interval;

    for (
      let markerTimestamp = firstIntervalTimestamp;
      true;
      markerTimestamp += interval
    ) {
      if (markerTimestamp <= 0) {
        continue; // Timestamps < are probably a bug; markers at 0 are ugly.
      }

      const x = timestampToPosition(markerTimestamp, scaleFactor, clippedFrame);
      if (x > drawableRect.origin.x + drawableRect.size.width) {
        break; // Not in view
      }

      const markerLabel = Math.round(markerTimestamp);

      context.fillStyle = COLORS.PRIORITY_BORDER;
      context.fillRect(
        x,
        drawableRect.origin.y + MARKER_HEIGHT - MARKER_TICK_HEIGHT,
        REACT_WORK_BORDER_SIZE,
        MARKER_TICK_HEIGHT,
      );

      context.fillStyle = COLORS.TIME_MARKER_LABEL;
      context.textAlign = 'right';
      context.textBaseline = 'middle';
      context.font = `${MARKER_FONT_SIZE}px sans-serif`;
      context.fillText(
        `${markerLabel}ms`,
        x - MARKER_TEXT_PADDING,
        MARKER_HEIGHT / 2,
      );
    }

    // Render bottom border.
    // Propose border rect, check if intersects with `rect`, draw intersection.
    const borderFrame: Rect = {
      origin: {
        x: clippedFrame.origin.x,
        y:
          clippedFrame.origin.y +
          clippedFrame.size.height -
          REACT_WORK_BORDER_SIZE,
      },
      size: {
        width: clippedFrame.size.width,
        height: REACT_WORK_BORDER_SIZE,
      },
    };
    if (rectIntersectsRect(borderFrame, visibleArea)) {
      const borderDrawableRect = rectIntersectionWithRect(
        borderFrame,
        visibleArea,
      );
      context.fillStyle = COLORS.PRIORITY_BORDER;
      context.fillRect(
        borderDrawableRect.origin.x,
        borderDrawableRect.origin.y,
        borderDrawableRect.size.width,
        borderDrawableRect.size.height,
      );
    }
  }
}
