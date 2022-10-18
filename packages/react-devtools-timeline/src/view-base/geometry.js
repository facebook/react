/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type Point = $ReadOnly<{x: number, y: number}>;
export type Size = $ReadOnly<{width: number, height: number}>;
export type IntrinsicSize = {
  ...Size,

  // If content is this height or less, hide the scrollbar entirely,
  // so that it doesn't take up vertical space unnecessarily (e.g. for a single row of content).
  hideScrollBarIfLessThanHeight?: number,

  // The initial height should be the height of the content, or this, whichever is less.
  maxInitialHeight?: number,
};
export type Rect = $ReadOnly<{origin: Point, size: Size}>;

/**
 * Alternative representation of `Rect`.
 * A tuple of (`top`, `right`, `bottom`, `left`) coordinates.
 */
type Box = [number, number, number, number];

export const zeroPoint: Point = Object.freeze({x: 0, y: 0});
export const zeroSize: Size = Object.freeze({width: 0, height: 0});
export const zeroRect: Rect = Object.freeze({
  origin: zeroPoint,
  size: zeroSize,
});

export function pointEqualToPoint(point1: Point, point2: Point): boolean {
  return point1.x === point2.x && point1.y === point2.y;
}

export function sizeEqualToSize(size1: Size, size2: Size): boolean {
  return size1.width === size2.width && size1.height === size2.height;
}

export function rectEqualToRect(rect1: Rect, rect2: Rect): boolean {
  return (
    pointEqualToPoint(rect1.origin, rect2.origin) &&
    sizeEqualToSize(rect1.size, rect2.size)
  );
}

export function sizeIsValid({width, height}: Size): boolean {
  return width >= 0 && height >= 0;
}

export function sizeIsEmpty({width, height}: Size): boolean {
  return width <= 0 || height <= 0;
}

function rectToBox(rect: Rect): Box {
  const top = rect.origin.y;
  const right = rect.origin.x + rect.size.width;
  const bottom = rect.origin.y + rect.size.height;
  const left = rect.origin.x;
  return [top, right, bottom, left];
}

function boxToRect(box: Box): Rect {
  const [top, right, bottom, left] = box;
  return {
    origin: {
      x: left,
      y: top,
    },
    size: {
      width: right - left,
      height: bottom - top,
    },
  };
}

export function rectIntersectsRect(rect1: Rect, rect2: Rect): boolean {
  if (
    rect1.size.width === 0 ||
    rect1.size.height === 0 ||
    rect2.size.width === 0 ||
    rect2.size.height === 0
  ) {
    return false;
  }

  const [top1, right1, bottom1, left1] = rectToBox(rect1);
  const [top2, right2, bottom2, left2] = rectToBox(rect2);
  return !(
    right1 < left2 ||
    right2 < left1 ||
    bottom1 < top2 ||
    bottom2 < top1
  );
}

/**
 * Returns the intersection of the 2 rectangles.
 *
 * Prerequisite: `rect1` must intersect with `rect2`.
 */
export function intersectionOfRects(rect1: Rect, rect2: Rect): Rect {
  const [top1, right1, bottom1, left1] = rectToBox(rect1);
  const [top2, right2, bottom2, left2] = rectToBox(rect2);
  return boxToRect([
    Math.max(top1, top2),
    Math.min(right1, right2),
    Math.min(bottom1, bottom2),
    Math.max(left1, left2),
  ]);
}

export function rectContainsPoint({x, y}: Point, rect: Rect): boolean {
  const [top, right, bottom, left] = rectToBox(rect);
  return left <= x && x <= right && top <= y && y <= bottom;
}

/**
 * Returns the smallest rectangle that contains all provided rects.
 *
 * @returns Union of `rects`. If `rects` is empty, returns `zeroRect`.
 */
export function unionOfRects(...rects: Rect[]): Rect {
  if (rects.length === 0) {
    return zeroRect;
  }

  const [firstRect, ...remainingRects] = rects;
  const boxUnion = remainingRects
    .map(rectToBox)
    .reduce((intermediateUnion, nextBox): Box => {
      const [unionTop, unionRight, unionBottom, unionLeft] = intermediateUnion;
      const [nextTop, nextRight, nextBottom, nextLeft] = nextBox;
      return [
        Math.min(unionTop, nextTop),
        Math.max(unionRight, nextRight),
        Math.max(unionBottom, nextBottom),
        Math.min(unionLeft, nextLeft),
      ];
    }, rectToBox(firstRect));
  return boxToRect(boxUnion);
}
