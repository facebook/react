// @flow

import type {Interaction, HoverInteraction} from '../../useCanvasInteraction';
import type {
  Flamechart,
  FlamechartStackFrame,
  FlamechartStackLayer,
} from '../../types';
import type {Rect, Size} from '../../layout';

import {
  ColorView,
  View,
  Surface,
  StaticLayoutView,
  rectContainsPoint,
  rectEqualToRect,
  rectIntersectsRect,
  rectIntersectionWithRect,
  layeredLayout,
  verticallyStackedLayout,
} from '../../layout';
import {
  durationToWidth,
  positioningScaleFactor,
  timestampToPosition,
  trimFlamechartText,
} from '../canvasUtils';
import {
  COLORS,
  FLAMECHART_FONT_SIZE,
  FLAMECHART_FRAME_HEIGHT,
  FLAMECHART_TEXT_PADDING,
  REACT_WORK_BORDER_SIZE,
} from '../constants';

class FlamechartStackLayerView extends View {
  /** Layer to display */
  stackLayer: FlamechartStackLayer;

  /** A set of `stackLayer`'s frames, for efficient lookup. */
  stackFrameSet: Set<FlamechartStackFrame>;

  intrinsicSize: Size;

  hoveredStackFrame: FlamechartStackFrame | null = null;
  onHover: ((node: FlamechartStackFrame | null) => void) | null = null;

  constructor(
    surface: Surface,
    frame: Rect,
    stackLayer: FlamechartStackLayer,
    duration: number,
  ) {
    super(surface, frame);
    this.stackLayer = stackLayer;
    this.stackFrameSet = new Set(stackLayer);
    this.intrinsicSize = {
      width: duration,
      height: FLAMECHART_FRAME_HEIGHT,
    };
  }

  desiredSize() {
    return this.intrinsicSize;
  }

  setHoveredFlamechartStackFrame(
    hoveredStackFrame: FlamechartStackFrame | null,
  ) {
    if (this.hoveredStackFrame === hoveredStackFrame) {
      return; // We're already hovering over this frame
    }

    // Only care about frames displayed by this view.
    const stackFrameToSet =
      hoveredStackFrame && this.stackFrameSet.has(hoveredStackFrame)
        ? hoveredStackFrame
        : null;
    if (this.hoveredStackFrame === stackFrameToSet) {
      return; // Resulting state is unchanged
    }
    this.hoveredStackFrame = stackFrameToSet;
    this.setNeedsDisplay();
  }

  draw(context: CanvasRenderingContext2D) {
    const {
      frame,
      stackLayer,
      hoveredStackFrame,
      intrinsicSize,
      visibleArea,
    } = this;

    context.fillStyle = COLORS.BACKGROUND;
    context.fillRect(
      visibleArea.origin.x,
      visibleArea.origin.y,
      visibleArea.size.width,
      visibleArea.size.height,
    );

    context.textAlign = 'left';
    context.textBaseline = 'middle';
    context.font = `${FLAMECHART_FONT_SIZE}px sans-serif`;

    const scaleFactor = positioningScaleFactor(intrinsicSize.width, frame);

    for (let i = 0; i < stackLayer.length; i++) {
      const {name, timestamp, duration} = stackLayer[i];

      const width = durationToWidth(duration, scaleFactor);
      if (width < 1) {
        continue; // Too small to render at this zoom level
      }

      const x = Math.floor(timestampToPosition(timestamp, scaleFactor, frame));
      const nodeRect: Rect = {
        origin: {x, y: frame.origin.y},
        size: {
          width: Math.floor(width - REACT_WORK_BORDER_SIZE),
          height: Math.floor(FLAMECHART_FRAME_HEIGHT - REACT_WORK_BORDER_SIZE),
        },
      };
      if (!rectIntersectsRect(nodeRect, visibleArea)) {
        continue; // Not in view
      }

      const showHoverHighlight = hoveredStackFrame === stackLayer[i];
      context.fillStyle = showHoverHighlight
        ? COLORS.FLAME_CHART_HOVER
        : COLORS.FLAME_CHART;

      const drawableRect = rectIntersectionWithRect(nodeRect, visibleArea);
      context.fillRect(
        drawableRect.origin.x,
        drawableRect.origin.y,
        drawableRect.size.width,
        drawableRect.size.height,
      );

      if (width > FLAMECHART_TEXT_PADDING * 2) {
        const trimmedName = trimFlamechartText(
          context,
          name,
          width - FLAMECHART_TEXT_PADDING * 2 + (x < 0 ? x : 0),
        );

        if (trimmedName !== null) {
          context.fillStyle = COLORS.PRIORITY_LABEL;

          // Prevent text from being drawn outside `viewableArea`
          const textOverflowsViewableArea = !rectEqualToRect(
            drawableRect,
            nodeRect,
          );
          if (textOverflowsViewableArea) {
            context.save();
            context.rect(
              drawableRect.origin.x,
              drawableRect.origin.y,
              drawableRect.size.width,
              drawableRect.size.height,
            );
            context.clip();
          }

          context.fillText(
            trimmedName,
            nodeRect.origin.x + FLAMECHART_TEXT_PADDING - (x < 0 ? x : 0),
            nodeRect.origin.y + FLAMECHART_FRAME_HEIGHT / 2,
          );

          if (textOverflowsViewableArea) {
            context.restore();
          }
        }
      }
    }
  }

  /**
   * @private
   */
  handleHover(interaction: HoverInteraction) {
    const {stackLayer, frame, intrinsicSize, onHover, visibleArea} = this;
    const {location} = interaction.payload;
    if (!onHover || !rectContainsPoint(location, visibleArea)) {
      return;
    }

    // Find the node being hovered over.
    const scaleFactor = positioningScaleFactor(intrinsicSize.width, frame);
    let startIndex = 0;
    let stopIndex = stackLayer.length - 1;
    while (startIndex <= stopIndex) {
      const currentIndex = Math.floor((startIndex + stopIndex) / 2);
      const flamechartStackFrame = stackLayer[currentIndex];
      const {timestamp, duration} = flamechartStackFrame;

      const width = durationToWidth(duration, scaleFactor);
      const x = Math.floor(timestampToPosition(timestamp, scaleFactor, frame));
      if (x <= location.x && x + width >= location.x) {
        onHover(flamechartStackFrame);
        return;
      }

      if (x > location.x) {
        stopIndex = currentIndex - 1;
      } else {
        startIndex = currentIndex + 1;
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

export class FlamechartView extends View {
  flamechart: Flamechart;
  duration: number;

  intrinsicSize: Size;

  flamechartRowViews: FlamechartStackLayerView[] = [];
  /** Container view that vertically stacks flamechart rows */
  verticalStackView: StaticLayoutView;
  /** View that layers a background color view behind `verticalStackView` */
  layerStackView: StaticLayoutView;

  onHover: ((node: FlamechartStackFrame | null) => void) | null = null;

  constructor(
    surface: Surface,
    frame: Rect,
    flamechart: Flamechart,
    duration: number,
  ) {
    super(surface, frame);
    this.flamechart = flamechart;
    this.duration = duration;
    this.intrinsicSize = {
      width: duration,
      height: this.flamechart.length * FLAMECHART_FRAME_HEIGHT,
    };

    this.verticalStackView = new StaticLayoutView(
      surface,
      frame,
      verticallyStackedLayout,
      [],
    );

    // Use a plain background view to prevent gaps from appearing between
    // flamechartRowViews.
    const colorView = new ColorView(surface, frame, COLORS.BACKGROUND);
    this.layerStackView = new StaticLayoutView(surface, frame, layeredLayout, [
      colorView,
      this.verticalStackView,
    ]);
    this.layerStackView.superview = this;
  }

  desiredSize() {
    // TODO: Replace this with one calculated by verticalStackView
    return this.intrinsicSize;
  }

  setHoveredFlamechartStackFrame(
    hoveredStackFrame: FlamechartStackFrame | null,
  ) {
    this.flamechartRowViews.forEach(rowView =>
      rowView.setHoveredFlamechartStackFrame(hoveredStackFrame),
    );
  }

  setOnHover(onHover: (node: FlamechartStackFrame | null) => void) {
    this.onHover = onHover;
    this.flamechartRowViews.forEach(rowView => (rowView.onHover = onHover));
  }

  setNeedsDisplay() {
    super.setNeedsDisplay();
    this.layerStackView.setNeedsDisplay();
  }

  layoutSubviews() {
    if (this.flamechartRowViews.length !== this.flamechart.length) {
      // TODO: Remove existing row views from verticalStackView
      this.flamechartRowViews = this.flamechart.map(stackLayer => {
        const rowView = new FlamechartStackLayerView(
          this.surface,
          this.frame,
          stackLayer,
          this.duration,
        );
        this.verticalStackView.addSubview(rowView);
        rowView.onHover = this.onHover;
        return rowView;
      });
      this.setNeedsDisplay();
    }

    // Lay out subviews
    const {layerStackView} = this;
    layerStackView.setFrame(this.frame);
    layerStackView.setVisibleArea(this.visibleArea);
  }

  draw(context: CanvasRenderingContext2D) {
    this.layerStackView.displayIfNeeded(context);
  }

  /**
   * @private
   */
  handleHover(interaction: HoverInteraction) {
    const {onHover, visibleArea} = this;
    if (!onHover) {
      return;
    }

    const {location} = interaction.payload;
    if (!rectContainsPoint(location, visibleArea)) {
      // Clear out any hovered flamechart stack frame
      onHover(null);
    }
  }

  handleInteractionAndPropagateToSubviews(interaction: Interaction) {
    switch (interaction.type) {
      case 'hover':
        this.handleHover(interaction);
        break;
    }
    this.layerStackView.handleInteractionAndPropagateToSubviews(interaction);
  }
}
