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
  durationToWidth,
  positioningScaleFactor,
  positionToTimestamp,
  timestampToPosition,
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
  TEXT_PADDING,
  NATIVE_EVENT_HEIGHT,
  FONT_SIZE,
  BORDER_SIZE,
} from './constants';

const ROW_WITH_BORDER_HEIGHT = NATIVE_EVENT_HEIGHT + BORDER_SIZE;

// TODO (scheduling profiler) Make this a reusable util
const cachedFlamechartTextWidths = new Map();
const trimFlamechartText = (
  context: CanvasRenderingContext2D,
  text: string,
  width: number,
) => {
  for (let i = text.length - 1; i >= 0; i--) {
    const trimmedText = i === text.length - 1 ? text : text.substr(0, i) + '…';

    let measuredWidth = cachedFlamechartTextWidths.get(trimmedText);
    if (measuredWidth == null) {
      measuredWidth = context.measureText(trimmedText).width;
      cachedFlamechartTextWidths.set(trimmedText, measuredWidth);
    }

    if (measuredWidth <= width) {
      return trimmedText;
    }
  }

  return null;
};

export class NativeEventsView extends View {
  _depthToNativeEvent: Map<number, NativeEvent[]>;
  _hoveredEvent: NativeEvent | null = null;
  _intrinsicSize: Size;
  _maxDepth: number = 0;
  _profilerData: ReactProfilerData;

  onHover: ((event: NativeEvent | null) => void) | null = null;

  constructor(surface: Surface, frame: Rect, profilerData: ReactProfilerData) {
    super(surface, frame);

    this._profilerData = profilerData;

    this._performPreflightComputations();
    console.log(this._depthToNativeEvent);
  }

  _performPreflightComputations() {
    this._depthToNativeEvent = new Map();

    const {duration, nativeEvents} = this._profilerData;

    nativeEvents.forEach(event => {
      const depth = event.depth;

      this._maxDepth = Math.max(this._maxDepth, depth);

      if (!this._depthToNativeEvent.has(depth)) {
        this._depthToNativeEvent.set(depth, [event]);
      } else {
        // $FlowFixMe This is unnecessary.
        this._depthToNativeEvent.get(depth).push(event);
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
    const {depth, duration, highlight, timestamp, type} = event;

    baseY += depth * ROW_WITH_BORDER_HEIGHT;

    const xStart = timestampToPosition(timestamp, scaleFactor, frame);
    const xStop = timestampToPosition(timestamp + duration, scaleFactor, frame);
    const eventRect: Rect = {
      origin: {
        x: xStart,
        y: baseY,
      },
      size: {width: xStop - xStart, height: NATIVE_EVENT_HEIGHT},
    };
    if (!rectIntersectsRect(eventRect, rect)) {
      return; // Not in view
    }

    const width = durationToWidth(duration, scaleFactor);
    if (width < 1) {
      return; // Too small to render at this zoom level
    }

    const drawableRect = intersectionOfRects(eventRect, rect);
    context.beginPath();
    if (highlight) {
      context.fillStyle = showHoverHighlight
        ? COLORS.NATIVE_EVENT_WARNING_HOVER
        : COLORS.NATIVE_EVENT_WARNING;
    } else {
      context.fillStyle = showHoverHighlight
        ? COLORS.NATIVE_EVENT_HOVER
        : COLORS.NATIVE_EVENT;
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
      const trimmedName = trimFlamechartText(
        context,
        type,
        width - TEXT_PADDING * 2 + (x < 0 ? x : 0),
      );

      if (trimmedName !== null) {
        context.fillStyle = highlight
          ? COLORS.NATIVE_EVENT_WARNING_TEXT
          : COLORS.TEXT_COLOR;

        context.fillText(
          trimmedName,
          eventRect.origin.x + TEXT_PADDING - (x < 0 ? x : 0),
          eventRect.origin.y + NATIVE_EVENT_HEIGHT / 2,
        );
      }
    }
  }

  draw(context: CanvasRenderingContext2D) {
    const {
      frame,
      _profilerData: {nativeEvents},
      _hoveredEvent,
      visibleArea,
    } = this;

    context.fillStyle = COLORS.PRIORITY_BACKGROUND;
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

    nativeEvents.forEach(event => {
      this._drawSingleNativeEvent(
        context,
        visibleArea,
        event,
        frame.origin.y,
        scaleFactor,
        event === _hoveredEvent,
      );
    });

    // Render bottom borders.
    for (let i = 0; i <= this._maxDepth; i++) {
      const borderFrame: Rect = {
        origin: {
          x: frame.origin.x,
          y: frame.origin.y + NATIVE_EVENT_HEIGHT,
        },
        size: {
          width: frame.size.width,
          height: BORDER_SIZE,
        },
      };
      if (rectIntersectsRect(borderFrame, visibleArea)) {
        context.fillStyle = COLORS.PRIORITY_BORDER;
        context.fillRect(
          visibleArea.origin.x,
          frame.origin.y + (i + 1) * ROW_WITH_BORDER_HEIGHT - BORDER_SIZE,
          visibleArea.size.width,
          BORDER_SIZE,
        );
      }
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

    const scaleFactor = positioningScaleFactor(_intrinsicSize.width, frame);
    const hoverTimestamp = positionToTimestamp(location.x, scaleFactor, frame);

    const adjustedCanvasMouseY = location.y - frame.origin.y;
    const depth = Math.floor(adjustedCanvasMouseY / ROW_WITH_BORDER_HEIGHT);
    const nativeEventsAtDepth = this._depthToNativeEvent.get(depth);

    if (nativeEventsAtDepth) {
      // Find the event being hovered over.
      for (let index = nativeEventsAtDepth.length - 1; index >= 0; index--) {
        const nativeEvent = nativeEventsAtDepth[index];
        const {duration, timestamp} = nativeEvent;

        if (
          hoverTimestamp >= timestamp &&
          hoverTimestamp <= timestamp + duration
        ) {
          onHover(nativeEvent);
          return;
        }
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
