/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {SchedulingEvent, TimelineData} from '../types';
import type {
  ClickInteraction,
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

export class SchedulingEventsView extends View {
  _profilerData: TimelineData;
  _intrinsicSize: Size;

  _hoveredEvent: SchedulingEvent | null = null;
  onHover: ((event: SchedulingEvent | null) => void) | null = null;
  onClick:
    | ((event: SchedulingEvent | null, eventIndex: number | null) => void)
    | null = null;

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

  setHoveredEvent(hoveredEvent: SchedulingEvent | null) {
    if (this._hoveredEvent === hoveredEvent) {
      return;
    }
    this._hoveredEvent = hoveredEvent;
    this.setNeedsDisplay();
  }

  /**
   * Draw a single `SchedulingEvent` as a circle in the canvas.
   */
  _drawSingleSchedulingEvent(
    context: CanvasRenderingContext2D,
    rect: Rect,
    event: SchedulingEvent,
    baseY: number,
    scaleFactor: number,
    showHoverHighlight: boolean,
  ) {
    const {frame} = this;
    const {timestamp, type, warning} = event;

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

    let fillStyle = null;

    if (warning !== null) {
      fillStyle = showHoverHighlight
        ? COLORS.WARNING_BACKGROUND_HOVER
        : COLORS.WARNING_BACKGROUND;
    } else {
      switch (type) {
        case 'schedule-render':
        case 'schedule-state-update':
        case 'schedule-force-update':
          fillStyle = showHoverHighlight
            ? COLORS.REACT_SCHEDULE_HOVER
            : COLORS.REACT_SCHEDULE;
          break;
        default:
          if (__DEV__) {
            console.warn('Unexpected event type "%s"', type);
          }
          break;
      }
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
      _profilerData: {schedulingEvents},
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

    const highlightedEvents: SchedulingEvent[] = [];

    schedulingEvents.forEach(event => {
      if (event === _hoveredEvent) {
        highlightedEvents.push(event);
        return;
      }
      this._drawSingleSchedulingEvent(
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
      this._drawSingleSchedulingEvent(
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
      _profilerData: {schedulingEvents},
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
    for (let index = schedulingEvents.length - 1; index >= 0; index--) {
      const event = schedulingEvents[index];
      const {timestamp} = event;

      if (
        timestamp - eventTimestampAllowance <= hoverTimestamp &&
        hoverTimestamp <= timestamp + eventTimestampAllowance
      ) {
        this.currentCursor = 'pointer';
        viewRefs.hoveredView = this;
        onHover(event);
        return;
      }
    }

    onHover(null);
  }

  /**
   * @private
   */
  _handleClick(interaction: ClickInteraction) {
    const {onClick} = this;
    if (onClick) {
      const {
        _profilerData: {schedulingEvents},
      } = this;
      const eventIndex = schedulingEvents.findIndex(
        event => event === this._hoveredEvent,
      );
      // onHover is going to take care of all the difficult logic here of
      // figuring out which event when they're proximity is close.
      onClick(this._hoveredEvent, eventIndex >= 0 ? eventIndex : null);
    }
  }

  handleInteraction(interaction: Interaction, viewRefs: ViewRefs) {
    switch (interaction.type) {
      case 'mousemove':
        this._handleMouseMove(interaction, viewRefs);
        break;
      case 'click':
        this._handleClick(interaction);
        break;
    }
  }
}
