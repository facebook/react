/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Size, IntrinsicSize, Rect} from './geometry';
import type {
  Interaction,
  MouseDownInteraction,
  MouseMoveInteraction,
  MouseUpInteraction,
  WheelPlainInteraction,
  WheelWithShiftInteraction,
} from './useCanvasInteraction';
import type {ScrollState} from './utils/scrollState';
import type {ViewRefs} from './Surface';
import type {ViewState} from '../types';

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
  MAX_ZOOM_LEVEL,
  MIN_ZOOM_LEVEL,
  MOVE_WHEEL_DELTA_THRESHOLD,
} from './constants';

export class HorizontalPanAndZoomView extends View {
  _contentView: View;
  _intrinsicContentWidth: number;
  _isPanning: boolean = false;
  _viewState: ViewState;

  constructor(
    surface: Surface,
    frame: Rect,
    contentView: View,
    intrinsicContentWidth: number,
    viewState: ViewState,
  ) {
    super(surface, frame);

    this._contentView = contentView;
    this._intrinsicContentWidth = intrinsicContentWidth;
    this._viewState = viewState;

    viewState.onHorizontalScrollStateChange(scrollState => {
      this.zoomToRange(scrollState.offset, scrollState.length);
    });

    this.addSubview(contentView);
  }

  /**
   * Just sets scroll state.
   * Use `_setStateAndInformCallbacksIfChanged` if this view's callbacks should also be called.
   *
   * @returns Whether state was changed
   * @private
   */
  setScrollState(proposedState: ScrollState) {
    const clampedState = clampState({
      state: proposedState,
      minContentLength: this._intrinsicContentWidth * MIN_ZOOM_LEVEL,
      maxContentLength: this._intrinsicContentWidth * MAX_ZOOM_LEVEL,
      containerLength: this.frame.size.width,
    });
    if (
      !areScrollStatesEqual(clampedState, this._viewState.horizontalScrollState)
    ) {
      this.setNeedsDisplay();
    }
  }

  /**
   * Zoom to a specific range of the content specified as a range of the
   * content view's intrinsic content size.
   *
   * Does not inform callbacks of state change since this is a public API.
   */
  zoomToRange(rangeStart: number, rangeEnd: number) {
    const newState = moveStateToRange({
      state: this._viewState.horizontalScrollState,
      rangeStart,
      rangeEnd,
      contentLength: this._intrinsicContentWidth,

      minContentLength: this._intrinsicContentWidth * MIN_ZOOM_LEVEL,
      maxContentLength: this._intrinsicContentWidth * MAX_ZOOM_LEVEL,
      containerLength: this.frame.size.width,
    });
    this.setScrollState(newState);
  }

  desiredSize(): Size | IntrinsicSize {
    return this._contentView.desiredSize();
  }

  layoutSubviews() {
    const {offset, length} = this._viewState.horizontalScrollState;
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

  handleInteraction(interaction: Interaction, viewRefs: ViewRefs) {
    switch (interaction.type) {
      case 'mousedown':
        this._handleMouseDown(interaction, viewRefs);
        break;
      case 'mousemove':
        this._handleMouseMove(interaction, viewRefs);
        break;
      case 'mouseup':
        this._handleMouseUp(interaction, viewRefs);
        break;
      case 'wheel-plain':
      case 'wheel-shift':
        this._handleWheel(interaction);
        break;
    }
  }

  _handleMouseDown(interaction: MouseDownInteraction, viewRefs: ViewRefs) {
    if (rectContainsPoint(interaction.payload.location, this.frame)) {
      this._isPanning = true;

      viewRefs.activeView = this;

      this.currentCursor = 'grabbing';
    }
  }

  _handleMouseMove(interaction: MouseMoveInteraction, viewRefs: ViewRefs) {
    const isHovered = rectContainsPoint(
      interaction.payload.location,
      this.frame,
    );
    if (isHovered && viewRefs.hoveredView === null) {
      viewRefs.hoveredView = this;
    }

    if (viewRefs.activeView === this) {
      this.currentCursor = 'grabbing';
    } else if (isHovered) {
      this.currentCursor = 'grab';
    }

    if (!this._isPanning) {
      return;
    }

    // Don't prevent mouse-move events from bubbling if they are vertical drags.
    const {movementX, movementY} = interaction.payload.event;
    if (Math.abs(movementX) < Math.abs(movementY)) {
      return;
    }

    const newState = translateState({
      state: this._viewState.horizontalScrollState,
      delta: movementX,
      containerLength: this.frame.size.width,
    });
    this._viewState.updateHorizontalScrollState(newState);
  }

  _handleMouseUp(interaction: MouseUpInteraction, viewRefs: ViewRefs) {
    if (this._isPanning) {
      this._isPanning = false;
    }

    if (viewRefs.activeView === this) {
      viewRefs.activeView = null;
    }
  }

  _handleWheel(interaction: WheelPlainInteraction | WheelWithShiftInteraction) {
    const {
      location,
      delta: {deltaX, deltaY},
    } = interaction.payload;

    if (!rectContainsPoint(location, this.frame)) {
      return; // Not scrolling on view
    }

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Vertical scrolling zooms in and out (unless the SHIFT modifier is used).
    // Horizontal scrolling pans.
    if (absDeltaY > absDeltaX) {
      if (absDeltaY < MOVE_WHEEL_DELTA_THRESHOLD) {
        return;
      }

      if (interaction.type === 'wheel-shift') {
        // Shift modifier is for scrolling, not zooming.
        return;
      }

      const newState = zoomState({
        state: this._viewState.horizontalScrollState,
        multiplier: 1 + 0.005 * -deltaY,
        fixedPoint: location.x - this._viewState.horizontalScrollState.offset,

        minContentLength: this._intrinsicContentWidth * MIN_ZOOM_LEVEL,
        maxContentLength: this._intrinsicContentWidth * MAX_ZOOM_LEVEL,
        containerLength: this.frame.size.width,
      });
      this._viewState.updateHorizontalScrollState(newState);
    } else {
      if (absDeltaX < MOVE_WHEEL_DELTA_THRESHOLD) {
        return;
      }

      const newState = translateState({
        state: this._viewState.horizontalScrollState,
        delta: -deltaX,
        containerLength: this.frame.size.width,
      });
      this._viewState.updateHorizontalScrollState(newState);
    }
  }
}
