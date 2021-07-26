/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {NativeEvent, ReactProfilerData} from '../types';
import type {Interaction, MouseMoveInteraction, Rect, Size} from '../view-base';

import {
  positioningScaleFactor,
  timestampToPosition,
  positionToTimestamp,
} from './utils/positioning';
import {
  View,
  Surface,
  rectContainsPoint,
  rectIntersectsRect,
  intersectionOfRects,
} from '../view-base';
import {
  COLORS,
  EVENT_ROW_PADDING,
  EVENT_DIAMETER,
  BORDER_SIZE,
} from './constants';

const EVENT_ROW_HEIGHT_FIXED =
  EVENT_ROW_PADDING + EVENT_DIAMETER + EVENT_ROW_PADDING;

export class NativeEventsView extends View {
  _profilerData: ReactProfilerData;
  _intrinsicSize: Size;

  _hoveredEvent: NativeEvent | null = null;
  onHover: ((event: NativeEvent | null) => void) | null = null;

  constructor(surface: Surface, frame: Rect, profilerData: ReactProfilerData) {
    super(surface, frame);
    this._profilerData = profilerData;

    this._intrinsicSize = {
      width: this._profilerData.duration,
      height: EVENT_ROW_HEIGHT_FIXED,
    };
  }

  desiredSize() {
    return this._intrinsicSize;
  }

  setHoveredEvent(hoveredEvent: NativeEvent | null) {
    if (this._hoveredEvent === hoveredEvent) {
      return;
    }
    this._hoveredEvent = hoveredEvent;
    this.setNeedsDisplay();
  }

  /**
   * Draw a single `NativeEvent` as a circle in the canvas.
   */
  _drawSingleNativeEvent(
    context: CanvasRenderingContext2D,
    rect: Rect,
    event: NativeEvent,
    baseY: number,
    scaleFactor: number,
    showHoverHighlight: boolean,
  ) {
    const {frame} = this;
    const {duration, timestamp} = event;

    const xStart = timestampToPosition(timestamp, scaleFactor, frame);
    const xStop = timestampToPosition(timestamp + duration, scaleFactor, frame);
    const eventRect: Rect = {
      origin: {
        x: xStart,
        y: baseY,
      },
      size: {width: xStop - xStart, height: EVENT_DIAMETER},
    };
    if (!rectIntersectsRect(eventRect, rect)) {
      return; // Not in view
    }

    const fillStyle = showHoverHighlight
      ? COLORS.NATIVE_EVENT_HOVER
      : COLORS.NATIVE_EVENT;

    const drawableRect = intersectionOfRects(eventRect, rect);
    context.beginPath();
    context.fillStyle = fillStyle;
    context.fillRect(
      drawableRect.origin.x,
      drawableRect.origin.y,
      drawableRect.size.width,
      drawableRect.size.height,
    );
  }

  draw(context: CanvasRenderingContext2D) {
    const {
      frame,
      _profilerData: {nativeEvents},
      _hoveredEvent,
      visibleArea,
    } = this;

    context.fillStyle = COLORS.BACKGROUND;
    context.fillRect(
      visibleArea.origin.x,
      visibleArea.origin.y,
      visibleArea.size.width,
      visibleArea.size.height,
    );

    // Draw events
    const baseY = frame.origin.y + EVENT_ROW_PADDING;
    const scaleFactor = positioningScaleFactor(
      this._intrinsicSize.width,
      frame,
    );

    nativeEvents.forEach(event => {
      if (event === _hoveredEvent) {
        // Draw the highlighted items on top so they stand out.
        // This is helpful if there are multiple (overlapping) items close to each other.
        this._drawSingleNativeEvent(
          context,
          visibleArea,
          event,
          baseY,
          scaleFactor,
          true,
        );
      } else {
        this._drawSingleNativeEvent(
          context,
          visibleArea,
          event,
          baseY,
          scaleFactor,
          false,
        );
      }
    });

    // Render bottom border.
    // Propose border rect, check if intersects with `rect`, draw intersection.
    const borderFrame: Rect = {
      origin: {
        x: frame.origin.x,
        y: frame.origin.y + EVENT_ROW_HEIGHT_FIXED - BORDER_SIZE,
      },
      size: {
        width: frame.size.width,
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

  /**
   * @private
   */
  _handleMouseMove(interaction: MouseMoveInteraction) {
    const {frame, _intrinsicSize, onHover, visibleArea} = this;
    if (!onHover) {
      return;
    }

    const {location} = interaction.payload;
    if (!rectContainsPoint(location, visibleArea)) {
      onHover(null);
      return;
    }

    const {nativeEvents} = this._profilerData;

    const scaleFactor = positioningScaleFactor(_intrinsicSize.width, frame);
    const hoverTimestamp = positionToTimestamp(location.x, scaleFactor, frame);

    // Find the event being hovered over.
    //
    // Because data ranges may overlap, we want to find the last intersecting item.
    // This will always be the one on "top" (the one the user is hovering over).
    for (let index = nativeEvents.length - 1; index >= 0; index--) {
      const nativeEvent = nativeEvents[index];
      const {duration, timestamp} = nativeEvent;

      if (
        hoverTimestamp >= timestamp &&
        hoverTimestamp <= timestamp + duration
      ) {
        onHover(nativeEvent);
        return;
      }
    }

    onHover(null);
  }

  handleInteraction(interaction: Interaction) {
    switch (interaction.type) {
      case 'mousemove':
        this._handleMouseMove(interaction);
        break;
    }
  }
}
