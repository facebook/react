// @flow

import type {Interaction, HoverInteraction} from '../../useCanvasInteraction';
import type {ReactEvent, ReactProfilerData} from '../../types';
import type {Rect, Size} from '../../layout';

import {
  positioningScaleFactor,
  timestampToPosition,
  positionToTimestamp,
  widthToDuration,
} from '../canvasUtils';
import {
  View,
  Surface,
  rectContainsPoint,
  rectIntersectsRect,
  rectIntersectionWithRect,
} from '../../layout';
import {
  COLORS,
  EVENT_ROW_HEIGHT_FIXED,
  REACT_EVENT_ROW_PADDING,
  REACT_EVENT_SIZE,
  REACT_WORK_BORDER_SIZE,
} from '../constants';

export class ReactEventsView extends View {
  profilerData: ReactProfilerData;
  intrinsicSize: Size;

  hoveredEvent: ReactEvent | null = null;
  onHover: ((event: ReactEvent | null) => void) | null = null;

  constructor(surface: Surface, frame: Rect, profilerData: ReactProfilerData) {
    super(surface, frame);
    this.profilerData = profilerData;

    this.intrinsicSize = {
      width: this.profilerData.duration,
      height: EVENT_ROW_HEIGHT_FIXED,
    };
  }

  desiredSize() {
    return this.intrinsicSize;
  }

  setHoveredEvent(hoveredEvent: ReactEvent | null) {
    if (this.hoveredEvent === hoveredEvent) {
      return;
    }
    this.hoveredEvent = hoveredEvent;
    this.setNeedsDisplay();
  }

  /**
   * Draw a single `ReactEvent` as a circle in the canvas.
   */
  drawSingleReactEvent(
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
    const radius = REACT_EVENT_SIZE / 2;
    const eventRect: Rect = {
      origin: {
        x: x - radius,
        y: baseY,
      },
      size: {width: REACT_EVENT_SIZE, height: REACT_EVENT_SIZE},
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
        console.warn(`Unexpected event type "${type}"`);
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
      profilerData: {events},
      hoveredEvent,
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
    const baseY = frame.origin.y + REACT_EVENT_ROW_PADDING;
    const scaleFactor = positioningScaleFactor(this.intrinsicSize.width, frame);

    events.forEach(event => {
      if (event === hoveredEvent) {
        return;
      }
      this.drawSingleReactEvent(
        context,
        visibleArea,
        event,
        baseY,
        scaleFactor,
        false,
      );
    });

    // Draw the hovered and/or selected items on top so they stand out.
    // This is helpful if there are multiple (overlapping) items close to each other.
    if (hoveredEvent !== null) {
      this.drawSingleReactEvent(
        context,
        visibleArea,
        hoveredEvent,
        baseY,
        scaleFactor,
        true,
      );
    }

    // Render bottom border.
    // Propose border rect, check if intersects with `rect`, draw intersection.
    const borderFrame: Rect = {
      origin: {
        x: frame.origin.x,
        y: frame.origin.y + EVENT_ROW_HEIGHT_FIXED - REACT_WORK_BORDER_SIZE,
      },
      size: {
        width: frame.size.width,
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

  /**
   * @private
   */
  handleHover(interaction: HoverInteraction) {
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
      profilerData: {events},
    } = this;
    const scaleFactor = positioningScaleFactor(this.intrinsicSize.width, frame);
    const hoverTimestamp = positionToTimestamp(location.x, scaleFactor, frame);
    const eventTimestampAllowance = widthToDuration(
      REACT_EVENT_SIZE / 2,
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

  handleInteractionAndPropagateToSubviews(interaction: Interaction) {
    switch (interaction.type) {
      case 'hover':
        this.handleHover(interaction);
        break;
    }
  }
}
