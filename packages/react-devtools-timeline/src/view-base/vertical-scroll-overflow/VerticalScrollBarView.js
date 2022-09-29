/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Interaction} from '../useCanvasInteraction';
import type {Rect} from '../geometry';
import type {Surface, ViewRefs} from '../Surface';
import type {
  ClickInteraction,
  MouseDownInteraction,
  MouseMoveInteraction,
  MouseUpInteraction,
} from '../useCanvasInteraction';

import {VerticalScrollOverflowView} from './VerticalScrollOverflowView';
import {rectContainsPoint, rectEqualToRect} from '../geometry';
import {View} from '../View';
import {BORDER_SIZE, COLORS} from '../../content-views/constants';

const SCROLL_BAR_SIZE = 14;

const HIDDEN_RECT = {
  origin: {
    x: 0,
    y: 0,
  },
  size: {
    width: 0,
    height: 0,
  },
};

export class VerticalScrollBarView extends View {
  _contentHeight: number = 0;
  _isScrolling: boolean = false;
  _scrollBarRect: Rect = HIDDEN_RECT;
  _scrollThumbRect: Rect = HIDDEN_RECT;
  _verticalScrollOverflowView: VerticalScrollOverflowView;

  constructor(
    surface: Surface,
    frame: Rect,
    verticalScrollOverflowView: VerticalScrollOverflowView,
  ) {
    super(surface, frame);

    this._verticalScrollOverflowView = verticalScrollOverflowView;
  }

  desiredSize(): {+height: number, +width: number} {
    return {
      width: SCROLL_BAR_SIZE,
      height: 0, // No desired height
    };
  }

  getMaxScrollThumbY(): number {
    const {height} = this.frame.size;

    const maxScrollThumbY = height - this._scrollThumbRect.size.height;

    return maxScrollThumbY;
  }

  setContentHeight(contentHeight: number) {
    this._contentHeight = contentHeight;

    const {height, width} = this.frame.size;

    const proposedScrollThumbRect = {
      origin: {
        x: this.frame.origin.x,
        y: this._scrollThumbRect.origin.y,
      },
      size: {
        width,
        height: height * (height / contentHeight),
      },
    };

    if (!rectEqualToRect(this._scrollThumbRect, proposedScrollThumbRect)) {
      this._scrollThumbRect = proposedScrollThumbRect;
      this.setNeedsDisplay();
    }
  }

  setScrollThumbY(value: number) {
    const {height} = this.frame.size;

    const maxScrollThumbY = this.getMaxScrollThumbY();
    const newScrollThumbY = Math.max(0, Math.min(maxScrollThumbY, value));

    this._scrollThumbRect = {
      ...this._scrollThumbRect,
      origin: {
        x: this.frame.origin.x,
        y: newScrollThumbY,
      },
    };

    const maxContentOffset = this._contentHeight - height;
    const contentScrollOffset =
      (newScrollThumbY / maxScrollThumbY) * maxContentOffset * -1;

    this._verticalScrollOverflowView.setScrollOffset(
      contentScrollOffset,
      maxScrollThumbY,
    );
  }

  draw(context: CanvasRenderingContext2D, viewRefs: ViewRefs) {
    const {x, y} = this.frame.origin;
    const {width, height} = this.frame.size;

    // TODO Use real color
    context.fillStyle = COLORS.REACT_RESIZE_BAR;
    context.fillRect(x, y, width, height);

    // TODO Use real color
    context.fillStyle = COLORS.SCROLL_CARET;
    context.fillRect(
      this._scrollThumbRect.origin.x,
      this._scrollThumbRect.origin.y,
      this._scrollThumbRect.size.width,
      this._scrollThumbRect.size.height,
    );

    // TODO Use real color
    context.fillStyle = COLORS.REACT_RESIZE_BAR_BORDER;
    context.fillRect(x, y, BORDER_SIZE, height);
  }

  handleInteraction(interaction: Interaction, viewRefs: ViewRefs) {
    switch (interaction.type) {
      case 'click':
        this._handleClick(interaction, viewRefs);
        break;
      case 'mousedown':
        this._handleMouseDown(interaction, viewRefs);
        break;
      case 'mousemove':
        this._handleMouseMove(interaction, viewRefs);
        break;
      case 'mouseup':
        this._handleMouseUp(interaction, viewRefs);
        break;
    }
  }

  _handleClick(interaction: ClickInteraction, viewRefs: ViewRefs) {
    const {location} = interaction.payload;
    if (rectContainsPoint(location, this.frame)) {
      if (rectContainsPoint(location, this._scrollThumbRect)) {
        // Ignore clicks on the track thumb directly.
        return;
      }

      const currentScrollThumbY = this._scrollThumbRect.origin.y;
      const y = location.y;

      const {height} = this.frame.size;

      // Scroll up or down about one viewport worth of content:
      const deltaY = (height / this._contentHeight) * height * 0.8;

      this.setScrollThumbY(
        y > currentScrollThumbY
          ? this._scrollThumbRect.origin.y + deltaY
          : this._scrollThumbRect.origin.y - deltaY,
      );
    }
  }

  _handleMouseDown(interaction: MouseDownInteraction, viewRefs: ViewRefs) {
    const {location} = interaction.payload;
    if (!rectContainsPoint(location, this._scrollThumbRect)) {
      return;
    }
    viewRefs.activeView = this;

    this.currentCursor = 'default';

    this._isScrolling = true;
    this.setNeedsDisplay();
  }

  _handleMouseMove(interaction: MouseMoveInteraction, viewRefs: ViewRefs) {
    const {event, location} = interaction.payload;
    if (rectContainsPoint(location, this.frame)) {
      if (viewRefs.hoveredView !== this) {
        viewRefs.hoveredView = this;
      }

      this.currentCursor = 'default';
    }

    if (viewRefs.activeView === this) {
      this.currentCursor = 'default';

      this.setScrollThumbY(this._scrollThumbRect.origin.y + event.movementY);
    }
  }

  _handleMouseUp(interaction: MouseUpInteraction, viewRefs: ViewRefs) {
    if (viewRefs.activeView === this) {
      viewRefs.activeView = null;
    }

    if (this._isScrolling) {
      this._isScrolling = false;
      this.setNeedsDisplay();
    }
  }
}
