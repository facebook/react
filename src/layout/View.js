// @flow

import type {Interaction} from '../useCanvasInteraction';
import type {Rect, Size} from './geometry';

import {Surface} from './Surface';
import {
  rectIntersectsRect,
  rectEqualToRect,
  sizeIsEmpty,
  sizeIsValid,
  zeroRect,
} from './geometry';

export class View {
  surface: Surface;

  frame: Rect;
  visibleArea: Rect;

  superview: ?View;

  /** Whether this view needs to be drawn. */
  needsDisplay = true;
  /** Whether the heirarchy below this view has subviews that need display. */
  subviewsNeedDisplay = false;

  constructor(surface: Surface, frame: Rect, visibleArea: Rect = frame) {
    this.surface = surface;
    this.frame = frame;
    this.visibleArea = visibleArea;
  }

  /**
   * Invalidates view's contents.
   *
   * Downward propagating; once called, all subviews of this view should also
   * be invalidated.
   *
   * Subclasses with subviews should override this method and call
   * `setNeedsDisplay` on its subviews.
   */
  setNeedsDisplay() {
    this.needsDisplay = true;
    if (this.superview) {
      this.superview.setSubviewsNeedDisplay();
    }
  }

  /**
   * Informs superview that it has subviews that need to be drawn.
   *
   * Upward propagating; once called, all superviews of this view should also
   * have `subviewsNeedDisplay` = true.
   */
  setSubviewsNeedDisplay() {
    this.subviewsNeedDisplay = true;
    if (this.superview) {
      this.superview.setSubviewsNeedDisplay();
    }
  }

  setFrame(newFrame: Rect) {
    if (!rectEqualToRect(this.frame, newFrame)) {
      this.frame = newFrame;
      if (sizeIsValid(newFrame.size)) {
        this.frame = newFrame;
      } else {
        this.frame = zeroRect;
      }
      this.setNeedsDisplay();
    }
  }

  setVisibleArea(newVisibleArea: Rect) {
    if (!rectEqualToRect(this.visibleArea, newVisibleArea)) {
      if (sizeIsValid(newVisibleArea.size)) {
        this.visibleArea = newVisibleArea;
      } else {
        this.visibleArea = zeroRect;
      }
      this.setNeedsDisplay();
    }
  }

  desiredSize(): ?Size {}

  /**
   * Layout self and subviews.
   *
   * Call `setNeedsDisplay` if we are to redraw.
   *
   * To be overwritten by subclasses.
   */
  layoutSubviews() {}

  displayIfNeeded(context: CanvasRenderingContext2D) {
    if (
      (this.needsDisplay || this.subviewsNeedDisplay) &&
      rectIntersectsRect(this.frame, this.visibleArea) &&
      !sizeIsEmpty(this.visibleArea.size)
    ) {
      this.layoutSubviews();
      if (this.needsDisplay) this.needsDisplay = false;
      if (this.subviewsNeedDisplay) this.subviewsNeedDisplay = false;
      this.draw(context);
    }
  }

  draw(context: CanvasRenderingContext2D) {}

  handleInteractionAndPropagateToSubviews(interaction: Interaction): ?boolean {}
}
