// @flow

type MutablePoint = {x: number, y: number};
type MutableSize = {width: number, height: number};

export type Point = $ReadOnly<MutablePoint>;
export type Size = $ReadOnly<MutableSize>;
export type Rect = $ReadOnly<{origin: Point, size: Size}>;

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

function rectToBoundaryCoordinates(
  rect: Rect,
): [number, number, number, number] {
  const top = rect.origin.y;
  const right = rect.origin.x + rect.size.width;
  const bottom = rect.origin.y + rect.size.height;
  const left = rect.origin.x;
  return [top, right, bottom, left];
}

export function rectIntersectsRect(rect1: Rect, rect2: Rect): boolean {
  const [top1, right1, bottom1, left1] = rectToBoundaryCoordinates(rect1);
  const [top2, right2, bottom2, left2] = rectToBoundaryCoordinates(rect2);
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
  const [top1, right1, bottom1, left1] = rectToBoundaryCoordinates(rect1);
  const [top2, right2, bottom2, left2] = rectToBoundaryCoordinates(rect2);

  const intersectleft = Math.max(left1, left2);
  const intersectRight = Math.min(right1, right2);
  const intersectTop = Math.max(top1, top2);
  const intersectBottom = Math.min(bottom1, bottom2);

  return {
    origin: {
      x: intersectleft,
      y: intersectTop,
    },
    size: {
      width: intersectRight - intersectleft,
      height: intersectBottom - intersectTop,
    },
  };
}

export function rectContainsPoint({x, y}: Point, rect: Rect): boolean {
  const [top, right, bottom, left] = rectToBoundaryCoordinates(rect);
  return left <= x && x <= right && top <= y && y <= bottom;
}
