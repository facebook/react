/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Rect} from '../../view-base';

import {rectEqualToRect} from '../../view-base';
import {COLORS, FONT_SIZE, TEXT_PADDING} from '../constants';

const cachedTextWidths = new Map();

export function trimText(
  context: CanvasRenderingContext2D,
  text: string,
  width: number,
): string | null {
  for (let i = text.length - 1; i >= 0; i--) {
    const trimmedText = i === text.length - 1 ? text : text.substr(0, i) + '…';

    let measuredWidth = cachedTextWidths.get(trimmedText);
    if (measuredWidth == null) {
      measuredWidth = context.measureText(trimmedText).width;
      cachedTextWidths.set(trimmedText, measuredWidth);
    }

    if (measuredWidth <= width) {
      return trimmedText;
    }
  }

  return null;
}

export function drawText(
  text: string,
  context: CanvasRenderingContext2D,
  fullRect: Rect,
  drawableRect: Rect,
  availableWidth: number,
  textAlign: 'left' | 'center' = 'left',
  fillStyle: string = COLORS.TEXT_COLOR,
): void {
  if (availableWidth > TEXT_PADDING * 2) {
    context.textAlign = textAlign;
    context.textBaseline = 'middle';
    context.font = `${FONT_SIZE}px sans-serif`;

    const {x, y} = fullRect.origin;

    const trimmedName = trimText(
      context,
      text,
      availableWidth - TEXT_PADDING * 2 + (x < 0 ? x : 0),
    );

    if (trimmedName !== null) {
      context.fillStyle = fillStyle;

      // Prevent text from visibly overflowing its container when clipped.
      const textOverflowsViewableArea = !rectEqualToRect(
        drawableRect,
        fullRect,
      );
      if (textOverflowsViewableArea) {
        context.save();
        context.beginPath();
        context.rect(
          drawableRect.origin.x,
          drawableRect.origin.y,
          drawableRect.size.width,
          drawableRect.size.height,
        );
        context.closePath();
        context.clip();
      }

      let textX;
      if (textAlign === 'center') {
        textX = x + availableWidth / 2 + TEXT_PADDING - (x < 0 ? x : 0);
      } else {
        textX = x + TEXT_PADDING - (x < 0 ? x : 0);
      }

      const textY = y + fullRect.size.height / 2;

      context.fillText(trimmedName, textX, textY);

      if (textOverflowsViewableArea) {
        context.restore();
      }
    }
  }
}
