/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactEvent, ReactProfilerData} from '../types';
import type {Interaction, MouseMoveInteraction, Rect, Size} from '../view-base';

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
  EVENT_ROW_PADDING,
  EVENT_DIAMETER,
  BORDER_SIZE,
} from './constants';

const EVENT_ROW_HEIGHT_FIXED =
  EVENT_ROW_PADDING + EVENT_DIAMETER + EVENT_ROW_PADDING;

function isSuspenseEvent(event: ReactEvent): boolean %checks {
  return (
    event.type === 'suspense-suspend' ||
    event.type === 'suspense-resolved' ||
    event.type === 'suspense-rejected'
  );
}

export class ReactEventsView extends View {
  _profilerData: ReactProfilerData;
  _intrinsicSize: Size;

  _hoveredEvent: ReactEvent | null = null;
  onHover: ((event: ReactEvent | null) => void) | null = null;

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

  setHoveredEvent(hoveredEvent: ReactEvent | null) {
    if (this._hoveredEvent === hoveredEvent) {
      return;
    }
    this._hoveredEvent = hoveredEvent;
    this.setNeedsDisplay();
  }

  /**
   * Draw a single `ReactEvent` as a circle in the canvas.
   */
  _drawSingleReactEvent(
    context: CanvasRenderingContext2D,
    rect: Rect,
    event: ReactEvent,
    baseY: number,
    scaleFactor: number,
    showHoverHighlight: boolean,
  ) {
    const {frame} = this;
    const {timestamp, type} = event;

    const x = timestampToPosition(timestamp, scaleFactor, frame);
    const radius = EVENT_DIAMETER / 2;
    const eventRect: Rect = {
      origin: {
        x: x - radius,
        y: baseY,
      },
      size: {width: EVENT_DIAMETER, height: EVENT_DIAMETER},
    };
    if (!rectIntersectsRect(eventRect, rect)) {
      return; // Not in view
    }

    let fillStyle = null;

    switch (type) {
      case 'schedule-render':
      case 'schedule-state-update':
      case 'schedule-force-update':
        if (event.isCascading) {
          fillStyle = showHoverHighlight
            ? COLORS.REACT_SCHEDULE_CASCADING_HOVER
            : COLORS.REACT_SCHEDULE_CASCADING;
        } else {
          fillStyle = showHoverHighlight
            ? COLORS.REACT_SCHEDULE_HOVER
            : COLORS.REACT_SCHEDULE;
        }
        break;
      case 'suspense-suspend':
      case 'suspense-resolved':
      case 'suspense-rejected':
        fillStyle = showHoverHighlight
          ? COLORS.REACT_SUSPEND_HOVER
          : COLORS.REACT_SUSPEND;
        break;
      default:
        if (__DEV__) {
          console.warn('Unexpected event type "%s"', type);
        }
        break;
    }

    if (fillStyle !== null) {
      const y = eventRect.origin.y + radius;

      context.beginPath();
      context.fillStyle = fillStyle;
      context.arc(x, y, radius, 0, 2 * Math.PI);
      context.fill();
    }
  }

  draw(context: CanvasRenderingContext2D) {
    const {
      frame,
      _profilerData: {events},
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

    const highlightedEvents: ReactEvent[] = [];

    events.forEach(event => {
      if (
        event === _hoveredEvent ||
        (_hoveredEvent &&
          isSuspenseEvent(event) &&
          isSuspenseEvent(_hoveredEvent) &&
          event.id === _hoveredEvent.id)
      ) {
        highlightedEvents.push(event);
        return;
      }
      this._drawSingleReactEvent(
        context,
        visibleArea,
        event,
        baseY,
        scaleFactor,
        false,
      );
    });

    // Draw the highlighted items on top so they stand out.
    // This is helpful if there are multiple (overlapping) items close to each other.
    highlightedEvents.forEach(event => {
      this._drawSingleReactEvent(
        context,
        visibleArea,
        event,
        baseY,
        scaleFactor,
        true,
      );
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
      _profilerData: {events},
    } = this;
    const scaleFactor = positioningScaleFactor(
      this._intrinsicSize.width,
      frame,
    );
    const hoverTimestamp = positionToTimestamp(location.x, scaleFactor, frame);
    const eventTimestampAllowance = widthToDuration(
      EVENT_DIAMETER / 2,
      scaleFactor,
    );

    // Because data ranges may overlap, we want to find the last intersecting item.
    // This will always be the one on "top" (the one the user is hovering over).
    for (let index = events.length - 1; index >= 0; index--) {
      const event = events[index];
      const {timestamp} = event;

      if (
        timestamp - eventTimestampAllowance <= hoverTimestamp &&
        hoverTimestamp <= timestamp + eventTimestampAllowance
      ) {
        onHover(event);
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
