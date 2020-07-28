// @flow

import type {Interaction} from '../useCanvasInteraction';
import type {Size} from './geometry';

import {getCanvasContext} from '../canvas/canvasUtils';

import {View} from './View';
import {zeroPoint} from './geometry';

export class Surface {
  rootView: ?View;
  context: ?CanvasRenderingContext2D;
  canvasSize: ?Size;

  setCanvas(canvas: HTMLCanvasElement, canvasSize: Size) {
    this.context = getCanvasContext(
      canvas,
      canvasSize.height,
      canvasSize.width,
    );
    this.canvasSize = canvasSize;

    if (this.rootView) {
      this.rootView.setNeedsDisplay();
    }
  }

  displayIfNeeded() {
    const {rootView, canvasSize, context} = this;
    if (!rootView || !context || !canvasSize) {
      return;
    }
    rootView.setFrame({
      origin: zeroPoint,
      size: canvasSize,
    });
    rootView.setVisibleArea({
      origin: zeroPoint,
      size: canvasSize,
    });
    rootView.displayIfNeeded(context);
  }

  handleInteraction(interaction: Interaction) {
    if (!this.rootView) {
      return;
    }
    this.rootView.handleInteractionAndPropagateToSubviews(interaction);
  }
}
