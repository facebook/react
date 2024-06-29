/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {clamp} from '../clamp';

describe('clamp', () => {
  it('should return min if value < min', () => {
    expect(clamp(0, 1, -1)).toBe(0);
    expect(clamp(0.1, 1.1, 0.05)).toBe(0.1);
  });

  it('should return value if min <= value <= max', () => {
    expect(clamp(0, 1, 0)).toBe(0);
    expect(clamp(0, 1, 0.5)).toBe(0.5);
    expect(clamp(0, 1, 1)).toBe(1);
    expect(clamp(0.1, 1.1, 0.15)).toBe(0.15);
  });

  it('should return max if max < value', () => {
    expect(clamp(0, 1, 2)).toBe(1);
    expect(clamp(0.1, 1.1, 1.15)).toBe(1.1);
  });
});
