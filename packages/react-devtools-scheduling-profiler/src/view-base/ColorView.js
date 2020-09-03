/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Rect} from './geometry';

import {Surface} from './Surface';
import {View} from './View';

/**
 * View that fills its visible area with a CSS color.
 */
export class ColorView extends View {
  _color: string;

  constructor(surface: Surface, frame: Rect, color: string) {
    super(surface, frame);
    this._color = color;
  }

  setColor(color: string) {
    if (this._color === color) {
      return;
    }
    this._color = color;
    this.setNeedsDisplay();
  }

  draw(context: CanvasRenderingContext2D) {
    const {_color, visibleArea} = this;
    context.fillStyle = _color;
    context.fillRect(
      visibleArea.origin.x,
      visibleArea.origin.y,
      visibleArea.size.width,
      visibleArea.size.height,
    );
  }
}
