// @flow

import type {Rect} from './geometry';

import {Surface} from './Surface';
import {View} from './View';
import {
  rectIntersectsRect,
  rectIntersectionWithRect,
  zeroRect,
} from './geometry';

export type Layouter = (views: View[], containingFrame: Rect) => void;

export const layeredLayout: Layouter = (views, frame) =>
  views.forEach(subview => {
    subview.setFrame(frame);
  });

/**
 * Stacks `views` vertically in `frame`. All views in `views` will have their
 * widths set to the frame's width.
 */
export const verticallyStackedLayout: Layouter = (views, frame) => {
  let currentY = frame.origin.y;
  views.forEach(view => {
    const desiredSize = view.desiredSize();
    const height = desiredSize
      ? desiredSize.height
      : frame.origin.y + frame.size.height - currentY;
    const proposedFrame = {
      origin: {x: frame.origin.x, y: currentY},
      size: {width: frame.size.width, height},
    };
    view.setFrame(proposedFrame);
    currentY += height;
  });
};

export class StaticLayoutView extends View {
  layouter: Layouter;

  constructor(
    surface: Surface,
    frame: Rect,
    layouter: Layouter,
    initialSubviews: View[],
  ) {
    super(surface, frame);
    this.layouter = layouter;
    initialSubviews.forEach(subview => this.addSubview(subview));
  }

  layoutSubviews() {
    const {frame, layouter, subviews, visibleArea} = this;
    layouter(subviews, frame);
    subviews.forEach(subview => {
      if (rectIntersectsRect(visibleArea, subview.frame)) {
        subview.setVisibleArea(
          rectIntersectionWithRect(visibleArea, subview.frame),
        );
      } else {
        subview.setVisibleArea(zeroRect);
      }
    });
  }
}
