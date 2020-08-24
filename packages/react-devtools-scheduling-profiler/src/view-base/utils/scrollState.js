/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {clamp} from './clamp';

/**
 * Single-axis offset and length state.
 *
 * ```
 * contentStart   containerStart  containerEnd   contentEnd
 *     |<----------offset|              |             |
 *     |<-------------------length------------------->|
 * ```
 */
export type ScrollState = $ReadOnly<{|
  offset: number,
  length: number,
|}>;

function clampOffset(state: ScrollState, containerLength: number): ScrollState {
  return {
    offset: clamp(-(state.length - containerLength), 0, state.offset),
    length: state.length,
  };
}

function clampLength(
  state: ScrollState,
  minContentLength: number,
  maxContentLength: number,
): ScrollState {
  return {
    offset: state.offset,
    length: clamp(minContentLength, maxContentLength, state.length),
  };
}

export function clampState({
  state,
  minContentLength,
  maxContentLength,
  containerLength,
}: {
  state: ScrollState,
  minContentLength: number,
  maxContentLength: number,
  containerLength: number,
}): ScrollState {
  return clampOffset(
    clampLength(state, minContentLength, maxContentLength),
    containerLength,
  );
}

export function translateState({
  state,
  delta,
  containerLength,
}: {
  state: ScrollState,
  delta: number,
  containerLength: number,
}): ScrollState {
  return clampOffset(
    {
      offset: state.offset + delta,
      length: state.length,
    },
    containerLength,
  );
}

/**
 * Returns a new `state` zoomed by `multiplier`.
 *
 * The resulting state's `length` is clamped to `minContentLength` and
 * `maxContentLength`, and its offset is clamped to ensure content remains in
 * `containerLength`.
 *
 * The provided fixed point will also remain stationary relative to
 * `containerStart`.
 *
 * ```
 * contentStart   containerStart                fixedPoint containerEnd
 *     |<---------offset-|                          x           |
 *     |-fixedPoint-------------------------------->x           |
 *                       |-fixedPointFromContainer->x           |
 *                       |<----------containerLength----------->|
 * ```
 */
export function zoomState({
  state,
  multiplier,
  fixedPoint,

  minContentLength,
  maxContentLength,
  containerLength,
}: {
  state: ScrollState,
  multiplier: number,
  fixedPoint: number,

  minContentLength: number,
  maxContentLength: number,
  containerLength: number,
}): ScrollState {
  // Length and offset must be computed separately, so that if the length is
  // clamped the offset will still be correct (unless it gets clamped too).

  const zoomedState = clampLength(
    {
      offset: state.offset,
      length: state.length * multiplier,
    },
    minContentLength,
    maxContentLength,
  );

  // Adjust offset so that distance between containerStart<->fixedPoint is fixed
  const fixedPointFromContainer = fixedPoint + state.offset;
  const scaledFixedPoint = fixedPoint * (zoomedState.length / state.length);
  const offsetAdjustedState = clampOffset(
    {
      offset: fixedPointFromContainer - scaledFixedPoint,
      length: zoomedState.length,
    },
    containerLength,
  );

  return offsetAdjustedState;
}

export function moveStateToRange({
  state,
  rangeStart,
  rangeEnd,
  contentLength,

  minContentLength,
  maxContentLength,
  containerLength,
}: {
  state: ScrollState,
  rangeStart: number,
  rangeEnd: number,
  contentLength: number,

  minContentLength: number,
  maxContentLength: number,
  containerLength: number,
}): ScrollState {
  // Length and offset must be computed separately, so that if the length is
  // clamped the offset will still be correct (unless it gets clamped too).

  const lengthClampedState = clampLength(
    {
      offset: state.offset,
      length: contentLength * (containerLength / (rangeEnd - rangeStart)),
    },
    minContentLength,
    maxContentLength,
  );

  const offsetAdjustedState = clampOffset(
    {
      offset: -rangeStart * (lengthClampedState.length / contentLength),
      length: lengthClampedState.length,
    },
    containerLength,
  );

  return offsetAdjustedState;
}

export function scrollStatesAreEqual(
  state1: ScrollState,
  state2: ScrollState,
): boolean {
  return state1.offset === state2.offset && state1.length === state2.length;
}
