// @flow

type MutablePoint = {x: number, y: number};
type MutableSize = {width: number, height: number};

export type Point = $ReadOnly<MutablePoint>;
export type Size = $ReadOnly<MutableSize>;
export type Rect = $ReadOnly<{origin: Point, size: Size}>;

/**
 * Alternative representation of `Rect`.
 * A tuple of (`top`, `right`, `bottom`, `left`) coordinates.
 */
type RectBoundaries = [number, number, number, number];

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

function rectToBoundaries(rect: Rect): RectBoundaries {
  const top = rect.origin.y;
  const right = rect.origin.x + rect.size.width;
  const bottom = rect.origin.y + rect.size.height;
  const left = rect.origin.x;
  return [top, right, bottom, left];
}

function boundariesToRect(boundaries: RectBoundaries): Rect {
  const [top, right, bottom, left] = boundaries;
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
  const [top1, right1, bottom1, left1] = rectToBoundaries(rect1);
  const [top2, right2, bottom2, left2] = rectToBoundaries(rect2);
  return !(
    right1 < left2 ||
    right2 < left1 ||
    bottom1 < top2 ||
    bottom2 < top1
  );
}

/**
 * Prerequisite: rect1 must intersect with rect2.
 */
export function rectIntersectionWithRect(rect1: Rect, rect2: Rect): Rect {
  const [top1, right1, bottom1, left1] = rectToBoundaries(rect1);
  const [top2, right2, bottom2, left2] = rectToBoundaries(rect2);
  return boundariesToRect([
    Math.max(top1, top2),
    Math.min(right1, right2),
    Math.min(bottom1, bottom2),
    Math.max(left1, left2),
  ]);
}

export function rectContainsPoint({x, y}: Point, rect: Rect): boolean {
  const [top, right, bottom, left] = rectToBoundaries(rect);
  return left <= x && x <= right && top <= y && y <= bottom;
}

/**
 * The smallest rectangle that contains all provided rects.
 *
 * @returns `zeroRect` if `rects` is empty.
 */
export function unionOfRects(...rects: Rect[]): Rect {
  if (rects.length === 0) {
    return zeroRect;
  }

  const [firstRect, ...remainingRects] = rects;
  const boundaryUnion = remainingRects
    .map(rectToBoundaries)
    .reduce((unionBoundaries, nextBoundaries): RectBoundaries => {
      const [unionTop, unionRight, unionBottom, unionLeft] = unionBoundaries;
      const [nextTop, nextRight, nextBottom, nextLeft] = nextBoundaries;
      return [
        Math.min(unionTop, nextTop),
        Math.max(unionRight, nextRight),
        Math.max(unionBottom, nextBottom),
        Math.min(unionLeft, nextLeft),
      ];
    }, rectToBoundaries(firstRect));
  return boundariesToRect(boundaryUnion);
}
