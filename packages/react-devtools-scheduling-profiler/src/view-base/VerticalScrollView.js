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
import type {ScrollState} from './utils/scrollState';

import {Surface} from './Surface';
import {View} from './View';
import {rectContainsPoint} from './geometry';
import {
  clampState,
  areScrollStatesEqual,
  translateState,
} from './utils/scrollState';
import {MOVE_WHEEL_DELTA_THRESHOLD} from './constants';

export class VerticalScrollView extends View {
  _scrollState: ScrollState = {offset: 0, length: 0};
  _isPanning = false;

  constructor(surface: Surface, frame: Rect, contentView: View) {
    super(surface, frame);
    this.addSubview(contentView);
    this._setScrollState(this._scrollState);
  }

  setFrame(newFrame: Rect) {
    super.setFrame(newFrame);

    // Revalidate scrollState
    this._setScrollState(this._scrollState);
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
    const {offset} = this._scrollState;
    const desiredSize = this._contentView.desiredSize();

    const minimumHeight = this.frame.size.height;
    const desiredHeight = desiredSize ? desiredSize.height : 0;
    // Force view to take up at least all remaining vertical space.
    const height = Math.max(desiredHeight, minimumHeight);

    const proposedFrame = {
      origin: {
        x: this.frame.origin.x,
        y: this.frame.origin.y + offset,
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
    const newState = translateState({
      state: this._scrollState,
      delta: interaction.payload.event.movementY,
      containerLength: this.frame.size.height,
    });
    this._setScrollState(newState);
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

    const newState = translateState({
      state: this._scrollState,
      delta: -deltaY,
      containerLength: this.frame.size.height,
    });
    this._setScrollState(newState);
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
  _setScrollState(proposedState: ScrollState) {
    const height = this._contentView.frame.size.height;
    const clampedState = clampState({
      state: proposedState,
      minContentLength: height,
      maxContentLength: height,
      containerLength: this.frame.size.height,
    });
    if (areScrollStatesEqual(clampedState, this._scrollState)) {
      return;
    }
    this._scrollState = clampedState;
    this.setNeedsDisplay();
  }
}
