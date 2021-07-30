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
} from './useCanvasInteraction';
import type {Rect, Size} from './geometry';
import type {ViewRefs} from './Surface';

import {COLORS} from '../content-views/constants';
import {Surface} from './Surface';
import {View} from './View';
import {rectContainsPoint} from './geometry';
import {layeredLayout, noopLayout} from './layouter';
import {ColorView} from './ColorView';
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

function getColorForBarState(state: ResizeBarState): string {
  switch (state) {
    case 'normal':
    case 'hovered':
    case 'dragging':
      return COLORS.REACT_RESIZE_BAR;
  }
  throw new Error(`Unknown resize bar state ${state}`);
}

class ResizeBar extends View {
  _intrinsicContentSize: Size = {
    width: 0,
    height: 5,
  };

  _interactionState: ResizeBarState = 'normal';

  constructor(surface: Surface, frame: Rect) {
    super(surface, frame, layeredLayout);
    this.addSubview(new ColorView(surface, frame, ''));
    this._updateColor();
  }

  desiredSize() {
    return this._intrinsicContentSize;
  }

  _getColorView(): ColorView {
    return (this.subviews[0]: any);
  }

  _updateColor() {
    this._getColorView().setColor(getColorForBarState(this._interactionState));
  }

  _setInteractionState(state: ResizeBarState) {
    if (this._interactionState === state) {
      return;
    }
    this._interactionState = state;
    this._updateColor();
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

    if (cursorInView || viewRefs.activeView === this) {
      this.currentCursor = 'ns-resize';
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

// TODO (ResizableView) Rename this to ResizableView
// TODO (ResizableView) Clip sub-view somehow so text doesn't overflow.
export class ResizableView extends View {
  _canvasRef: {current: HTMLCanvasElement | null};
  _resizingState: ResizingState | null = null;
  _layoutState: LayoutState;
  _resizeBar: ResizeBar;
  _subview: View;

  constructor(
    surface: Surface,
    frame: Rect,
    subview: View,
    canvasRef: {current: HTMLCanvasElement | null},
  ) {
    super(surface, frame, noopLayout);

    this._canvasRef = canvasRef;

    this._subview = subview;
    this._resizeBar = new ResizeBar(surface, frame);

    this.addSubview(this._subview);
    this.addSubview(this._resizeBar);

    // TODO (ResizableView) Allow subviews to specify default sizes.
    // Maybe that or set some % based default so all panels are visible to begin with.
    const subviewDesiredSize = subview.desiredSize();
    this._layoutState = {
      barOffsetY: subviewDesiredSize ? subviewDesiredSize.height : 0,
    };
  }

  desiredSize() {
    const resizeBarDesiredSize = this._resizeBar.desiredSize();
    const subviewDesiredSize = this._subview.desiredSize();

    const subviewDesiredWidth = subviewDesiredSize
      ? subviewDesiredSize.width
      : 0;

    return {
      width: Math.max(subviewDesiredWidth, resizeBarDesiredSize.width),
      height: this._layoutState.barOffsetY + resizeBarDesiredSize.height,
    };
  }

  layoutSubviews() {
    this._updateLayoutState();
    this._updateSubviewFrames();

    super.layoutSubviews();
  }

  // TODO (ResizableView) Change ResizeBar view style slightly when fully collapsed.
  // TODO (ResizableView) Double click on ResizeBar to collapse/toggle.
  _updateLayoutState() {
    const {frame, _resizingState} = this;

    // TODO (ResizableView) Allow subviews to specify min size too.
    // Allow bar to travel to bottom of the visible area of this view but no further
    const subviewDesiredSize = this._subview.desiredSize();
    const maxBarOffset = subviewDesiredSize.height;

    let proposedBarOffsetY = this._layoutState.barOffsetY;
    // Update bar offset if dragging bar
    if (_resizingState) {
      const {mouseY, cursorOffsetInBarFrame} = _resizingState;
      proposedBarOffsetY = mouseY - frame.origin.y - cursorOffsetInBarFrame;
    }

    this._layoutState = {
      ...this._layoutState,
      barOffsetY: clamp(0, maxBarOffset, proposedBarOffsetY),
    };
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

    let currentY = y;

    this._subview.setFrame({
      origin: {x, y: currentY},
      size: {width, height: barOffsetY},
    });
    currentY += this._subview.frame.size.height;

    this._resizeBar.setFrame({
      origin: {x, y: currentY},
      size: {width, height: resizeBarDesiredSize.height},
    });
    currentY += this._resizeBar.frame.size.height;
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

  _didGrab: boolean = false;

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
