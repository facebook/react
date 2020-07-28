// @flow

import type {Interaction, HoverInteraction} from '../../useCanvasInteraction';
import type {
  Flamechart,
  FlamechartStackFrame,
  ReactProfilerData,
} from '../../types';
import type {Rect, Size} from '../../layout';

import {
  View,
  Surface,
  rectContainsPoint,
  rectEqualToRect,
  rectIntersectsRect,
  rectIntersectionWithRect,
} from '../../layout';
import {
  durationToWidth,
  positioningScaleFactor,
  timestampToPosition,
  trimFlamegraphText,
} from '../canvasUtils';
import {
  COLORS,
  FLAMECHART_FONT_SIZE,
  FLAMECHART_FRAME_HEIGHT,
  FLAMECHART_TEXT_PADDING,
  REACT_WORK_BORDER_SIZE,
} from '../constants';

export class FlamegraphView extends View {
  flamechart: Flamechart;
  profilerData: ReactProfilerData;
  intrinsicSize: Size;

  hoveredStackFrame: FlamechartStackFrame | null = null;
  onHover: ((node: FlamechartStackFrame | null) => void) | null = null;

  constructor(
    surface: Surface,
    frame: Rect,
    flamechart: Flamechart,
    profilerData: ReactProfilerData,
  ) {
    super(surface, frame);
    this.flamechart = flamechart;
    this.profilerData = profilerData;
    this.intrinsicSize = {
      width: this.profilerData.duration,
      height: this.flamechart.length * FLAMECHART_FRAME_HEIGHT,
    };
  }

  desiredSize() {
    return this.intrinsicSize;
  }

  setHoveredFlamechartNode(hoveredStackFrame: FlamechartStackFrame | null) {
    if (this.hoveredStackFrame === hoveredStackFrame) {
      return;
    }
    this.hoveredStackFrame = hoveredStackFrame;
    this.setNeedsDisplay();
  }

  draw(context: CanvasRenderingContext2D) {
    const {
      frame,
      flamechart,
      hoveredStackFrame: hoveredFlamechartNode,
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

    for (let i = 0; i < flamechart.length; i++) {
      const stackLayer = flamechart[i];

      const layerY = Math.floor(frame.origin.y + i * FLAMECHART_FRAME_HEIGHT);
      if (
        layerY + FLAMECHART_FRAME_HEIGHT < visibleArea.origin.y ||
        visibleArea.origin.y + visibleArea.size.height < layerY
      ) {
        continue; // Not in view
      }

      for (let j = 0; j < stackLayer.length; j++) {
        const {name, timestamp, duration} = stackLayer[j];

        const width = durationToWidth(duration, scaleFactor);
        if (width < 1) {
          continue; // Too small to render at this zoom level
        }

        const x = Math.floor(
          timestampToPosition(timestamp, scaleFactor, frame),
        );
        const nodeRect: Rect = {
          origin: {x, y: layerY},
          size: {
            width: Math.floor(width - REACT_WORK_BORDER_SIZE),
            height: Math.floor(
              FLAMECHART_FRAME_HEIGHT - REACT_WORK_BORDER_SIZE,
            ),
          },
        };
        if (!rectIntersectsRect(nodeRect, visibleArea)) {
          continue; // Not in view
        }

        const showHoverHighlight = hoveredFlamechartNode === stackLayer[j];
        context.fillStyle = showHoverHighlight
          ? COLORS.FLAME_GRAPH_HOVER
          : COLORS.FLAME_GRAPH;

        const drawableRect = rectIntersectionWithRect(nodeRect, visibleArea);
        context.fillRect(
          drawableRect.origin.x,
          drawableRect.origin.y,
          drawableRect.size.width,
          drawableRect.size.height,
        );

        if (width > FLAMECHART_TEXT_PADDING * 2) {
          const trimmedName = trimFlamegraphText(
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
              x + FLAMECHART_TEXT_PADDING - (x < 0 ? x : 0),
              layerY + FLAMECHART_FRAME_HEIGHT / 2,
            );

            if (textOverflowsViewableArea) {
              context.restore();
            }
          }
        }
      }
    }
  }

  /**
   * @private
   */
  handleHover(interaction: HoverInteraction) {
    const {flamechart, frame, intrinsicSize, onHover, visibleArea} = this;
    if (!onHover) {
      return;
    }

    const {location} = interaction.payload;
    if (!rectContainsPoint(location, visibleArea)) {
      onHover(null);
      return;
    }

    // Identify the layer being hovered over
    const adjustedCanvasMouseY = location.y - frame.origin.y;
    const layerIndex = Math.floor(
      adjustedCanvasMouseY / FLAMECHART_FRAME_HEIGHT,
    );
    if (layerIndex < 0 || layerIndex >= flamechart.length) {
      onHover(null);
      return;
    }
    const layer = flamechart[layerIndex];

    if (!layer) {
      return null;
    }

    // Find the node being hovered over.
    const scaleFactor = positioningScaleFactor(intrinsicSize.width, frame);
    let startIndex = 0;
    let stopIndex = layer.length - 1;
    while (startIndex <= stopIndex) {
      const currentIndex = Math.floor((startIndex + stopIndex) / 2);
      const flamechartStackFrame = layer[currentIndex];
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
