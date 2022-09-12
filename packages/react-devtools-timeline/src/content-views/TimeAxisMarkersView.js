/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Rect, Size} from '../view-base';

import {
  durationToWidth,
  positioningScaleFactor,
  positionToTimestamp,
  timestampToPosition,
} from './utils/positioning';
import {
  View,
  Surface,
  rectIntersectsRect,
  intersectionOfRects,
} from '../view-base';
import {
  COLORS,
  INTERVAL_TIMES,
  LABEL_SIZE,
  FONT_SIZE,
  MARKER_HEIGHT,
  MARKER_TEXT_PADDING,
  MARKER_TICK_HEIGHT,
  MIN_INTERVAL_SIZE_PX,
  BORDER_SIZE,
} from './constants';

const HEADER_HEIGHT_FIXED = MARKER_HEIGHT + BORDER_SIZE;
const LABEL_FIXED_WIDTH = LABEL_SIZE + BORDER_SIZE;

export class TimeAxisMarkersView extends View {
  _totalDuration: number;
  _intrinsicSize: Size;

  constructor(surface: Surface, frame: Rect, totalDuration: number) {
    super(surface, frame);
    this._totalDuration = totalDuration;
    this._intrinsicSize = {
      width: this._totalDuration,
      height: HEADER_HEIGHT_FIXED,
    };
  }

  desiredSize(): Size {
    return this._intrinsicSize;
  }

  // Time mark intervals vary based on the current zoom range and the time it represents.
  // In Chrome, these seem to range from 70-140 pixels wide.
  // Time wise, they represent intervals of e.g. 1s, 500ms, 200ms, 100ms, 50ms, 20ms.
  // Based on zoom, we should determine which amount to actually show.
  _getTimeTickInterval(scaleFactor: number): number {
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
    const {frame, _intrinsicSize, visibleArea} = this;
    const clippedFrame = {
      origin: frame.origin,
      size: {
        width: frame.size.width,
        height: _intrinsicSize.height,
      },
    };
    const drawableRect = intersectionOfRects(clippedFrame, visibleArea);

    // Clear background
    context.fillStyle = COLORS.BACKGROUND;
    context.fillRect(
      drawableRect.origin.x,
      drawableRect.origin.y,
      drawableRect.size.width,
      drawableRect.size.height,
    );

    const scaleFactor = positioningScaleFactor(
      _intrinsicSize.width,
      clippedFrame,
    );
    const interval = this._getTimeTickInterval(scaleFactor);
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
        BORDER_SIZE,
        MARKER_TICK_HEIGHT,
      );

      context.fillStyle = COLORS.TIME_MARKER_LABEL;
      context.textAlign = 'right';
      context.textBaseline = 'middle';
      context.font = `${FONT_SIZE}px sans-serif`;
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
        y: clippedFrame.origin.y + clippedFrame.size.height - BORDER_SIZE,
      },
      size: {
        width: clippedFrame.size.width,
        height: BORDER_SIZE,
      },
    };
    if (rectIntersectsRect(borderFrame, visibleArea)) {
      const borderDrawableRect = intersectionOfRects(borderFrame, visibleArea);
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
