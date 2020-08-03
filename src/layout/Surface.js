// @flow

import type {Interaction} from '../useCanvasInteraction';
import type {Size} from './geometry';

import {getCanvasContext} from '../canvas/canvasUtils';

import {View} from './View';
import {zeroPoint} from './geometry';

/**
 * Represents the canvas surface and a view heirarchy. A surface is also the
 * place where all interactions enter the view heirarchy.
 */
export class Surface {
  rootView: ?View;
  _context: ?CanvasRenderingContext2D;
  _canvasSize: ?Size;

  setCanvas(canvas: HTMLCanvasElement, canvasSize: Size) {
    this._context = getCanvasContext(
      canvas,
      canvasSize.height,
      canvasSize.width,
    );
    this._canvasSize = canvasSize;

    if (this.rootView) {
      this.rootView.setNeedsDisplay();
    }
  }

  displayIfNeeded() {
    const {rootView, _canvasSize, _context} = this;
    if (!rootView || !_context || !_canvasSize) {
      return;
    }
    rootView.setFrame({
      origin: zeroPoint,
      size: _canvasSize,
    });
    rootView.setVisibleArea({
      origin: zeroPoint,
      size: _canvasSize,
    });
    rootView.displayIfNeeded(_context);
  }

  handleInteraction(interaction: Interaction) {
    if (!this.rootView) {
      return;
    }
    this.rootView.handleInteractionAndPropagateToSubviews(interaction);
  }
}
