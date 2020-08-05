// @flow

import type {
  Interaction,
  MouseMoveInteraction,
} from '../../useCanvasInteraction';
import type {UserTimingMark} from '../../types';
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

// COMBAK: use this viewA

export class UserTimingMarksView extends View {
  _marks: UserTimingMark[];
  _intrinsicSize: Size;

  _hoveredMark: UserTimingMark | null = null;
  onHover: ((mark: UserTimingMark | null) => void) | null = null;

  constructor(
    surface: Surface,
    frame: Rect,
    marks: UserTimingMark[],
    duration: number,
  ) {
    super(surface, frame);
    this._marks = marks;

    this._intrinsicSize = {
      width: duration,
      height: EVENT_ROW_HEIGHT_FIXED,
    };
  }

  desiredSize() {
    return this._intrinsicSize;
  }

  setHoveredMark(hoveredMark: UserTimingMark | null) {
    if (this._hoveredMark === hoveredMark) {
      return;
    }
    this._hoveredMark = hoveredMark;
    this.setNeedsDisplay();
  }

  /**
   * Draw a single `UserTimingMark` as a circle in the canvas.
   */
  _drawSingleMark(
    context: CanvasRenderingContext2D,
    rect: Rect,
    mark: UserTimingMark,
    baseY: number,
    scaleFactor: number,
    showHoverHighlight: boolean,
  ) {
    const {frame} = this;
    const {timestamp} = mark;

    const x = timestampToPosition(timestamp, scaleFactor, frame);
    const radius = REACT_EVENT_SIZE / 2;
    const markRect: Rect = {
      origin: {
        x: x - radius,
        y: baseY,
      },
      size: {width: REACT_EVENT_SIZE, height: REACT_EVENT_SIZE},
    };
    if (!rectIntersectsRect(markRect, rect)) {
      return; // Not in view
    }

    // TODO: Use blue color from Firefox
    const fillStyle = showHoverHighlight
      ? COLORS.USER_TIMING_HOVER
      : COLORS.USER_TIMING;

    if (fillStyle !== null) {
      const y = markRect.origin.y + radius;

      context.beginPath();
      context.fillStyle = fillStyle;
      context.arc(x, y, radius, 0, 2 * Math.PI);
      context.fill();
    }
  }

  draw(context: CanvasRenderingContext2D) {
    const {frame, _marks, _hoveredMark, visibleArea} = this;

    context.fillStyle = COLORS.BACKGROUND;
    context.fillRect(
      visibleArea.origin.x,
      visibleArea.origin.y,
      visibleArea.size.width,
      visibleArea.size.height,
    );

    // Draw marks
    const baseY = frame.origin.y + REACT_EVENT_ROW_PADDING;
    const scaleFactor = positioningScaleFactor(
      this._intrinsicSize.width,
      frame,
    );

    _marks.forEach(mark => {
      if (mark === _hoveredMark) {
        return;
      }
      this._drawSingleMark(
        context,
        visibleArea,
        mark,
        baseY,
        scaleFactor,
        false,
      );
    });

    // Draw the hovered and/or selected items on top so they stand out.
    // This is helpful if there are multiple (overlapping) items close to each other.
    if (_hoveredMark !== null) {
      this._drawSingleMark(
        context,
        visibleArea,
        _hoveredMark,
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

    const {_marks} = this;
    const scaleFactor = positioningScaleFactor(
      this._intrinsicSize.width,
      frame,
    );
    const hoverTimestamp = positionToTimestamp(location.x, scaleFactor, frame);
    const markTimestampAllowance = widthToDuration(
      REACT_EVENT_SIZE / 2,
      scaleFactor,
    );

    // Because data ranges may overlap, we want to find the last intersecting item.
    // This will always be the one on "top" (the one the user is hovering over).
    for (let index = _marks.length - 1; index >= 0; index--) {
      const mark = _marks[index];
      const {timestamp} = mark;

      if (
        timestamp - markTimestampAllowance <= hoverTimestamp &&
        hoverTimestamp <= timestamp + markTimestampAllowance
      ) {
        onHover(mark);
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
