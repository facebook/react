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

/**
 * Base view class that can be subclassed to draw custom content or manage
 * subclasses.
 */
export class View {
  surface: Surface;

  frame: Rect;
  visibleArea: Rect;

  superview: ?View;
  subviews: View[] = [];

  /**
   * Whether this view needs to be drawn.
   *
   * NOTE: Do not set directly! Use `setNeedsDisplay`.
   *
   * @see setNeedsDisplay
   * @private
   */
  needsDisplay = true;

  /**
   * Whether the heirarchy below this view has subviews that need display.
   *
   * NOTE: Do not set directly! Use `setSubviewsNeedDisplay`.
   *
   * @see setSubviewsNeedDisplay
   * @private
   */
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
   */
  setNeedsDisplay() {
    this.needsDisplay = true;
    if (this.superview) {
      this.superview.setSubviewsNeedDisplay();
    }
    this.subviews.forEach(subview => subview.setNeedsDisplay());
  }

  /**
   * Informs superview that it has subviews that need to be drawn.
   *
   * Upward propagating; once called, all superviews of this view should also
   * have `subviewsNeedDisplay` = true.
   *
   * @private
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
   * Appends `view` to the list of this view's `subviews`.
   */
  addSubview(view: View) {
    this.subviews.push(view);
    view.superview = this;
  }

  /**
   * Executes the display flow if this view needs to be drawn.
   *
   * 1. Lays out subviews with `layoutSubviews`.
   * 2. Draws content with `draw`.
   */
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

  /**
   * Layout self and subviews.
   *
   * Implementations should call `setNeedsDisplay` if a draw is required.
   *
   * To be overwritten by subclasses that wish to manage their subviews'
   * layout.
   *
   * NOTE: Do not call directly! Use `displayIfNeeded`.
   *
   * @see displayIfNeeded
   */
  layoutSubviews() {}

  /**
   * Draw the contents of this view in the given canvas `context`.
   *
   * Defaults to drawing this view's `subviews`.
   *
   * To be overwritten by subclasses that wish to draw custom content.
   *
   * NOTE: Do not call directly! Use `displayIfNeeded`.
   *
   * @see displayIfNeeded
   */
  draw(context: CanvasRenderingContext2D) {
    const {subviews, visibleArea} = this;
    subviews.forEach(subview => {
      if (rectIntersectsRect(visibleArea, subview.visibleArea)) {
        subview.displayIfNeeded(context);
      }
    });
  }

  /**
   * Handle an `interaction`.
   *
   * To be overwritten by subclasses that wish to handle interactions.
   */
  // Internal note: Do not call directly! Use
  // `handleInteractionAndPropagateToSubviews` so that interactions are
  // propagated to subviews.
  handleInteraction(interaction: Interaction) {}

  /**
   * Handle an `interaction` and propagates it to all of this view's
   * `subviews`.
   *
   * NOTE: Should not be overridden! Subclasses should override
   * `handleInteraction` instead.
   *
   * @see handleInteraction
   * @protected
   */
  handleInteractionAndPropagateToSubviews(interaction: Interaction) {
    this.handleInteraction(interaction);
    this.subviews.forEach(subview =>
      subview.handleInteractionAndPropagateToSubviews(interaction),
    );
  }
}
