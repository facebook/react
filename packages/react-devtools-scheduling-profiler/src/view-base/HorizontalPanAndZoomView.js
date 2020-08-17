/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Interaction,
  MouseDownInteraction,
  MouseMoveInteraction,
  MouseUpInteraction,
  WheelPlainInteraction,
  WheelWithShiftInteraction,
  WheelWithControlInteraction,
  WheelWithMetaInteraction,
} from './useCanvasInteraction';
import type {Rect} from './geometry';

import {Surface} from './Surface';
import {View} from './View';
import {rectContainsPoint} from './geometry';
import {clamp} from './utils/clamp';
import {
  MIN_ZOOM_LEVEL,
  MAX_ZOOM_LEVEL,
  MOVE_WHEEL_DELTA_THRESHOLD,
} from './constants';

type HorizontalPanAndZoomState = $ReadOnly<{|
  /** Horizontal offset; positive in the left direction */
  offsetX: number,
  zoomLevel: number,
|}>;

export type HorizontalPanAndZoomViewOnChangeCallback = (
  state: HorizontalPanAndZoomState,
  view: HorizontalPanAndZoomView,
) => void;

function panAndZoomStatesAreEqual(
  state1: HorizontalPanAndZoomState,
  state2: HorizontalPanAndZoomState,
): boolean {
  return (
    state1.offsetX === state2.offsetX && state1.zoomLevel === state2.zoomLevel
  );
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

  _onStateChange: HorizontalPanAndZoomViewOnChangeCallback = () => {};

  constructor(
    surface: Surface,
    frame: Rect,
    contentView: View,
    intrinsicContentWidth: number,
    onStateChange?: HorizontalPanAndZoomViewOnChangeCallback,
  ) {
    super(surface, frame);
    this.addSubview(contentView);
    this._intrinsicContentWidth = intrinsicContentWidth;
    if (onStateChange) this._onStateChange = onStateChange;
  }

  setFrame(newFrame: Rect) {
    super.setFrame(newFrame);

    // Revalidate panAndZoomState
    this._setStateAndInformCallbacksIfChanged(this._panAndZoomState);
  }

  setPanAndZoomState(proposedState: HorizontalPanAndZoomState) {
    this._setPanAndZoomState(proposedState);
  }

  /**
   * Just sets pan and zoom state. Use `_setStateAndInformCallbacksIfChanged`
   * if this view's callbacks should also be called.
   *
   * @returns Whether state was changed
   * @private
   */
  _setPanAndZoomState(proposedState: HorizontalPanAndZoomState): boolean {
    const clampedState = this._clampedProposedState(proposedState);
    if (panAndZoomStatesAreEqual(clampedState, this._panAndZoomState)) {
      return false;
    }
    this._panAndZoomState = clampedState;
    this.setNeedsDisplay();
    return true;
  }

  /**
   * @private
   */
  _setStateAndInformCallbacksIfChanged(
    proposedState: HorizontalPanAndZoomState,
  ) {
    if (this._setPanAndZoomState(proposedState)) {
      this._onStateChange(this._panAndZoomState, this);
    }
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

  /**
   * Zoom to a specific range of the content specified as a range of the
   * content view's intrinsic content size.
   *
   * Does not inform callbacks of state change since this is a public API.
   */
  zoomToRange(startX: number, endX: number) {
    // Zoom and offset must be done separately, so that if the zoom level is
    // clamped the offset will still be correct (unless it gets clamped too).
    const zoomClampedState = this._clampedProposedStateZoomLevel({
      ...this._panAndZoomState,
      // Let:
      //   I = intrinsic content width, i = zoom range = (endX - startX).
      //   W = contentView's final zoomed width, w = this view's width
      // Goal: we want the visible width w to only contain the requested range i.
      // Derivation:
      // (1)  i/I = w/W           (by intuitive definition of variables)
      // (2)  W = zoomLevel * I   (definition of zoomLevel)
      //      => zoomLevel = W/I  (algebraic manipulation)
      //                   = w/i  (rearranging (1))
      zoomLevel: this.frame.size.width / (endX - startX),
    });
    const offsetAdjustedState = this._clampedProposedStateOffsetX({
      ...zoomClampedState,
      offsetX: -startX * zoomClampedState.zoomLevel,
    });
    this._setPanAndZoomState(offsetAdjustedState);
  }

  _handleMouseDown(interaction: MouseDownInteraction) {
    if (rectContainsPoint(interaction.payload.location, this.frame)) {
      this._isPanning = true;
    }
  }

  _handleMouseMove(interaction: MouseMoveInteraction) {
    if (!this._isPanning) {
      return;
    }
    const {offsetX} = this._panAndZoomState;
    const {movementX} = interaction.payload.event;
    this._setStateAndInformCallbacksIfChanged({
      ...this._panAndZoomState,
      offsetX: offsetX + movementX,
    });
  }

  _handleMouseUp(interaction: MouseUpInteraction) {
    if (this._isPanning) {
      this._isPanning = false;
    }
  }

  _handleWheelPlain(interaction: WheelPlainInteraction) {
    const {
      location,
      delta: {deltaX, deltaY},
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

    this._setStateAndInformCallbacksIfChanged({
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
      delta: {deltaY},
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

    this._setStateAndInformCallbacksIfChanged(offsetAdjustedState);
  }

  handleInteraction(interaction: Interaction) {
    switch (interaction.type) {
      case 'mousedown':
        this._handleMouseDown(interaction);
        break;
      case 'mousemove':
        this._handleMouseMove(interaction);
        break;
      case 'mouseup':
        this._handleMouseUp(interaction);
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
