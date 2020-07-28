// @flow

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
