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
import type {ViewRef} from './Surface';

import {COLORS} from '../content-views/constants';
import nullthrows from 'nullthrows';
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

  _handleMouseDown(
    interaction: MouseDownInteraction,
    activeViewRef: ViewRef,
    hoveredViewRef: ViewRef,
  ) {
    const cursorInView = rectContainsPoint(
      interaction.payload.location,
      this.frame,
    );
    if (cursorInView) {
      this._setInteractionState('dragging');
      activeViewRef.current = this;
    }
  }

  _handleMouseMove(
    interaction: MouseMoveInteraction,
    activeViewRef: ViewRef,
    hoveredViewRef: ViewRef,
  ) {
    const cursorInView = rectContainsPoint(
      interaction.payload.location,
      this.frame,
    );

    if (cursorInView || activeViewRef.current === this) {
      this.currentCursor = 'ns-resize';
    }
    if (cursorInView) {
      hoveredViewRef.current = this;
    }

    if (this._interactionState === 'dragging') {
      return;
    }
    this._setInteractionState(cursorInView ? 'hovered' : 'normal');
  }

  _handleMouseUp(
    interaction: MouseUpInteraction,
    activeViewRef: ViewRef,
    hoveredViewRef: ViewRef,
  ) {
    const cursorInView = rectContainsPoint(
      interaction.payload.location,
      this.frame,
    );
    if (this._interactionState === 'dragging') {
      this._setInteractionState(cursorInView ? 'hovered' : 'normal');
    }

    if (activeViewRef.current === this) {
      activeViewRef.current = null;
    }
  }

  handleInteraction(
    interaction: Interaction,
    activeViewRef: ViewRef,
    hoveredViewRef: ViewRef,
  ) {
    switch (interaction.type) {
      case 'mousedown':
        this._handleMouseDown(interaction, activeViewRef, hoveredViewRef);
        return;
      case 'mousemove':
        this._handleMouseMove(interaction, activeViewRef, hoveredViewRef);
        return;
      case 'mouseup':
        this._handleMouseUp(interaction, activeViewRef, hoveredViewRef);
        return;
    }
  }
}

export class ResizableSplitView extends View {
  _canvasRef: {current: HTMLCanvasElement | null};
  _resizingState: ResizingState | null = null;
  _layoutState: LayoutState;

  constructor(
    surface: Surface,
    frame: Rect,
    topSubview: View,
    bottomSubview: View,
    canvasRef: {current: HTMLCanvasElement | null},
  ) {
    super(surface, frame, noopLayout);

    this._canvasRef = canvasRef;

    this.addSubview(topSubview);
    this.addSubview(new ResizeBar(surface, frame));
    this.addSubview(bottomSubview);

    const topSubviewDesiredSize = topSubview.desiredSize();
    this._layoutState = {
      barOffsetY: topSubviewDesiredSize ? topSubviewDesiredSize.height : 0,
    };
  }

  _getTopSubview(): View {
    return this.subviews[0];
  }

  _getResizeBar(): View {
    return this.subviews[1];
  }

  _getBottomSubview(): View {
    return this.subviews[2];
  }

  _getResizeBarDesiredSize(): Size {
    return nullthrows(
      this._getResizeBar().desiredSize(),
      'Resize bar must have desired size',
    );
  }

  desiredSize() {
    const topSubviewDesiredSize = this._getTopSubview().desiredSize();
    const resizeBarDesiredSize = this._getResizeBarDesiredSize();
    const bottomSubviewDesiredSize = this._getBottomSubview().desiredSize();

    const topSubviewDesiredWidth = topSubviewDesiredSize
      ? topSubviewDesiredSize.width
      : 0;
    const bottomSubviewDesiredWidth = bottomSubviewDesiredSize
      ? bottomSubviewDesiredSize.width
      : 0;

    const topSubviewDesiredHeight = topSubviewDesiredSize
      ? topSubviewDesiredSize.height
      : 0;
    const bottomSubviewDesiredHeight = bottomSubviewDesiredSize
      ? bottomSubviewDesiredSize.height
      : 0;

    return {
      width: Math.max(
        topSubviewDesiredWidth,
        resizeBarDesiredSize.width,
        bottomSubviewDesiredWidth,
      ),
      height:
        topSubviewDesiredHeight +
        resizeBarDesiredSize.height +
        bottomSubviewDesiredHeight,
    };
  }

  layoutSubviews() {
    this._updateLayoutState();
    this._updateSubviewFrames();
    super.layoutSubviews();
  }

  _updateLayoutState() {
    const {frame, visibleArea, _resizingState} = this;

    const resizeBarDesiredSize = this._getResizeBarDesiredSize();
    // Allow bar to travel to bottom of the visible area of this view but no further
    const maxPossibleBarOffset =
      visibleArea.size.height - resizeBarDesiredSize.height;
    const topSubviewDesiredSize = this._getTopSubview().desiredSize();
    const maxBarOffset = topSubviewDesiredSize
      ? Math.min(maxPossibleBarOffset, topSubviewDesiredSize.height)
      : maxPossibleBarOffset;

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
        size: {width, height},
      },
      _layoutState: {barOffsetY},
    } = this;

    const resizeBarDesiredSize = this._getResizeBarDesiredSize();

    let currentY = y;

    this._getTopSubview().setFrame({
      origin: {x, y: currentY},
      size: {width, height: barOffsetY},
    });
    currentY += this._getTopSubview().frame.size.height;

    this._getResizeBar().setFrame({
      origin: {x, y: currentY},
      size: {width, height: resizeBarDesiredSize.height},
    });
    currentY += this._getResizeBar().frame.size.height;

    this._getBottomSubview().setFrame({
      origin: {x, y: currentY},
      // Fill remaining height
      size: {width, height: height + y - currentY},
    });
  }

  _handleMouseDown(interaction: MouseDownInteraction) {
    const cursorLocation = interaction.payload.location;
    const resizeBarFrame = this._getResizeBar().frame;
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
    const resizeBarFrame = this._getResizeBar().frame;
    if (rectContainsPoint(cursorLocation, resizeBarFrame)) {
      return this;
    } else {
      return null;
    }
  }

  handleInteraction(
    interaction: Interaction,
    activeViewRef: ViewRef,
    hoveredViewRef: ViewRef,
  ) {
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
