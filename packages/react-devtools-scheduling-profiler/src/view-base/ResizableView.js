/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  ClickInteraction,
  DoubleClickInteraction,
  Interaction,
  MouseDownInteraction,
  MouseMoveInteraction,
  MouseUpInteraction,
} from './useCanvasInteraction';
import type {Rect} from './geometry';
import type {ViewRefs} from './Surface';

import {BORDER_SIZE, COLORS} from '../content-views/constants';
import {drawText} from '../content-views/utils/text';
import {Surface} from './Surface';
import {View} from './View';
import {intersectionOfRects, rectContainsPoint} from './geometry';
import {noopLayout} from './layouter';
import {clamp} from './utils/clamp';

type ResizeBarState = 'normal' | 'hovered' | 'dragging';

type ResizingState = $ReadOnly<{|
  /** Distance between top of resize bar and mouseY */
  cursorOffsetInBarFrame: number,
  /** Mouse's vertical coordinates relative to canvas */
  mouseY: number,
|}>;

type LayoutState = $ReadOnly<{|
  /** Resize bar's vertical position relative to resize view's frame.origin.y */
  barOffsetY: number,
|}>;

const RESIZE_BAR_DOT_RADIUS = 1;
const RESIZE_BAR_DOT_SPACING = 4;
const RESIZE_BAR_HEIGHT = 8;
const RESIZE_BAR_WITH_LABEL_HEIGHT = 16;

const HIDDEN_RECT = {
  origin: {x: 0, y: 0},
  size: {width: 0, height: 0},
};

class ResizeBar extends View {
  _interactionState: ResizeBarState = 'normal';
  _label: string;

  showLabel: boolean = false;

  constructor(surface: Surface, frame: Rect, label: string) {
    super(surface, frame, noopLayout);

    this._label = label;
  }

  desiredSize() {
    return this.showLabel
      ? {height: RESIZE_BAR_WITH_LABEL_HEIGHT, width: 0}
      : {height: RESIZE_BAR_HEIGHT, width: 0};
  }

  draw(context: CanvasRenderingContext2D, viewRefs: ViewRefs) {
    const {visibleArea} = this;
    const {x, y} = visibleArea.origin;
    const {width, height} = visibleArea.size;

    const isActive =
      this._interactionState === 'dragging' ||
      (this._interactionState === 'hovered' && viewRefs.activeView === null);

    context.fillStyle = isActive
      ? COLORS.REACT_RESIZE_BAR_ACTIVE
      : COLORS.REACT_RESIZE_BAR;
    context.fillRect(x, y, width, height);

    context.fillStyle = COLORS.REACT_RESIZE_BAR_BORDER;
    context.fillRect(x, y, width, BORDER_SIZE);
    context.fillRect(x, y + height - BORDER_SIZE, width, BORDER_SIZE);

    const horizontalCenter = x + width / 2;
    const verticalCenter = y + height / 2;

    if (this.showLabel) {
      // When the resize view is collapsed entirely,
      // rather than showing a resize bar– this view displays a label.
      const labelRect: Rect = {
        origin: {
          x: 0,
          y: y + height - RESIZE_BAR_WITH_LABEL_HEIGHT,
        },
        size: {
          width: visibleArea.size.width,
          height: visibleArea.size.height,
        },
      };

      const drawableRect = intersectionOfRects(labelRect, this.visibleArea);

      drawText(
        this._label,
        context,
        labelRect,
        drawableRect,
        'center',
        COLORS.REACT_RESIZE_BAR_DOT,
      );
    } else {
      // Otherwise draw horizontally centered resize bar dots
      context.beginPath();
      context.fillStyle = COLORS.REACT_RESIZE_BAR_DOT;
      context.arc(
        horizontalCenter,
        verticalCenter,
        RESIZE_BAR_DOT_RADIUS,
        0,
        2 * Math.PI,
      );
      context.arc(
        horizontalCenter + RESIZE_BAR_DOT_SPACING,
        verticalCenter,
        RESIZE_BAR_DOT_RADIUS,
        0,
        2 * Math.PI,
      );
      context.arc(
        horizontalCenter - RESIZE_BAR_DOT_SPACING,
        verticalCenter,
        RESIZE_BAR_DOT_RADIUS,
        0,
        2 * Math.PI,
      );
      context.fill();
    }
  }

  _setInteractionState(state: ResizeBarState) {
    if (this._interactionState === state) {
      return;
    }
    this._interactionState = state;
    this.setNeedsDisplay();
  }

  _handleMouseDown(interaction: MouseDownInteraction, viewRefs: ViewRefs) {
    const cursorInView = rectContainsPoint(
      interaction.payload.location,
      this.frame,
    );
    if (cursorInView) {
      this._setInteractionState('dragging');
      viewRefs.activeView = this;
    }
  }

  _handleMouseMove(interaction: MouseMoveInteraction, viewRefs: ViewRefs) {
    const cursorInView = rectContainsPoint(
      interaction.payload.location,
      this.frame,
    );

    if (viewRefs.activeView === this) {
      // If we're actively dragging this resize bar,
      // show the cursor even if the pointer isn't hovering over this view.
      this.currentCursor = 'ns-resize';
    } else if (cursorInView) {
      if (this.showLabel) {
        this.currentCursor = 'pointer';
      } else {
        this.currentCursor = 'ns-resize';
      }
    }

    if (cursorInView) {
      viewRefs.hoveredView = this;
    }

    if (this._interactionState === 'dragging') {
      return;
    }
    this._setInteractionState(cursorInView ? 'hovered' : 'normal');
  }

  _handleMouseUp(interaction: MouseUpInteraction, viewRefs: ViewRefs) {
    const cursorInView = rectContainsPoint(
      interaction.payload.location,
      this.frame,
    );
    if (this._interactionState === 'dragging') {
      this._setInteractionState(cursorInView ? 'hovered' : 'normal');
    }

    if (viewRefs.activeView === this) {
      viewRefs.activeView = null;
    }
  }

  handleInteraction(interaction: Interaction, viewRefs: ViewRefs) {
    switch (interaction.type) {
      case 'mousedown':
        this._handleMouseDown(interaction, viewRefs);
        return;
      case 'mousemove':
        this._handleMouseMove(interaction, viewRefs);
        return;
      case 'mouseup':
        this._handleMouseUp(interaction, viewRefs);
        return;
    }
  }
}

export class ResizableView extends View {
  _canvasRef: {current: HTMLCanvasElement | null};
  _layoutState: LayoutState;
  _resizeBar: ResizeBar;
  _resizingState: ResizingState | null = null;
  _subview: View;

  constructor(
    surface: Surface,
    frame: Rect,
    subview: View,
    canvasRef: {current: HTMLCanvasElement | null},
    label: string,
  ) {
    super(surface, frame, noopLayout);

    this._canvasRef = canvasRef;

    this._subview = subview;
    this._resizeBar = new ResizeBar(surface, frame, label);

    this.addSubview(this._subview);
    this.addSubview(this._resizeBar);

    const subviewDesiredSize = subview.desiredSize();
    this._updateLayoutStateAndResizeBar(
      subviewDesiredSize.maxInitialHeight != null
        ? Math.min(
            subviewDesiredSize.maxInitialHeight,
            subviewDesiredSize.height,
          )
        : subviewDesiredSize.height,
    );
  }

  desiredSize() {
    const subviewDesiredSize = this._subview.desiredSize();

    if (this._shouldRenderResizeBar()) {
      const resizeBarDesiredSize = this._resizeBar.desiredSize();

      return {
        width: this.frame.size.width,
        height: this._layoutState.barOffsetY + resizeBarDesiredSize.height,
      };
    } else {
      return {
        width: this.frame.size.width,
        height: subviewDesiredSize.height,
      };
    }
  }

  layoutSubviews() {
    this._updateLayoutState();
    this._updateSubviewFrames();

    super.layoutSubviews();
  }

  _shouldRenderResizeBar() {
    const subviewDesiredSize = this._subview.desiredSize();
    return subviewDesiredSize.hideScrollBarIfLessThanHeight != null
      ? subviewDesiredSize.height >
          subviewDesiredSize.hideScrollBarIfLessThanHeight
      : true;
  }

  _updateLayoutStateAndResizeBar(barOffsetY: number) {
    if (barOffsetY <= RESIZE_BAR_WITH_LABEL_HEIGHT - RESIZE_BAR_HEIGHT) {
      barOffsetY = 0;
    }

    this._layoutState = {
      ...this._layoutState,
      barOffsetY,
    };

    this._resizeBar.showLabel = barOffsetY === 0;
  }

  _updateLayoutState() {
    const {frame, _resizingState} = this;

    // Allow bar to travel to bottom of the visible area of this view but no further
    const subviewDesiredSize = this._subview.desiredSize();
    const maxBarOffset = subviewDesiredSize.height;

    let proposedBarOffsetY = this._layoutState.barOffsetY;
    // Update bar offset if dragging bar
    if (_resizingState) {
      const {mouseY, cursorOffsetInBarFrame} = _resizingState;
      proposedBarOffsetY = mouseY - frame.origin.y - cursorOffsetInBarFrame;
    }

    this._updateLayoutStateAndResizeBar(
      clamp(0, maxBarOffset, proposedBarOffsetY),
    );
  }

  _updateSubviewFrames() {
    const {
      frame: {
        origin: {x, y},
        size: {width},
      },
      _layoutState: {barOffsetY},
    } = this;

    const resizeBarDesiredSize = this._resizeBar.desiredSize();

    if (barOffsetY === 0) {
      this._subview.setFrame(HIDDEN_RECT);
    } else {
      this._subview.setFrame({
        origin: {x, y},
        size: {width, height: barOffsetY},
      });
    }

    this._resizeBar.setFrame({
      origin: {x, y: y + barOffsetY},
      size: {width, height: resizeBarDesiredSize.height},
    });
  }

  _handleClick(interaction: ClickInteraction) {
    const cursorInView = rectContainsPoint(
      interaction.payload.location,
      this.frame,
    );
    if (cursorInView) {
      if (this._layoutState.barOffsetY === 0) {
        // Clicking on the collapsed label should expand.
        const subviewDesiredSize = this._subview.desiredSize();
        this._updateLayoutStateAndResizeBar(subviewDesiredSize.height);
        this.setNeedsDisplay();
      }
    }
  }

  _handleDoubleClick(interaction: DoubleClickInteraction) {
    const cursorInView = rectContainsPoint(
      interaction.payload.location,
      this.frame,
    );
    if (cursorInView) {
      if (this._layoutState.barOffsetY > 0) {
        // Double clicking on the expanded view should collapse.
        this._updateLayoutStateAndResizeBar(0);
        this.setNeedsDisplay();
      }
    }
  }

  _handleMouseDown(interaction: MouseDownInteraction) {
    const cursorLocation = interaction.payload.location;
    const resizeBarFrame = this._resizeBar.frame;
    if (rectContainsPoint(cursorLocation, resizeBarFrame)) {
      const mouseY = cursorLocation.y;
      this._resizingState = {
        cursorOffsetInBarFrame: mouseY - resizeBarFrame.origin.y,
        mouseY,
      };
    }
  }

  _handleMouseMove(interaction: MouseMoveInteraction) {
    const {_resizingState} = this;
    if (_resizingState) {
      this._resizingState = {
        ..._resizingState,
        mouseY: interaction.payload.location.y,
      };
      this.setNeedsDisplay();
    }
  }

  _handleMouseUp(interaction: MouseUpInteraction) {
    if (this._resizingState) {
      this._resizingState = null;
    }
  }

  getCursorActiveSubView(interaction: Interaction): View | null {
    const cursorLocation = interaction.payload.location;
    const resizeBarFrame = this._resizeBar.frame;
    if (rectContainsPoint(cursorLocation, resizeBarFrame)) {
      return this;
    } else {
      return null;
    }
  }

  handleInteraction(interaction: Interaction, viewRefs: ViewRefs) {
    switch (interaction.type) {
      case 'click':
        this._handleClick(interaction);
        return;
      case 'double-click':
        this._handleDoubleClick(interaction);
        return;
      case 'mousedown':
        this._handleMouseDown(interaction);
        return;
      case 'mousemove':
        this._handleMouseMove(interaction);
        return;
      case 'mouseup':
        this._handleMouseUp(interaction);
        return;
    }
  }
}
