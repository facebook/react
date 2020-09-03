/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Rect} from '../../view-base';

export function positioningScaleFactor(
  intrinsicWidth: number,
  frame: Rect,
): number {
  return frame.size.width / intrinsicWidth;
}

export function timestampToPosition(
  timestamp: number,
  scaleFactor: number,
  frame: Rect,
): number {
  return frame.origin.x + timestamp * scaleFactor;
}

export function positionToTimestamp(
  position: number,
  scaleFactor: number,
  frame: Rect,
): number {
  return (position - frame.origin.x) / scaleFactor;
}

export function durationToWidth(duration: number, scaleFactor: number): number {
  return duration * scaleFactor;
}

export function widthToDuration(width: number, scaleFactor: number): number {
  return width / scaleFactor;
}
