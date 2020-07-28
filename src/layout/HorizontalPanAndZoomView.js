// @flow

import type {
  Interaction,
  HorizontalPanStartInteraction,
  HorizontalPanMoveInteraction,
  HorizontalPanEndInteraction,
  WheelPlainInteraction,
  WheelWithShiftInteraction,
  WheelWithControlInteraction,
  WheelWithMetaInteraction,
} from '../useCanvasInteraction';
import type {Rect} from './geometry';

import {Surface} from './Surface';
import {View} from './View';
import {rectContainsPoint} from './geometry';
import {
  MIN_ZOOM_LEVEL,
  MAX_ZOOM_LEVEL,
  MOVE_WHEEL_DELTA_THRESHOLD,
} from '../canvas/constants'; // TODO: Remove external dependency

type HorizontalPanAndZoomState = {|
  /** Horizontal offset; positive in the left direction */
  offsetX: number,
  zoomLevel: number,
|};

function panAndZoomStatesAreEqual(
  state1: HorizontalPanAndZoomState,
  state2: HorizontalPanAndZoomState,
): boolean {
  return (
    state1.offsetX === state2.offsetX && state1.zoomLevel === state2.zoomLevel
  );
}

function clamp(min: number, max: number, value: number): number {
  if (Number.isNaN(min) || Number.isNaN(max) || Number.isNaN(value)) {
    throw new Error(
      `Clamp was called with NaN. Args: min: ${min}, max: ${max}, value: ${value}.`,
    );
  }
  return Math.min(max, Math.max(min, value));
}

function zoomLevelAndIntrinsicWidthToFrameWidth(
  zoomLevel: number,
  intrinsicWidth: number,
): number {
  return intrinsicWidth * zoomLevel;
}

export class HorizontalPanAndZoomView extends View {
  contentView: View;
  intrinsicContentWidth: number;

  panAndZoomState: HorizontalPanAndZoomState = {
    offsetX: 0,
    zoomLevel: 0.25,
  };

  stateDeriver: (
    state: HorizontalPanAndZoomState,
  ) => HorizontalPanAndZoomState = state => state;

  onStateChange: (state: HorizontalPanAndZoomState) => void = () => {};

  constructor(
    surface: Surface,
    frame: Rect,
    contentView: View,
    intrinsicContentWidth: number,
    stateDeriver?: (
      state: HorizontalPanAndZoomState,
    ) => HorizontalPanAndZoomState,
    onStateChange?: (state: HorizontalPanAndZoomState) => void,
  ) {
    super(surface, frame);
    this.contentView = contentView;
    contentView.superview = this;
    this.intrinsicContentWidth = intrinsicContentWidth;
    if (stateDeriver) this.stateDeriver = stateDeriver;
    if (onStateChange) this.onStateChange = onStateChange;
  }

  setNeedsDisplay() {
    super.setNeedsDisplay();
    this.contentView.setNeedsDisplay();
  }

  setFrame(newFrame: Rect) {
    super.setFrame(newFrame);

    // Revalidate panAndZoomState
    this.updateState(this.panAndZoomState);
  }

  layoutSubviews() {
    const {offsetX, zoomLevel} = this.panAndZoomState;
    const proposedFrame = {
      origin: {
        x: this.frame.origin.x + offsetX,
        y: this.frame.origin.y,
      },
      size: {
        width: zoomLevelAndIntrinsicWidthToFrameWidth(
          zoomLevel,
          this.intrinsicContentWidth,
        ),
        height: this.frame.size.height,
      },
    };
    this.contentView.setFrame(proposedFrame);
    this.contentView.setVisibleArea(this.visibleArea);
  }

  draw(context: CanvasRenderingContext2D) {
    this.contentView.displayIfNeeded(context);
  }

  isPanning = false;

  handleHorizontalPanStart(interaction: HorizontalPanStartInteraction) {
    if (rectContainsPoint(interaction.payload.location, this.frame)) {
      this.isPanning = true;
    }
  }

  handleHorizontalPanMove(interaction: HorizontalPanMoveInteraction) {
    if (!this.isPanning) {
      return;
    }
    const {offsetX} = this.panAndZoomState;
    const {movementX} = interaction.payload.event;
    this.updateState({
      ...this.panAndZoomState,
      offsetX: offsetX + movementX,
    });
  }

  handleHorizontalPanEnd(interaction: HorizontalPanEndInteraction) {
    if (this.isPanning) {
      this.isPanning = false;
    }
  }

  handleWheelPlain(interaction: WheelPlainInteraction) {
    const {
      location,
      event: {deltaX, deltaY},
    } = interaction.payload;
    if (!rectContainsPoint(location, this.frame)) {
      return; // Not scrolling on view
    }

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    if (absDeltaY > absDeltaX) {
      return; // Scrolling vertically
    }

    if (absDeltaX < MOVE_WHEEL_DELTA_THRESHOLD) {
      return;
    }

    this.updateState({
      ...this.panAndZoomState,
      offsetX: this.panAndZoomState.offsetX - deltaX,
    });
  }

  handleWheelZoom(
    interaction:
      | WheelWithShiftInteraction
      | WheelWithControlInteraction
      | WheelWithMetaInteraction,
  ) {
    const {
      location,
      event: {deltaY},
    } = interaction.payload;
    if (!rectContainsPoint(location, this.frame)) {
      return; // Not scrolling on view
    }

    const absDeltaY = Math.abs(deltaY);
    if (absDeltaY < MOVE_WHEEL_DELTA_THRESHOLD) {
      return;
    }

    const zoomClampedState = this.clampedProposedStateZoomLevel({
      ...this.panAndZoomState,
      zoomLevel: this.panAndZoomState.zoomLevel * (1 + 0.005 * -deltaY),
    });

    // Determine where the mouse is, and adjust the offset so that point stays
    // centered after zooming.
    const oldMouseXInFrame = location.x - zoomClampedState.offsetX;
    const fractionalMouseX =
      oldMouseXInFrame / this.contentView.frame.size.width;
    const newContentWidth = zoomLevelAndIntrinsicWidthToFrameWidth(
      zoomClampedState.zoomLevel,
      this.intrinsicContentWidth,
    );
    const newMouseXInFrame = fractionalMouseX * newContentWidth;

    const offsetAdjustedState = this.clampedProposedStateOffsetX({
      ...zoomClampedState,
      offsetX: location.x - newMouseXInFrame,
    });

    this.updateState(offsetAdjustedState);
  }

  handleInteractionAndPropagateToSubviews(interaction: Interaction) {
    switch (interaction.type) {
      case 'horizontal-pan-start':
        this.handleHorizontalPanStart(interaction);
        break;
      case 'horizontal-pan-move':
        this.handleHorizontalPanMove(interaction);
        break;
      case 'horizontal-pan-end':
        this.handleHorizontalPanEnd(interaction);
        break;
      case 'wheel-plain':
        this.handleWheelPlain(interaction);
        break;
      case 'wheel-shift':
      case 'wheel-control':
      case 'wheel-meta':
        this.handleWheelZoom(interaction);
        break;
    }
    this.contentView.handleInteractionAndPropagateToSubviews(interaction);
  }

  /**
   * @private
   */
  updateState(proposedState: HorizontalPanAndZoomState) {
    const clampedState = this.stateDeriver(
      this.clampedProposedState(proposedState),
    );
    if (!panAndZoomStatesAreEqual(clampedState, this.panAndZoomState)) {
      this.panAndZoomState = clampedState;
      this.onStateChange(this.panAndZoomState);
      this.setNeedsDisplay();
    }
  }

  /**
   * @private
   */
  clampedProposedStateZoomLevel(
    proposedState: HorizontalPanAndZoomState,
  ): HorizontalPanAndZoomState {
    // Content-based min zoom level to ensure that contentView's width >= our width.
    const minContentBasedZoomLevel =
      this.frame.size.width / this.intrinsicContentWidth;
    const minZoomLevel = Math.max(MIN_ZOOM_LEVEL, minContentBasedZoomLevel);
    return {
      ...proposedState,
      zoomLevel: clamp(minZoomLevel, MAX_ZOOM_LEVEL, proposedState.zoomLevel),
    };
  }

  /**
   * @private
   */
  clampedProposedStateOffsetX(
    proposedState: HorizontalPanAndZoomState,
  ): HorizontalPanAndZoomState {
    const newContentWidth = zoomLevelAndIntrinsicWidthToFrameWidth(
      proposedState.zoomLevel,
      this.intrinsicContentWidth,
    );
    return {
      ...proposedState,
      offsetX: clamp(
        -(newContentWidth - this.frame.size.width),
        0,
        proposedState.offsetX,
      ),
    };
  }

  /**
   * @private
   */
  clampedProposedState(
    proposedState: HorizontalPanAndZoomState,
  ): HorizontalPanAndZoomState {
    const zoomClampedState = this.clampedProposedStateZoomLevel(proposedState);
    return this.clampedProposedStateOffsetX(zoomClampedState);
  }
}
