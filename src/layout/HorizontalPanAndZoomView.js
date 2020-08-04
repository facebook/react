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
  _intrinsicContentWidth: number;

  _panAndZoomState: HorizontalPanAndZoomState = {
    offsetX: 0,
    zoomLevel: 0.25,
  };

  _isPanning = false;

  _stateDeriver: (
    state: HorizontalPanAndZoomState,
  ) => HorizontalPanAndZoomState = state => state;

  _onStateChange: (state: HorizontalPanAndZoomState) => void = () => {};

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
    this.addSubview(contentView);
    this._intrinsicContentWidth = intrinsicContentWidth;
    if (stateDeriver) this._stateDeriver = stateDeriver;
    if (onStateChange) this._onStateChange = onStateChange;
  }

  setFrame(newFrame: Rect) {
    super.setFrame(newFrame);

    // Revalidate panAndZoomState
    this._updateState(this._panAndZoomState);
  }

  desiredSize() {
    return this._contentView.desiredSize();
  }

  /**
   * Reference to the content view. This view is also the only view in
   * `this.subviews`.
   */
  get _contentView() {
    return this.subviews[0];
  }

  layoutSubviews() {
    const {offsetX, zoomLevel} = this._panAndZoomState;
    const proposedFrame = {
      origin: {
        x: this.frame.origin.x + offsetX,
        y: this.frame.origin.y,
      },
      size: {
        width: zoomLevelAndIntrinsicWidthToFrameWidth(
          zoomLevel,
          this._intrinsicContentWidth,
        ),
        height: this.frame.size.height,
      },
    };
    this._contentView.setFrame(proposedFrame);
    super.layoutSubviews();
  }

  _handleHorizontalPanStart(interaction: HorizontalPanStartInteraction) {
    if (rectContainsPoint(interaction.payload.location, this.frame)) {
      this._isPanning = true;
    }
  }

  _handleHorizontalPanMove(interaction: HorizontalPanMoveInteraction) {
    if (!this._isPanning) {
      return;
    }
    const {offsetX} = this._panAndZoomState;
    const {movementX} = interaction.payload.event;
    this._updateState({
      ...this._panAndZoomState,
      offsetX: offsetX + movementX,
    });
  }

  _handleHorizontalPanEnd(interaction: HorizontalPanEndInteraction) {
    if (this._isPanning) {
      this._isPanning = false;
    }
  }

  _handleWheelPlain(interaction: WheelPlainInteraction) {
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

    this._updateState({
      ...this._panAndZoomState,
      offsetX: this._panAndZoomState.offsetX - deltaX,
    });
  }

  _handleWheelZoom(
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

    const zoomClampedState = this._clampedProposedStateZoomLevel({
      ...this._panAndZoomState,
      zoomLevel: this._panAndZoomState.zoomLevel * (1 + 0.005 * -deltaY),
    });

    // Determine where the mouse is, and adjust the offset so that point stays
    // centered after zooming.
    const oldMouseXInFrame = location.x - zoomClampedState.offsetX;
    const fractionalMouseX =
      oldMouseXInFrame / this._contentView.frame.size.width;
    const newContentWidth = zoomLevelAndIntrinsicWidthToFrameWidth(
      zoomClampedState.zoomLevel,
      this._intrinsicContentWidth,
    );
    const newMouseXInFrame = fractionalMouseX * newContentWidth;

    const offsetAdjustedState = this._clampedProposedStateOffsetX({
      ...zoomClampedState,
      offsetX: location.x - newMouseXInFrame,
    });

    this._updateState(offsetAdjustedState);
  }

  handleInteraction(interaction: Interaction) {
    switch (interaction.type) {
      case 'horizontal-pan-start':
        this._handleHorizontalPanStart(interaction);
        break;
      case 'horizontal-pan-move':
        this._handleHorizontalPanMove(interaction);
        break;
      case 'horizontal-pan-end':
        this._handleHorizontalPanEnd(interaction);
        break;
      case 'wheel-plain':
        this._handleWheelPlain(interaction);
        break;
      case 'wheel-shift':
      case 'wheel-control':
      case 'wheel-meta':
        this._handleWheelZoom(interaction);
        break;
    }
  }

  /**
   * @private
   */
  _updateState(proposedState: HorizontalPanAndZoomState) {
    const clampedState = this._stateDeriver(
      this._clampedProposedState(proposedState),
    );
    if (!panAndZoomStatesAreEqual(clampedState, this._panAndZoomState)) {
      this._panAndZoomState = clampedState;
      this._onStateChange(this._panAndZoomState);
      this.setNeedsDisplay();
    }
  }

  /**
   * @private
   */
  _clampedProposedStateZoomLevel(
    proposedState: HorizontalPanAndZoomState,
  ): HorizontalPanAndZoomState {
    // Content-based min zoom level to ensure that contentView's width >= our width.
    const minContentBasedZoomLevel =
      this.frame.size.width / this._intrinsicContentWidth;
    const minZoomLevel = Math.max(MIN_ZOOM_LEVEL, minContentBasedZoomLevel);
    return {
      ...proposedState,
      zoomLevel: clamp(minZoomLevel, MAX_ZOOM_LEVEL, proposedState.zoomLevel),
    };
  }

  /**
   * @private
   */
  _clampedProposedStateOffsetX(
    proposedState: HorizontalPanAndZoomState,
  ): HorizontalPanAndZoomState {
    const newContentWidth = zoomLevelAndIntrinsicWidthToFrameWidth(
      proposedState.zoomLevel,
      this._intrinsicContentWidth,
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
  _clampedProposedState(
    proposedState: HorizontalPanAndZoomState,
  ): HorizontalPanAndZoomState {
    const zoomClampedState = this._clampedProposedStateZoomLevel(proposedState);
    return this._clampedProposedStateOffsetX(zoomClampedState);
  }
}
