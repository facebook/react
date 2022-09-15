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
} from '../useCanvasInteraction';
import type {Rect, Size} from '../geometry';
import type {ViewRefs} from '../Surface';

import {BORDER_SIZE, COLORS} from '../../content-views/constants';
import {drawText} from '../../content-views/utils/text';
import {Surface} from '../Surface';
import {View} from '../View';
import {rectContainsPoint} from '../geometry';
import {noopLayout} from '../layouter';

type ResizeBarState = 'normal' | 'hovered' | 'dragging';

const RESIZE_BAR_DOT_RADIUS = 1;
const RESIZE_BAR_DOT_SPACING = 4;
const RESIZE_BAR_HEIGHT = 8;
const RESIZE_BAR_WITH_LABEL_HEIGHT = 16;

export class ResizeBarView extends View {
  _interactionState: ResizeBarState = 'normal';
  _label: string;

  showLabel: boolean = false;

  constructor(surface: Surface, frame: Rect, label: string) {
    super(surface, frame, noopLayout);

    this._label = label;
  }

  desiredSize(): Size {
    return this.showLabel
      ? {height: RESIZE_BAR_WITH_LABEL_HEIGHT, width: 0}
      : {height: RESIZE_BAR_HEIGHT, width: 0};
  }

  draw(context: CanvasRenderingContext2D, viewRefs: ViewRefs) {
    const {frame} = this;
    const {x, y} = frame.origin;
    const {width, height} = frame.size;

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
          width: frame.size.width,
          height: RESIZE_BAR_WITH_LABEL_HEIGHT,
        },
      };

      drawText(this._label, context, labelRect, frame, {
        fillStyle: COLORS.REACT_RESIZE_BAR_DOT,
        textAlign: 'center',
      });
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
        break;
      case 'mousemove':
        this._handleMouseMove(interaction, viewRefs);
        break;
      case 'mouseup':
        this._handleMouseUp(interaction, viewRefs);
        break;
    }
  }
}
