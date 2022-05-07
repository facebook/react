/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  pointEqualToPoint,
  sizeEqualToSize,
  rectEqualToRect,
  sizeIsValid,
  sizeIsEmpty,
  rectIntersectsRect,
  intersectionOfRects,
  rectContainsPoint,
  unionOfRects,
} from '../geometry';

describe(pointEqualToPoint, () => {
  it('should return true when 2 points have the same values', () => {
    expect(pointEqualToPoint({x: 1, y: 1}, {x: 1, y: 1})).toBe(true);
    expect(pointEqualToPoint({x: -1, y: 2}, {x: -1, y: 2})).toBe(true);
    expect(
      pointEqualToPoint({x: 3.14159, y: 0.26535}, {x: 3.14159, y: 0.26535}),
    ).toBe(true);
  });

  it('should return false when 2 points have different values', () => {
    expect(pointEqualToPoint({x: 1, y: 1}, {x: 1, y: 0})).toBe(false);
    expect(pointEqualToPoint({x: -1, y: 2}, {x: 0, y: 1})).toBe(false);
    expect(
      pointEqualToPoint({x: 3.1416, y: 0.26534}, {x: 3.14159, y: 0.26535}),
    ).toBe(false);
  });
});

describe(sizeEqualToSize, () => {
  it('should return true when 2 sizes have the same values', () => {
    expect(sizeEqualToSize({width: 1, height: 1}, {width: 1, height: 1})).toBe(
      true,
    );
    expect(
      sizeEqualToSize({width: -1, height: 2}, {width: -1, height: 2}),
    ).toBe(true);
    expect(
      sizeEqualToSize(
        {width: 3.14159, height: 0.26535},
        {width: 3.14159, height: 0.26535},
      ),
    ).toBe(true);
  });

  it('should return false when 2 sizes have different values', () => {
    expect(sizeEqualToSize({width: 1, height: 1}, {width: 1, height: 0})).toBe(
      false,
    );
    expect(sizeEqualToSize({width: -1, height: 2}, {width: 0, height: 1})).toBe(
      false,
    );
    expect(
      sizeEqualToSize(
        {width: 3.1416, height: 0.26534},
        {width: 3.14159, height: 0.26535},
      ),
    ).toBe(false);
  });
});

describe(rectEqualToRect, () => {
  it('should return true when 2 rects have the same values', () => {
    expect(
      rectEqualToRect(
        {origin: {x: 1, y: 1}, size: {width: 1, height: 1}},
        {origin: {x: 1, y: 1}, size: {width: 1, height: 1}},
      ),
    ).toBe(true);
    expect(
      rectEqualToRect(
        {origin: {x: 1, y: 2}, size: {width: 3.14, height: 4}},
        {origin: {x: 1, y: 2}, size: {width: 3.14, height: 4}},
      ),
    ).toBe(true);
  });

  it('should return false when 2 rects have different values', () => {
    expect(
      rectEqualToRect(
        {origin: {x: 1, y: 1}, size: {width: 1, height: 1}},
        {origin: {x: 0, y: 1}, size: {width: 1, height: 1}},
      ),
    ).toBe(false);
    expect(
      rectEqualToRect(
        {origin: {x: 1, y: 2}, size: {width: 3.14, height: 4}},
        {origin: {x: 1, y: 2}, size: {width: 3.15, height: 4}},
      ),
    ).toBe(false);
  });
});

describe(sizeIsValid, () => {
  it('should return true when the size has non-negative width and height', () => {
    expect(sizeIsValid({width: 1, height: 1})).toBe(true);
    expect(sizeIsValid({width: 0, height: 0})).toBe(true);
  });

  it('should return false when the size has negative width or height', () => {
    expect(sizeIsValid({width: 0, height: -1})).toBe(false);
    expect(sizeIsValid({width: -1, height: 0})).toBe(false);
    expect(sizeIsValid({width: -1, height: -1})).toBe(false);
  });
});

describe(sizeIsEmpty, () => {
  it('should return true when the size has negative area', () => {
    expect(sizeIsEmpty({width: 1, height: -1})).toBe(true);
    expect(sizeIsEmpty({width: -1, height: -1})).toBe(true);
  });

  it('should return true when the size has zero area', () => {
    expect(sizeIsEmpty({width: 0, height: 0})).toBe(true);
    expect(sizeIsEmpty({width: 0, height: 1})).toBe(true);
    expect(sizeIsEmpty({width: 1, height: 0})).toBe(true);
  });

  it('should return false when the size has positive area', () => {
    expect(sizeIsEmpty({width: 1, height: 1})).toBe(false);
    expect(sizeIsEmpty({width: 2, height: 1})).toBe(false);
  });
});

describe(rectIntersectsRect, () => {
  it('should return true when 2 rects intersect', () => {
    // Rects touch
    expect(
      rectIntersectsRect(
        {origin: {x: 0, y: 0}, size: {width: 1, height: 1}},
        {origin: {x: 1, y: 1}, size: {width: 1, height: 1}},
      ),
    ).toEqual(true);

    // Rects overlap
    expect(
      rectIntersectsRect(
        {origin: {x: 0, y: 0}, size: {width: 2, height: 1}},
        {origin: {x: 1, y: -2}, size: {width: 0.5, height: 5}},
      ),
    ).toEqual(true);

    // Rects are equal
    expect(
      rectIntersectsRect(
        {origin: {x: 1, y: 2}, size: {width: 3.14, height: 4}},
        {origin: {x: 1, y: 2}, size: {width: 3.14, height: 4}},
      ),
    ).toEqual(true);
  });

  it('should return false when 2 rects do not intersect', () => {
    expect(
      rectIntersectsRect(
        {origin: {x: 0, y: 1}, size: {width: 1, height: 1}},
        {origin: {x: 0, y: 10}, size: {width: 1, height: 1}},
      ),
    ).toBe(false);
    expect(
      rectIntersectsRect(
        {origin: {x: 1, y: 2}, size: {width: 3.14, height: 4}},
        {origin: {x: -4, y: 2}, size: {width: 3.15, height: 4}},
      ),
    ).toBe(false);
  });
});

describe(intersectionOfRects, () => {
  // NOTE: Undefined behavior if rects do not intersect

  it('should return intersection when 2 rects intersect', () => {
    // Rects touch
    expect(
      intersectionOfRects(
        {origin: {x: 0, y: 0}, size: {width: 1, height: 1}},
        {origin: {x: 1, y: 1}, size: {width: 1, height: 1}},
      ),
    ).toEqual({origin: {x: 1, y: 1}, size: {width: 0, height: 0}});

    // Rects overlap
    expect(
      intersectionOfRects(
        {origin: {x: 0, y: 0}, size: {width: 2, height: 1}},
        {origin: {x: 1, y: -2}, size: {width: 0.5, height: 5}},
      ),
    ).toEqual({origin: {x: 1, y: 0}, size: {width: 0.5, height: 1}});

    // Rects are equal
    expect(
      intersectionOfRects(
        {origin: {x: 1, y: 2}, size: {width: 9.24, height: 4}},
        {origin: {x: 1, y: 2}, size: {width: 9.24, height: 4}},
      ),
    ).toEqual({origin: {x: 1, y: 2}, size: {width: 9.24, height: 4}});
  });
});

describe(rectContainsPoint, () => {
  it("should return true if point is on the rect's edge", () => {
    expect(
      rectContainsPoint(
        {x: 0, y: 0},
        {origin: {x: 0, y: 0}, size: {width: 1, height: 1}},
      ),
    ).toBe(true);
    expect(
      rectContainsPoint(
        {x: 5, y: 0},
        {origin: {x: 0, y: 0}, size: {width: 10, height: 1}},
      ),
    ).toBe(true);
    expect(
      rectContainsPoint(
        {x: 1, y: 1},
        {origin: {x: 0, y: 0}, size: {width: 1, height: 1}},
      ),
    ).toBe(true);
  });

  it('should return true if point is in rect', () => {
    expect(
      rectContainsPoint(
        {x: 5, y: 50},
        {origin: {x: 0, y: 0}, size: {width: 10, height: 100}},
      ),
    ).toBe(true);
  });

  it('should return false if point is not in rect', () => {
    expect(
      rectContainsPoint(
        {x: -1, y: 0},
        {origin: {x: 0, y: 0}, size: {width: 1, height: 1}},
      ),
    ).toBe(false);
  });
});

describe(unionOfRects, () => {
  it('should return zero rect if no rects are provided', () => {
    expect(unionOfRects()).toEqual({
      origin: {x: 0, y: 0},
      size: {width: 0, height: 0},
    });
  });

  it('should return rect if 1 rect is provided', () => {
    expect(
      unionOfRects({origin: {x: 1, y: 2}, size: {width: 3, height: 4}}),
    ).toEqual({origin: {x: 1, y: 2}, size: {width: 3, height: 4}});
  });

  it('should return union of rects if more than one rect is provided', () => {
    expect(
      unionOfRects(
        {origin: {x: 1, y: 2}, size: {width: 3, height: 4}},
        {origin: {x: 100, y: 200}, size: {width: 3, height: 4}},
        {origin: {x: -10, y: -20}, size: {width: 50, height: 60}},
      ),
    ).toEqual({origin: {x: -10, y: -20}, size: {width: 113, height: 224}});
  });
});
