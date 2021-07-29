/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {SuspenseEvent, ReactProfilerData} from '../types';
import type {
  Interaction,
  MouseMoveInteraction,
  Rect,
  Size,
  ViewRefs,
} from '../view-base';

import {
  durationToWidth,
  positioningScaleFactor,
  positionToTimestamp,
  timestampToPosition,
} from './utils/positioning';
import {formatDuration} from '../utils/formatting';
import {
  View,
  Surface,
  rectContainsPoint,
  rectIntersectsRect,
  intersectionOfRects,
} from '../view-base';
import {
  COLORS,
  TEXT_PADDING,
  SUSPENSE_EVENT_HEIGHT,
  FONT_SIZE,
  BORDER_SIZE,
} from './constants';

const ROW_WITH_BORDER_HEIGHT = SUSPENSE_EVENT_HEIGHT + BORDER_SIZE;

// TODO (scheduling profiler) Make this a reusable util
const cachedTextWidths = new Map();
const trimFlamechartText = (
  context: CanvasRenderingContext2D,
  text: string,
  width: number,
) => {
  for (let i = text.length - 1; i >= 0; i--) {
    const trimmedText = i === text.length - 1 ? text : text.substr(0, i) + '…';

    let measuredWidth = cachedTextWidths.get(trimmedText);
    if (measuredWidth == null) {
      measuredWidth = context.measureText(trimmedText).width;
      cachedTextWidths.set(trimmedText, measuredWidth);
    }

    if (measuredWidth <= width) {
      return trimmedText;
    }
  }

  return null;
};

// TODO (scheduling profiler) Make this a resizable view.
export class SuspenseEventsView extends View {
  _depthToSuspenseEvent: Map<number, SuspenseEvent[]>;
  _hoveredEvent: SuspenseEvent | null = null;
  _intrinsicSize: Size;
  _maxDepth: number = 0;
  _profilerData: ReactProfilerData;

  onHover: ((event: SuspenseEvent | null) => void) | null = null;

  constructor(surface: Surface, frame: Rect, profilerData: ReactProfilerData) {
    super(surface, frame);

    this._profilerData = profilerData;

    this._performPreflightComputations();
  }

  _performPreflightComputations() {
    this._depthToSuspenseEvent = new Map();

    const {duration, suspenseEvents} = this._profilerData;

    suspenseEvents.forEach(event => {
      const depth = event.depth;

      this._maxDepth = Math.max(this._maxDepth, depth);

      if (!this._depthToSuspenseEvent.has(depth)) {
        this._depthToSuspenseEvent.set(depth, [event]);
      } else {
        // $FlowFixMe This is unnecessary.
        this._depthToSuspenseEvent.get(depth).push(event);
      }
    });

    this._intrinsicSize = {
      width: duration,
      height: (this._maxDepth + 1) * ROW_WITH_BORDER_HEIGHT,
    };
  }

  desiredSize() {
    return this._intrinsicSize;
  }

  setHoveredEvent(hoveredEvent: SuspenseEvent | null) {
    if (this._hoveredEvent === hoveredEvent) {
      return;
    }
    this._hoveredEvent = hoveredEvent;
    this.setNeedsDisplay();
  }

  /**
   * Draw a single `SuspenseEvent` as a box/span with text inside of it.
   */
  _drawSingleSuspenseEvent(
    context: CanvasRenderingContext2D,
    rect: Rect,
    event: SuspenseEvent,
    baseY: number,
    scaleFactor: number,
    showHoverHighlight: boolean,
  ) {
    const {frame} = this;
    const {
      componentName,
      depth,
      duration,
      phase,
      resolution,
      timestamp,
      warning,
    } = event;

    baseY += depth * ROW_WITH_BORDER_HEIGHT;

    const xStart = timestampToPosition(timestamp, scaleFactor, frame);
    const xStop = timestampToPosition(timestamp + duration, scaleFactor, frame);
    const eventRect: Rect = {
      origin: {
        x: xStart,
        y: baseY,
      },
      size: {width: xStop - xStart, height: SUSPENSE_EVENT_HEIGHT},
    };
    if (!rectIntersectsRect(eventRect, rect)) {
      return; // Not in view
    }

    if (duration === null) {
      // TODO (scheduling profiler)
      return; // For now, don't show unresolved.
    }

    const width = durationToWidth(duration, scaleFactor);
    if (width < 1) {
      return; // Too small to render at this zoom level
    }

    const drawableRect = intersectionOfRects(eventRect, rect);
    context.beginPath();
    if (warning !== null) {
      context.fillStyle = showHoverHighlight
        ? COLORS.WARNING_BACKGROUND_HOVER
        : COLORS.WARNING_BACKGROUND;
    } else {
      switch (resolution) {
        case 'pending':
          context.fillStyle = showHoverHighlight
            ? COLORS.REACT_SUSPENSE_PENDING_EVENT_HOVER
            : COLORS.REACT_SUSPENSE_PENDING_EVENT;
          break;
        case 'rejected':
          context.fillStyle = showHoverHighlight
            ? COLORS.REACT_SUSPENSE_REJECTED_EVENT_HOVER
            : COLORS.REACT_SUSPENSE_REJECTED_EVENT;
          break;
        case 'resolved':
          context.fillStyle = showHoverHighlight
            ? COLORS.REACT_SUSPENSE_RESOLVED_EVENT_HOVER
            : COLORS.REACT_SUSPENSE_RESOLVED_EVENT;
          break;
      }
    }
    context.fillRect(
      drawableRect.origin.x,
      drawableRect.origin.y,
      drawableRect.size.width,
      drawableRect.size.height,
    );

    // Render event type label
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    context.font = `${FONT_SIZE}px sans-serif`;

    if (width > TEXT_PADDING * 2) {
      const x = Math.floor(timestampToPosition(timestamp, scaleFactor, frame));

      let label = 'suspended';
      if (componentName != null) {
        label = `${componentName} ${label}`;
      }
      if (phase !== null) {
        label += ` during ${phase}`;
      }
      label += ` - ${formatDuration(duration)}`;

      const trimmedName = trimFlamechartText(
        context,
        label,
        width - TEXT_PADDING * 2 + (x < 0 ? x : 0),
      );

      if (trimmedName !== null) {
        context.fillStyle =
          warning !== null ? COLORS.WARNING_TEXT : COLORS.TEXT_COLOR;

        context.fillText(
          trimmedName,
          eventRect.origin.x + TEXT_PADDING - (x < 0 ? x : 0),
          eventRect.origin.y + SUSPENSE_EVENT_HEIGHT / 2,
        );
      }
    }
  }

  draw(context: CanvasRenderingContext2D) {
    const {
      frame,
      _profilerData: {suspenseEvents},
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
    const scaleFactor = positioningScaleFactor(
      this._intrinsicSize.width,
      frame,
    );

    suspenseEvents.forEach(event => {
      this._drawSingleSuspenseEvent(
        context,
        visibleArea,
        event,
        frame.origin.y,
        scaleFactor,
        event === _hoveredEvent,
      );
    });
  }

  /**
   * @private
   */
  _handleMouseMove(interaction: MouseMoveInteraction, viewRefs: ViewRefs) {
    const {frame, _intrinsicSize, onHover, visibleArea} = this;
    if (!onHover) {
      return;
    }

    const {location} = interaction.payload;
    if (!rectContainsPoint(location, visibleArea)) {
      onHover(null);
      return;
    }

    const scaleFactor = positioningScaleFactor(_intrinsicSize.width, frame);
    const hoverTimestamp = positionToTimestamp(location.x, scaleFactor, frame);

    const adjustedCanvasMouseY = location.y - frame.origin.y;
    const depth = Math.floor(adjustedCanvasMouseY / ROW_WITH_BORDER_HEIGHT);
    const suspenseEventsAtDepth = this._depthToSuspenseEvent.get(depth);

    if (suspenseEventsAtDepth) {
      // Find the event being hovered over.
      for (let index = suspenseEventsAtDepth.length - 1; index >= 0; index--) {
        const suspenseEvent = suspenseEventsAtDepth[index];
        const {duration, timestamp} = suspenseEvent;

        if (
          hoverTimestamp >= timestamp &&
          hoverTimestamp <= timestamp + duration
        ) {
          this.currentCursor = 'pointer';

          viewRefs.hoveredView = this;

          onHover(suspenseEvent);
          return;
        }
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
