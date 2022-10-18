/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {View} from './View';
import {COLORS} from '../content-views/constants';

/**
 * View that fills its visible area with a CSS color.
 */
export class BackgroundColorView extends View {
  draw(context: CanvasRenderingContext2D) {
    const {visibleArea} = this;

    context.fillStyle = COLORS.BACKGROUND;
    context.fillRect(
      visibleArea.origin.x,
      visibleArea.origin.y,
      visibleArea.size.width,
      visibleArea.size.height,
    );
  }
}
