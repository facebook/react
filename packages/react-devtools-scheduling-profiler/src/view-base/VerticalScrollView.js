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
} from './useCanvasInteraction';
import type {Rect} from './geometry';

import {Surface} from './Surface';
import {View} from './View';
import {rectContainsPoint} from './geometry';
import {clamp} from './utils/clamp';
import {MOVE_WHEEL_DELTA_THRESHOLD} from './constants';

type VerticalScrollState = $ReadOnly<{|
  offsetY: number,
|}>;

function scrollStatesAreEqual(
  state1: VerticalScrollState,
  state2: VerticalScrollState,
): boolean {
  return state1.offsetY === state2.offsetY;
}

export class VerticalScrollView extends View {
  _scrollState: VerticalScrollState = {
    offsetY: 0,
  };

  _isPanning = false;

  constructor(surface: Surface, frame: Rect, contentView: View) {
    super(surface, frame);
    this.addSubview(contentView);
  }

  setFrame(newFrame: Rect) {
    super.setFrame(newFrame);

    // Revalidate scrollState
    this._updateState(this._scrollState);
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
    const {offsetY} = this._scrollState;
    const desiredSize = this._contentView.desiredSize();

    const minimumHeight = this.frame.size.height;
    const desiredHeight = desiredSize ? desiredSize.height : 0;
    // Force view to take up at least all remaining vertical space.
    const height = Math.max(desiredHeight, minimumHeight);

    const proposedFrame = {
      origin: {
        x: this.frame.origin.x,
        y: this.frame.origin.y + offsetY,
      },
      size: {
        width: this.frame.size.width,
        height,
      },
    };
    this._contentView.setFrame(proposedFrame);
    super.layoutSubviews();
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
    const {offsetY} = this._scrollState;
    const {movementY} = interaction.payload.event;
    this._updateState({
      ...this._scrollState,
      offsetY: offsetY + movementY,
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
    if (absDeltaX > absDeltaY) {
      return; // Scrolling horizontally
    }

    if (absDeltaY < MOVE_WHEEL_DELTA_THRESHOLD) {
      return;
    }

    this._updateState({
      ...this._scrollState,
      offsetY: this._scrollState.offsetY - deltaY,
    });
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
    }
  }

  /**
   * @private
   */
  _updateState(proposedState: VerticalScrollState) {
    const clampedState = this._clampedProposedState(proposedState);
    if (!scrollStatesAreEqual(clampedState, this._scrollState)) {
      this._scrollState = clampedState;
      this.setNeedsDisplay();
    }
  }

  /**
   * @private
   */
  _clampedProposedState(
    proposedState: VerticalScrollState,
  ): VerticalScrollState {
    return {
      offsetY: clamp(
        -(this._contentView.frame.size.height - this.frame.size.height),
        0,
        proposedState.offsetY,
      ),
    };
  }
}
