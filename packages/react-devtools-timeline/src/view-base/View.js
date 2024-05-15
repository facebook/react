/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Interaction} from './useCanvasInteraction';
import type {IntrinsicSize, Rect, Size} from './geometry';
import type {Layouter} from './layouter';
import type {ViewRefs} from './Surface';

import {Surface} from './Surface';
import {
  rectEqualToRect,
  intersectionOfRects,
  rectIntersectsRect,
  sizeIsEmpty,
  sizeIsValid,
  unionOfRects,
  zeroRect,
} from './geometry';
import {noopLayout, viewsToLayout, collapseLayoutIntoViews} from './layouter';

/**
 * Base view class that can be subclassed to draw custom content or manage
 * subclasses.
 */
export class View {
  _backgroundColor: string | null;

  currentCursor: string | null = null;

  surface: Surface;

  frame: Rect;
  visibleArea: Rect;

  superview: ?View;
  subviews: View[] = [];

  /**
   * An injected function that lays out our subviews.
   * @private
   */
  _layouter: Layouter;

  /**
   * Whether this view needs to be drawn.
   *
   * NOTE: Do not set directly! Use `setNeedsDisplay`.
   *
   * @see setNeedsDisplay
   * @private
   */
  _needsDisplay: boolean = true;

  /**
   * Whether the hierarchy below this view has subviews that need display.
   *
   * NOTE: Do not set directly! Use `setSubviewsNeedDisplay`.
   *
   * @see setSubviewsNeedDisplay
   * @private
   */
  _subviewsNeedDisplay: boolean = false;

  constructor(
    surface: Surface,
    frame: Rect,
    layouter: Layouter = noopLayout,
    visibleArea: Rect = frame,
    backgroundColor?: string | null = null,
  ) {
    this._backgroundColor = backgroundColor || null;
    this.surface = surface;
    this.frame = frame;
    this._layouter = layouter;
    this.visibleArea = visibleArea;
  }

  /**
   * Invalidates view's contents.
   *
   * Downward propagating; once called, all subviews of this view should also
   * be invalidated.
   */
  setNeedsDisplay() {
    this._needsDisplay = true;
    if (this.superview) {
      this.superview._setSubviewsNeedDisplay();
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
  _setSubviewsNeedDisplay() {
    this._subviewsNeedDisplay = true;
    if (this.superview) {
      this.superview._setSubviewsNeedDisplay();
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

  /**
   * A size that can be used as a hint by layout functions.
   *
   * Implementations should typically return the intrinsic content size or a
   * size that fits all the view's content.
   *
   * The default implementation returns a size that fits all the view's
   * subviews.
   *
   * Can be overridden by subclasses.
   */
  desiredSize(): Size | IntrinsicSize {
    if (this._needsDisplay) {
      this.layoutSubviews();
    }
    const frames = this.subviews.map(subview => subview.frame);
    return unionOfRects(...frames).size;
  }

  /**
   * Appends `view` to the list of this view's `subviews`.
   */
  addSubview(view: View) {
    if (this.subviews.includes(view)) {
      return;
    }
    this.subviews.push(view);
    view.superview = this;
  }

  /**
   * Breaks the subview-superview relationship between `view` and this view, if
   * `view` is a subview of this view.
   */
  removeSubview(view: View) {
    const subviewIndex = this.subviews.indexOf(view);
    if (subviewIndex === -1) {
      return;
    }
    view.superview = undefined;
    this.subviews.splice(subviewIndex, 1);
  }

  /**
   * Removes all subviews from this view.
   */
  removeAllSubviews() {
    this.subviews.forEach(subview => (subview.superview = undefined));
    this.subviews = [];
  }

  /**
   * Executes the display flow if this view needs to be drawn.
   *
   * 1. Lays out subviews with `layoutSubviews`.
   * 2. Draws content with `draw`.
   */
  displayIfNeeded(context: CanvasRenderingContext2D, viewRefs: ViewRefs) {
    if (
      (this._needsDisplay || this._subviewsNeedDisplay) &&
      rectIntersectsRect(this.frame, this.visibleArea) &&
      !sizeIsEmpty(this.visibleArea.size)
    ) {
      this.layoutSubviews();
      if (this._needsDisplay) {
        this._needsDisplay = false;
      }
      if (this._subviewsNeedDisplay) this._subviewsNeedDisplay = false;

      // Clip anything drawn by the view to prevent it from overflowing its visible area.
      const visibleArea = this.visibleArea;
      const region = new Path2D();
      region.rect(
        visibleArea.origin.x,
        visibleArea.origin.y,
        visibleArea.size.width,
        visibleArea.size.height,
      );
      context.save();
      context.clip(region);
      context.beginPath();

      this.draw(context, viewRefs);

      // Stop clipping
      context.restore();
    }
  }

  /**
   * Layout self and subviews.
   *
   * Implementations should call `setNeedsDisplay` if a draw is required.
   *
   * The default implementation uses `this.layouter` to lay out subviews.
   *
   * Can be overwritten by subclasses that wish to manually manage their
   * subviews' layout.
   *
   * NOTE: Do not call directly! Use `displayIfNeeded`.
   *
   * @see displayIfNeeded
   */
  layoutSubviews() {
    const {frame, _layouter, subviews, visibleArea} = this;
    const existingLayout = viewsToLayout(subviews);
    const newLayout = _layouter(existingLayout, frame);
    collapseLayoutIntoViews(newLayout);

    subviews.forEach((subview, subviewIndex) => {
      if (rectIntersectsRect(visibleArea, subview.frame)) {
        subview.setVisibleArea(intersectionOfRects(visibleArea, subview.frame));
      } else {
        subview.setVisibleArea(zeroRect);
      }
    });
  }

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
  draw(context: CanvasRenderingContext2D, viewRefs: ViewRefs) {
    const {subviews, visibleArea} = this;
    subviews.forEach(subview => {
      if (rectIntersectsRect(visibleArea, subview.visibleArea)) {
        subview.displayIfNeeded(context, viewRefs);
      }
    });

    const backgroundColor = this._backgroundColor;
    if (backgroundColor !== null) {
      const desiredSize = this.desiredSize();
      if (visibleArea.size.height > desiredSize.height) {
        context.fillStyle = backgroundColor;
        context.fillRect(
          visibleArea.origin.x,
          visibleArea.origin.y + desiredSize.height,
          visibleArea.size.width,
          visibleArea.size.height - desiredSize.height,
        );
      }
    }
  }

  /**
   * Handle an `interaction`.
   *
   * To be overwritten by subclasses that wish to handle interactions.
   *
   * NOTE: Do not call directly! Use `handleInteractionAndPropagateToSubviews`
   */
  handleInteraction(interaction: Interaction, viewRefs: ViewRefs): ?boolean {}

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
  handleInteractionAndPropagateToSubviews(
    interaction: Interaction,
    viewRefs: ViewRefs,
  ): boolean {
    const {subviews, visibleArea} = this;

    if (visibleArea.size.height === 0) {
      return false;
    }

    // Pass the interaction to subviews first,
    // so they have the opportunity to claim it before it bubbles.
    //
    // Views are painted first to last,
    // so they should process interactions last to first,
    // so views in front (on top) can claim the interaction first.
    for (let i = subviews.length - 1; i >= 0; i--) {
      const subview = subviews[i];
      if (rectIntersectsRect(visibleArea, subview.visibleArea)) {
        const didSubviewHandle =
          subview.handleInteractionAndPropagateToSubviews(
            interaction,
            viewRefs,
          ) === true;
        if (didSubviewHandle) {
          return true;
        }
      }
    }

    const didSelfHandle =
      this.handleInteraction(interaction, viewRefs) === true;
    if (didSelfHandle) {
      return true;
    }

    return false;
  }
}
