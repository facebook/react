// @flow

import type {Interaction} from '../useCanvasInteraction';
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
  subviews: View[] = [];
  layouter: Layouter;

  constructor(
    surface: Surface,
    frame: Rect,
    layouter: Layouter,
    subviews: View[],
  ) {
    super(surface, frame);
    this.layouter = layouter;
    subviews.forEach(subview => this.addSubview(subview));
  }

  setNeedsDisplay() {
    super.setNeedsDisplay();
    this.subviews.forEach(subview => subview.setNeedsDisplay());
  }

  addSubview(view: View) {
    this.subviews.push(view);
    view.superview = this;
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

  draw(context: CanvasRenderingContext2D) {
    const {subviews, visibleArea} = this;
    subviews.forEach(subview => {
      if (rectIntersectsRect(visibleArea, subview.visibleArea)) {
        subview.displayIfNeeded(context);
      }
    });
  }

  handleInteractionAndPropagateToSubviews(interaction: Interaction) {
    this.subviews.forEach(subview =>
      subview.handleInteractionAndPropagateToSubviews(interaction),
    );
  }
}
