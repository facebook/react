/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Flamechart,
  FlamechartStackFrame,
  FlamechartStackLayer,
  InternalModuleSourceToRanges,
} from '../types';
import type {
  Interaction,
  MouseMoveInteraction,
  Rect,
  Size,
  ViewRefs,
} from '../view-base';

import {
  BackgroundColorView,
  Surface,
  View,
  layeredLayout,
  rectContainsPoint,
  intersectionOfRects,
  rectIntersectsRect,
  verticallyStackedLayout,
} from '../view-base';
import {isInternalModule} from './utils/moduleFilters';
import {
  durationToWidth,
  positioningScaleFactor,
  timestampToPosition,
} from './utils/positioning';
import {drawText} from './utils/text';
import {
  COLORS,
  FLAMECHART_FRAME_HEIGHT,
  COLOR_HOVER_DIM_DELTA,
  BORDER_SIZE,
} from './constants';
import {ColorGenerator, dimmedColor, hslaColorToString} from './utils/colors';

// Source: https://source.chromium.org/chromium/chromium/src/+/master:out/Debug/gen/devtools/timeline/TimelineUIUtils.js;l=2109;drc=fb32e928d79707a693351b806b8710b2f6b7d399
const colorGenerator = new ColorGenerator(
  {min: 30, max: 330},
  {min: 50, max: 80, count: 3},
  85,
);
colorGenerator.setColorForID('', {h: 43.6, s: 45.8, l: 90.6, a: 100});

function defaultHslaColorForStackFrame({scriptUrl}: FlamechartStackFrame) {
  return colorGenerator.colorForID(scriptUrl ?? '');
}

function defaultColorForStackFrame(stackFrame: FlamechartStackFrame): string {
  const color = defaultHslaColorForStackFrame(stackFrame);
  return hslaColorToString(color);
}

function hoverColorForStackFrame(stackFrame: FlamechartStackFrame): string {
  const color = dimmedColor(
    defaultHslaColorForStackFrame(stackFrame),
    COLOR_HOVER_DIM_DELTA,
  );
  return hslaColorToString(color);
}

class FlamechartStackLayerView extends View {
  /** Layer to display */
  _stackLayer: FlamechartStackLayer;

  /** A set of `stackLayer`'s frames, for efficient lookup. */
  _stackFrameSet: Set<FlamechartStackFrame>;

  _internalModuleSourceToRanges: InternalModuleSourceToRanges;

  _intrinsicSize: Size;

  _hoveredStackFrame: FlamechartStackFrame | null = null;
  _onHover: ((node: FlamechartStackFrame | null) => void) | null = null;

  constructor(
    surface: Surface,
    frame: Rect,
    stackLayer: FlamechartStackLayer,
    internalModuleSourceToRanges: InternalModuleSourceToRanges,
    duration: number,
  ) {
    super(surface, frame);
    this._stackLayer = stackLayer;
    this._stackFrameSet = new Set(stackLayer);
    this._internalModuleSourceToRanges = internalModuleSourceToRanges;
    this._intrinsicSize = {
      width: duration,
      height: FLAMECHART_FRAME_HEIGHT,
    };
  }

  desiredSize(): Size {
    return this._intrinsicSize;
  }

  setHoveredFlamechartStackFrame(
    hoveredStackFrame: FlamechartStackFrame | null,
  ) {
    if (this._hoveredStackFrame === hoveredStackFrame) {
      return; // We're already hovering over this frame
    }

    // Only care about frames displayed by this view.
    const stackFrameToSet =
      hoveredStackFrame && this._stackFrameSet.has(hoveredStackFrame)
        ? hoveredStackFrame
        : null;
    if (this._hoveredStackFrame === stackFrameToSet) {
      return; // Resulting state is unchanged
    }
    this._hoveredStackFrame = stackFrameToSet;
    this.setNeedsDisplay();
  }

  draw(context: CanvasRenderingContext2D) {
    const {
      frame,
      _stackLayer,
      _hoveredStackFrame,
      _intrinsicSize,
      visibleArea,
    } = this;

    context.fillStyle = COLORS.PRIORITY_BACKGROUND;
    context.fillRect(
      visibleArea.origin.x,
      visibleArea.origin.y,
      visibleArea.size.width,
      visibleArea.size.height,
    );

    const scaleFactor = positioningScaleFactor(_intrinsicSize.width, frame);

    for (let i = 0; i < _stackLayer.length; i++) {
      const stackFrame = _stackLayer[i];
      const {name, timestamp, duration} = stackFrame;

      const width = durationToWidth(duration, scaleFactor);
      if (width < 1) {
        continue; // Too small to render at this zoom level
      }

      const x = Math.floor(timestampToPosition(timestamp, scaleFactor, frame));
      const nodeRect: Rect = {
        origin: {x, y: frame.origin.y},
        size: {
          width: Math.floor(width - BORDER_SIZE),
          height: Math.floor(FLAMECHART_FRAME_HEIGHT - BORDER_SIZE),
        },
      };
      if (!rectIntersectsRect(nodeRect, visibleArea)) {
        continue; // Not in view
      }

      const showHoverHighlight = _hoveredStackFrame === _stackLayer[i];

      let textFillStyle;
      if (isInternalModule(this._internalModuleSourceToRanges, stackFrame)) {
        context.fillStyle = showHoverHighlight
          ? COLORS.INTERNAL_MODULE_FRAME_HOVER
          : COLORS.INTERNAL_MODULE_FRAME;
        textFillStyle = COLORS.INTERNAL_MODULE_FRAME_TEXT;
      } else {
        context.fillStyle = showHoverHighlight
          ? hoverColorForStackFrame(stackFrame)
          : defaultColorForStackFrame(stackFrame);
        textFillStyle = COLORS.TEXT_COLOR;
      }

      const drawableRect = intersectionOfRects(nodeRect, visibleArea);
      context.fillRect(
        drawableRect.origin.x,
        drawableRect.origin.y,
        drawableRect.size.width,
        drawableRect.size.height,
      );

      drawText(name, context, nodeRect, drawableRect, {
        fillStyle: textFillStyle,
      });
    }

    // Render bottom border.
    const borderFrame: Rect = {
      origin: {
        x: frame.origin.x,
        y: frame.origin.y + FLAMECHART_FRAME_HEIGHT - BORDER_SIZE,
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
  _handleMouseMove(interaction: MouseMoveInteraction, viewRefs: ViewRefs) {
    const {_stackLayer, frame, _intrinsicSize, _onHover, visibleArea} = this;
    const {location} = interaction.payload;
    if (!_onHover || !rectContainsPoint(location, visibleArea)) {
      return;
    }

    // Find the node being hovered over.
    const scaleFactor = positioningScaleFactor(_intrinsicSize.width, frame);
    let startIndex = 0;
    let stopIndex = _stackLayer.length - 1;
    while (startIndex <= stopIndex) {
      const currentIndex = Math.floor((startIndex + stopIndex) / 2);
      const flamechartStackFrame = _stackLayer[currentIndex];
      const {timestamp, duration} = flamechartStackFrame;

      const x = Math.floor(timestampToPosition(timestamp, scaleFactor, frame));
      const width = durationToWidth(duration, scaleFactor);

      // Don't show tooltips for nodes that are too small to render at this zoom level.
      if (Math.floor(width - BORDER_SIZE) >= 1) {
        if (x <= location.x && x + width >= location.x) {
          this.currentCursor = 'context-menu';
          viewRefs.hoveredView = this;
          _onHover(flamechartStackFrame);
          return;
        }
      }

      if (x > location.x) {
        stopIndex = currentIndex - 1;
      } else {
        startIndex = currentIndex + 1;
      }
    }

    _onHover(null);
  }

  _didGrab: boolean = false;

  handleInteraction(interaction: Interaction, viewRefs: ViewRefs) {
    switch (interaction.type) {
      case 'mousemove':
        this._handleMouseMove(interaction, viewRefs);
        break;
    }
  }
}

export class FlamechartView extends View {
  _flamechartRowViews: FlamechartStackLayerView[] = [];

  /** Container view that vertically stacks flamechart rows */
  _verticalStackView: View;

  _hoveredStackFrame: FlamechartStackFrame | null = null;
  _onHover: ((node: FlamechartStackFrame | null) => void) | null = null;

  constructor(
    surface: Surface,
    frame: Rect,
    flamechart: Flamechart,
    internalModuleSourceToRanges: InternalModuleSourceToRanges,
    duration: number,
  ) {
    super(surface, frame, layeredLayout);
    this.setDataAndUpdateSubviews(
      flamechart,
      internalModuleSourceToRanges,
      duration,
    );
  }

  setDataAndUpdateSubviews(
    flamechart: Flamechart,
    internalModuleSourceToRanges: InternalModuleSourceToRanges,
    duration: number,
  ) {
    const {surface, frame, _onHover, _hoveredStackFrame} = this;

    // Clear existing rows on data update
    if (this._verticalStackView) {
      this.removeAllSubviews();
      this._flamechartRowViews = [];
    }

    this._verticalStackView = new View(surface, frame, verticallyStackedLayout);
    this._flamechartRowViews = flamechart.map(stackLayer => {
      const rowView = new FlamechartStackLayerView(
        surface,
        frame,
        stackLayer,
        internalModuleSourceToRanges,
        duration,
      );
      this._verticalStackView.addSubview(rowView);

      // Update states
      rowView._onHover = _onHover;
      rowView.setHoveredFlamechartStackFrame(_hoveredStackFrame);
      return rowView;
    });

    // Add a plain background view to prevent gaps from appearing between flamechartRowViews.
    this.addSubview(new BackgroundColorView(surface, frame));
    this.addSubview(this._verticalStackView);
  }

  setHoveredFlamechartStackFrame(
    hoveredStackFrame: FlamechartStackFrame | null,
  ) {
    this._hoveredStackFrame = hoveredStackFrame;
    this._flamechartRowViews.forEach(rowView =>
      rowView.setHoveredFlamechartStackFrame(hoveredStackFrame),
    );
  }

  setOnHover(onHover: (node: FlamechartStackFrame | null) => void) {
    this._onHover = onHover;
    this._flamechartRowViews.forEach(rowView => (rowView._onHover = onHover));
  }

  desiredSize(): {
    height: number,
    hideScrollBarIfLessThanHeight?: number,
    maxInitialHeight?: number,
    width: number,
  } {
    // Ignore the wishes of the background color view
    const intrinsicSize = this._verticalStackView.desiredSize();
    return {
      ...intrinsicSize,
      // Collapsed by default
      maxInitialHeight: 0,
    };
  }

  /**
   * @private
   */
  _handleMouseMove(interaction: MouseMoveInteraction) {
    const {_onHover, visibleArea} = this;
    if (!_onHover) {
      return;
    }

    const {location} = interaction.payload;
    if (!rectContainsPoint(location, visibleArea)) {
      // Clear out any hovered flamechart stack frame
      _onHover(null);
    }
  }

  handleInteraction(interaction: Interaction) {
    switch (interaction.type) {
      case 'mousemove':
        this._handleMouseMove(interaction);
        break;
    }
  }
}
