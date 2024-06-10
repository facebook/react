/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  clampState,
  moveStateToRange,
  areScrollStatesEqual,
  translateState,
  zoomState,
} from '../scrollState';

describe('clampState', () => {
  it('should passthrough offset if state fits within container', () => {
    expect(
      clampState({
        state: {offset: 0, length: 50},
        minContentLength: 0,
        maxContentLength: 100,
        containerLength: 50,
      }).offset,
    ).toBeCloseTo(0, 10);
    expect(
      clampState({
        state: {offset: -20, length: 100},
        minContentLength: 0,
        maxContentLength: 100,
        containerLength: 50,
      }).offset,
    ).toBeCloseTo(-20, 10);
  });

  it('should clamp offset if offset causes content to go out of container', () => {
    expect(
      clampState({
        state: {offset: -1, length: 50},
        minContentLength: 0,
        maxContentLength: 100,
        containerLength: 50,
      }).offset,
    ).toBeCloseTo(0, 10);
    expect(
      clampState({
        state: {offset: 1, length: 50},
        minContentLength: 0,
        maxContentLength: 100,
        containerLength: 50,
      }).offset,
    ).toBeCloseTo(0, 10);

    expect(
      clampState({
        state: {offset: -51, length: 100},
        minContentLength: 0,
        maxContentLength: 100,
        containerLength: 50,
      }).offset,
    ).toBeCloseTo(-50, 10);
    expect(
      clampState({
        state: {offset: 1, length: 100},
        minContentLength: 0,
        maxContentLength: 100,
        containerLength: 50,
      }).offset,
    ).toBeCloseTo(0, 10);
  });

  it('should passthrough length if container fits in content', () => {
    expect(
      clampState({
        state: {offset: 0, length: 70},
        minContentLength: 0,
        maxContentLength: 100,
        containerLength: 50,
      }).length,
    ).toBeCloseTo(70, 10);
    expect(
      clampState({
        state: {offset: 0, length: 50},
        minContentLength: 0,
        maxContentLength: 100,
        containerLength: 50,
      }).length,
    ).toBeCloseTo(50, 10);
    expect(
      clampState({
        state: {offset: 0, length: 100},
        minContentLength: 0,
        maxContentLength: 100,
        containerLength: 50,
      }).length,
    ).toBeCloseTo(100, 10);
  });

  it('should clamp length to minimum of max(minContentLength, containerLength)', () => {
    expect(
      clampState({
        state: {offset: -20, length: 0},
        minContentLength: 20,
        maxContentLength: 100,
        containerLength: 50,
      }).length,
    ).toBeCloseTo(50, 10);
    expect(
      clampState({
        state: {offset: -20, length: 0},
        minContentLength: 50,
        maxContentLength: 100,
        containerLength: 20,
      }).length,
    ).toBeCloseTo(50, 10);
  });

  it('should clamp length to maximum of max(containerLength, maxContentLength)', () => {
    expect(
      clampState({
        state: {offset: -20, length: 100},
        minContentLength: 0,
        maxContentLength: 40,
        containerLength: 50,
      }).length,
    ).toBeCloseTo(50, 10);
    expect(
      clampState({
        state: {offset: -20, length: 100},
        minContentLength: 0,
        maxContentLength: 50,
        containerLength: 40,
      }).length,
    ).toBeCloseTo(50, 10);
  });
});

describe('translateState', () => {
  it('should translate state by delta and leave length unchanged', () => {
    expect(
      translateState({
        state: {offset: 0, length: 100},
        delta: -3.14,
        containerLength: 50,
      }),
    ).toEqual({offset: -3.14, length: 100});
  });

  it('should clamp resulting offset', () => {
    expect(
      translateState({
        state: {offset: 0, length: 50},
        delta: -3.14,
        containerLength: 50,
      }).offset,
    ).toBeCloseTo(0, 10);
    expect(
      translateState({
        state: {offset: 0, length: 53},
        delta: -100,
        containerLength: 50,
      }).offset,
    ).toBeCloseTo(-3, 10);
  });
});

describe('zoomState', () => {
  it('should scale width by multiplier', () => {
    expect(
      zoomState({
        state: {offset: 0, length: 100},
        multiplier: 1.5,
        fixedPoint: 0,

        minContentLength: 0,
        maxContentLength: 1000,
        containerLength: 50,
      }),
    ).toEqual({offset: 0, length: 150});
  });

  it('should clamp zoomed state', () => {
    const zoomedState = zoomState({
      state: {offset: -20, length: 100},
      multiplier: 0.1,
      fixedPoint: 5,

      minContentLength: 50,
      maxContentLength: 100,
      containerLength: 50,
    });
    expect(zoomedState.offset).toBeCloseTo(0, 10);
    expect(zoomedState.length).toBeCloseTo(50, 10);
  });

  it('should maintain containerStart<->fixedPoint distance', () => {
    const offset = -20;
    const fixedPointFromContainer = 10;

    const zoomedState = zoomState({
      state: {offset, length: 100},
      multiplier: 2,
      fixedPoint: fixedPointFromContainer - offset,

      minContentLength: 0,
      maxContentLength: 1000,
      containerLength: 50,
    });

    expect(zoomedState).toMatchInlineSnapshot(`
      {
        "length": 200,
        "offset": -50,
      }
    `);
  });
});

describe('moveStateToRange', () => {
  it('should set [rangeStart, rangeEnd] = container', () => {
    const movedState = moveStateToRange({
      state: {offset: -20, length: 100},
      rangeStart: 50,
      rangeEnd: 100,
      contentLength: 400,

      minContentLength: 10,
      maxContentLength: 1000,
      containerLength: 50,
    });

    expect(movedState).toMatchInlineSnapshot(`
      {
        "length": 400,
        "offset": -50,
      }
    `);
  });
});

describe('areScrollStatesEqual', () => {
  it('should return true if equal', () => {
    expect(
      areScrollStatesEqual({offset: 0, length: 0}, {offset: 0, length: 0}),
    ).toBe(true);
    expect(
      areScrollStatesEqual({offset: -1, length: 1}, {offset: -1, length: 1}),
    ).toBe(true);
  });

  it('should return false if not equal', () => {
    expect(
      areScrollStatesEqual({offset: 0, length: 0}, {offset: -1, length: 0}),
    ).toBe(false);
    expect(
      areScrollStatesEqual({offset: -1, length: 1}, {offset: -1, length: 0}),
    ).toBe(false);
  });
});
