/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ThrownError, TimelineData} from '../types';
import type {
  Interaction,
  MouseMoveInteraction,
  Rect,
  Size,
  ViewRefs,
} from '../view-base';

import {
  positioningScaleFactor,
  timestampToPosition,
  positionToTimestamp,
  widthToDuration,
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
  TOP_ROW_PADDING,
  REACT_EVENT_DIAMETER,
  BORDER_SIZE,
} from './constants';

const EVENT_ROW_HEIGHT_FIXED =
  TOP_ROW_PADDING + REACT_EVENT_DIAMETER + TOP_ROW_PADDING;

export class ThrownErrorsView extends View {
  _profilerData: TimelineData;
  _intrinsicSize: Size;
  _hoveredEvent: ThrownError | null = null;
  onHover: ((event: ThrownError | null) => void) | null = null;

  constructor(surface: Surface, frame: Rect, profilerData: TimelineData) {
    super(surface, frame);
    this._profilerData = profilerData;

    this._intrinsicSize = {
      width: this._profilerData.duration,
      height: EVENT_ROW_HEIGHT_FIXED,
    };
  }

  desiredSize(): Size {
    return this._intrinsicSize;
  }

  setHoveredEvent(hoveredEvent: ThrownError | null) {
    if (this._hoveredEvent === hoveredEvent) {
      return;
    }
    this._hoveredEvent = hoveredEvent;
    this.setNeedsDisplay();
  }

  /**
   * Draw a single `ThrownError` as a circle in the canvas.
   */
  _drawSingleThrownError(
    context: CanvasRenderingContext2D,
    rect: Rect,
    thrownError: ThrownError,
    baseY: number,
    scaleFactor: number,
    showHoverHighlight: boolean,
  ) {
    const {frame} = this;
    const {timestamp} = thrownError;

    const x = timestampToPosition(timestamp, scaleFactor, frame);
    const radius = REACT_EVENT_DIAMETER / 2;
    const eventRect: Rect = {
      origin: {
        x: x - radius,
        y: baseY,
      },
      size: {width: REACT_EVENT_DIAMETER, height: REACT_EVENT_DIAMETER},
    };
    if (!rectIntersectsRect(eventRect, rect)) {
      return; // Not in view
    }

    const fillStyle = showHoverHighlight
      ? COLORS.REACT_THROWN_ERROR_HOVER
      : COLORS.REACT_THROWN_ERROR;

    const y = eventRect.origin.y + radius;

    context.beginPath();
    context.fillStyle = fillStyle;
    context.arc(x, y, radius, 0, 2 * Math.PI);
    context.fill();
  }

  draw(context: CanvasRenderingContext2D) {
    const {
      frame,
      _profilerData: {thrownErrors},
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
    const baseY = frame.origin.y + TOP_ROW_PADDING;
    const scaleFactor = positioningScaleFactor(
      this._intrinsicSize.width,
      frame,
    );

    const highlightedEvents: ThrownError[] = [];

    thrownErrors.forEach(thrownError => {
      if (thrownError === _hoveredEvent) {
        highlightedEvents.push(thrownError);
        return;
      }
      this._drawSingleThrownError(
        context,
        visibleArea,
        thrownError,
        baseY,
        scaleFactor,
        false,
      );
    });

    // Draw the highlighted items on top so they stand out.
    // This is helpful if there are multiple (overlapping) items close to each other.
    highlightedEvents.forEach(thrownError => {
      this._drawSingleThrownError(
        context,
        visibleArea,
        thrownError,
        baseY,
        scaleFactor,
        true,
      );
    });

    // Render bottom borders.
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
      context.fillStyle = COLORS.REACT_WORK_BORDER;
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
  _handleMouseMove(interaction: MouseMoveInteraction, viewRefs: ViewRefs) {
    const {frame, onHover, visibleArea} = this;
    if (!onHover) {
      return;
    }

    const {location} = interaction.payload;
    if (!rectContainsPoint(location, visibleArea)) {
      onHover(null);
      return;
    }

    const {
      _profilerData: {thrownErrors},
    } = this;
    const scaleFactor = positioningScaleFactor(
      this._intrinsicSize.width,
      frame,
    );
    const hoverTimestamp = positionToTimestamp(location.x, scaleFactor, frame);
    const eventTimestampAllowance = widthToDuration(
      REACT_EVENT_DIAMETER / 2,
      scaleFactor,
    );

    // Because data ranges may overlap, we want to find the last intersecting item.
    // This will always be the one on "top" (the one the user is hovering over).
    for (let index = thrownErrors.length - 1; index >= 0; index--) {
      const event = thrownErrors[index];
      const {timestamp} = event;

      if (
        timestamp - eventTimestampAllowance <= hoverTimestamp &&
        hoverTimestamp <= timestamp + eventTimestampAllowance
      ) {
        this.currentCursor = 'context-menu';
        viewRefs.hoveredView = this;
        onHover(event);
        return;
      }
    }

    onHover(null);
  }

  handleInteraction(interaction: Interaction, viewRefs: ViewRefs) {
    switch (interaction.type) {
      case 'mousemove':
        this._handleMouseMove(interaction, viewRefs);
        break;
    }
  }
}
