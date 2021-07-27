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
import type {ScrollState} from './utils/scrollState';
import type {ViewRef} from './Surface';

import {Surface} from './Surface';
import {View} from './View';
import {rectContainsPoint} from './geometry';
import {
  clampState,
  moveStateToRange,
  areScrollStatesEqual,
  translateState,
  zoomState,
} from './utils/scrollState';
import {
  DEFAULT_ZOOM_LEVEL,
  MAX_ZOOM_LEVEL,
  MIN_ZOOM_LEVEL,
  MOVE_WHEEL_DELTA_THRESHOLD,
} from './constants';

export type HorizontalPanAndZoomViewOnChangeCallback = (
  state: ScrollState,
  view: HorizontalPanAndZoomView,
) => void;

export class HorizontalPanAndZoomView extends View {
  _intrinsicContentWidth: number;
  _isPanning = false;
  _scrollState: ScrollState = {offset: 0, length: 0};
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
    this._setScrollState({
      offset: 0,
      length: intrinsicContentWidth * DEFAULT_ZOOM_LEVEL,
    });
    if (onStateChange) this._onStateChange = onStateChange;
  }

  setFrame(newFrame: Rect) {
    super.setFrame(newFrame);

    // Revalidate scrollState
    this._setStateAndInformCallbacksIfChanged(this._scrollState);
  }

  setScrollState(proposedState: ScrollState) {
    this._setScrollState(proposedState);
  }

  /**
   * Just sets scroll state. Use `_setStateAndInformCallbacksIfChanged` if this
   * view's callbacks should also be called.
   *
   * @returns Whether state was changed
   * @private
   */
  _setScrollState(proposedState: ScrollState): boolean {
    const clampedState = clampState({
      state: proposedState,
      minContentLength: this._intrinsicContentWidth * MIN_ZOOM_LEVEL,
      maxContentLength: this._intrinsicContentWidth * MAX_ZOOM_LEVEL,
      containerLength: this.frame.size.width,
    });
    if (areScrollStatesEqual(clampedState, this._scrollState)) {
      return false;
    }
    this._scrollState = clampedState;
    this.setNeedsDisplay();
    return true;
  }

  /**
   * @private
   */
  _setStateAndInformCallbacksIfChanged(proposedState: ScrollState) {
    if (this._setScrollState(proposedState)) {
      this._onStateChange(this._scrollState, this);
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
    const {offset, length} = this._scrollState;
    const proposedFrame = {
      origin: {
        x: this.frame.origin.x + offset,
        y: this.frame.origin.y,
      },
      size: {
        width: length,
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
  zoomToRange(rangeStart: number, rangeEnd: number) {
    const newState = moveStateToRange({
      state: this._scrollState,
      rangeStart,
      rangeEnd,
      contentLength: this._intrinsicContentWidth,

      minContentLength: this._intrinsicContentWidth * MIN_ZOOM_LEVEL,
      maxContentLength: this._intrinsicContentWidth * MAX_ZOOM_LEVEL,
      containerLength: this.frame.size.width,
    });
    this._setScrollState(newState);
  }

  _handleMouseDown(
    interaction: MouseDownInteraction,
    activeViewRef: ViewRef,
    hoveredViewRef: ViewRef,
  ) {
    if (rectContainsPoint(interaction.payload.location, this.frame)) {
      this._isPanning = true;

      activeViewRef.current = this;

      this.currentCursor = 'grabbing';
    }
  }

  _handleMouseMove(
    interaction: MouseMoveInteraction,
    activeViewRef: ViewRef,
    hoveredViewRef: ViewRef,
  ) {
    const isHovered = rectContainsPoint(
      interaction.payload.location,
      this.frame,
    );
    if (isHovered) {
      hoveredViewRef.current = this;
    }

    if (activeViewRef.current === this) {
      this.currentCursor = 'grabbing';
    } else if (isHovered) {
      this.currentCursor = 'grab';
    }

    if (!this._isPanning) {
      return;
    }
    const newState = translateState({
      state: this._scrollState,
      delta: interaction.payload.event.movementX,
      containerLength: this.frame.size.width,
    });
    this._setStateAndInformCallbacksIfChanged(newState);
  }

  _handleMouseUp(
    interaction: MouseUpInteraction,
    activeViewRef: ViewRef,
    hoveredViewRef: ViewRef,
  ) {
    if (this._isPanning) {
      this._isPanning = false;
    }

    if (activeViewRef.current === this) {
      activeViewRef.current = null;
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

    const newState = translateState({
      state: this._scrollState,
      delta: -deltaX,
      containerLength: this.frame.size.width,
    });
    this._setStateAndInformCallbacksIfChanged(newState);
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

    const newState = zoomState({
      state: this._scrollState,
      multiplier: 1 + 0.005 * -deltaY,
      fixedPoint: location.x - this._scrollState.offset,

      minContentLength: this._intrinsicContentWidth * MIN_ZOOM_LEVEL,
      maxContentLength: this._intrinsicContentWidth * MAX_ZOOM_LEVEL,
      containerLength: this.frame.size.width,
    });
    this._setStateAndInformCallbacksIfChanged(newState);
  }

  handleInteraction(
    interaction: Interaction,
    activeViewRef: ViewRef,
    hoveredViewRef: ViewRef,
  ) {
    switch (interaction.type) {
      case 'mousedown':
        this._handleMouseDown(interaction, activeViewRef, hoveredViewRef);
        break;
      case 'mousemove':
        this._handleMouseMove(interaction, activeViewRef, hoveredViewRef);
        break;
      case 'mouseup':
        this._handleMouseUp(interaction, activeViewRef, hoveredViewRef);
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
}
