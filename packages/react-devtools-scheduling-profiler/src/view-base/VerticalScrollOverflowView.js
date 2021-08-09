/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Interaction} from './useCanvasInteraction';
import type {Rect} from './geometry';
import type {Layouter} from './layouter';
import type {Surface, ViewRefs} from './Surface';
import type {
  ClickInteraction,
  MouseDownInteraction,
  MouseMoveInteraction,
  MouseUpInteraction,
} from './useCanvasInteraction';

import {rectContainsPoint, rectEqualToRect} from './geometry';
import {View} from './View';
import {BORDER_SIZE, COLORS} from '../content-views/constants';

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

/**
 * Assumes {@param layout} will only contain 2 views.
 */
const withVerticalScrollbarLayout: Layouter = (layout, containerFrame) => {
  const [contentLayoutInfo, scrollbarLayoutInfo] = layout;
  const desiredContentSize = contentLayoutInfo.view.desiredSize();

  const shouldShowScrollbar =
    desiredContentSize.height > containerFrame.size.height;
  const scrollbarWidth = shouldShowScrollbar
    ? scrollbarLayoutInfo.view.desiredSize().width
    : 0;

  const laidOutContentLayoutInfo = {
    ...contentLayoutInfo,
    frame: {
      origin: contentLayoutInfo.view.frame.origin,
      size: {
        width: containerFrame.size.width - scrollbarWidth,
        height: contentLayoutInfo.view.frame.size.height,
      },
    },
  };
  return [
    laidOutContentLayoutInfo,
    {
      ...scrollbarLayoutInfo,
      frame: {
        origin: {
          x:
            laidOutContentLayoutInfo.frame.origin.x +
            laidOutContentLayoutInfo.frame.size.width,
          y: containerFrame.origin.y,
        },
        size: {
          width: scrollbarWidth,
          height: containerFrame.size.height,
        },
      },
    },
  ];
};

// TODO How do we handle resizing
export class VerticalScrollOverflowView extends View {
  _contentView: View;
  _isScrolling: boolean = false;
  _scrollOffset: number = 0;
  _scrollBarView: VerticalScrollBarView;

  constructor(surface: Surface, frame: Rect, contentView: View) {
    super(surface, frame, withVerticalScrollbarLayout);

    this._contentView = contentView;
    this._scrollBarView = new VerticalScrollBarView(surface, frame, this);

    this.addSubview(contentView);
    this.addSubview(this._scrollBarView);
  }

  setScrollOffset(value: number) {
    this._scrollOffset = value;
    this.setNeedsDisplay();
  }

  layoutSubviews() {
    this._contentView.setFrame({
      origin: this._contentView.frame.origin,
      // Reset this to our size. This allows _contentView's layouter to know the
      // latest available height, which is useful because e.g.
      // lastViewTakesUpRemainingSpaceLayout can recompute its last view's height.
      size: this.frame.size,
    });

    const desiredContentSize = this._contentView.desiredSize();

    // Force view to take up at least all remaining vertical space.
    const contentHeight = Math.max(
      desiredContentSize.height,
      this.frame.size.height,
    );
    // Clamp offset so that content will always be fully visible
    this._scrollOffset = Math.max(
      this._scrollOffset,
      this.frame.size.height - contentHeight,
    );

    this._contentView.setFrame({
      origin: {
        x: this.frame.origin.x,
        // Offset content view. Our layouter will set the final position of both
        // the content view and scrollbar.
        y: this.frame.origin.y + this._scrollOffset,
      },
      size: {
        width: this.frame.size.width,
        height: contentHeight,
      },
    });

    super.layoutSubviews();

    // This should be done after calling super.layoutSubviews() – calling it
    // before somehow causes _contentView to need display on every mousemove
    // event when the scroll bar is shown.
    this._scrollBarView.setContentHeight(contentHeight);
  }
}

class VerticalScrollBarView extends View {
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

  desiredSize() {
    return {
      width: SCROLL_BAR_SIZE,
      height: 0, // No desired height
    };
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
    const scrollThumbRect = this._scrollThumbRect;

    const maxScrollThumbY = height - scrollThumbRect.size.height;
    const newScrollThumbY = Math.max(0, Math.min(maxScrollThumbY, value));

    this._scrollThumbRect = {
      ...scrollThumbRect,
      origin: {
        x: this.frame.origin.x,
        y: newScrollThumbY,
      },
    };

    const maxContentOffset = this._contentHeight - height;
    const contentScrollOffset =
      (newScrollThumbY / maxScrollThumbY) * maxContentOffset * -1;

    this._verticalScrollOverflowView.setScrollOffset(contentScrollOffset);
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
      const currentScrollThumbY = this._scrollThumbRect.origin.y;
      const y = location.y;

      if (rectContainsPoint(location, this._scrollThumbRect)) {
        // Ignore clicks on the track thumb directly.
        return;
      }

      // Scroll up or down about one viewport worth of content:
      // TODO This calculation is broken
      const deltaY = this.frame.size.height * 0.8;

      this.setScrollThumbY(
        y < currentScrollThumbY
          ? currentScrollThumbY - deltaY
          : currentScrollThumbY + deltaY,
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
