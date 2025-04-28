/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

let findIndicesOfNumbersNotInLIS;
describe('findIndicesOfNumbersNotInLIS', () => {
  beforeAll(() => {
    findIndicesOfNumbersNotInLIS =
      require('../findIndicesOfNumbersNotInLIS').default;
  });
  it('should return empty array for empty array input', () => {
    const result = findIndicesOfNumbersNotInLIS([]);
    expect(result).toEqual([]);
  });

  it('should return empty array for strictly increasing number input', () => {
    const result = findIndicesOfNumbersNotInLIS([0, 1, 2, 3, 4, 5]);
    expect(result).toEqual([]);
  });

  it('should return indices of all numbers but the last one for strictly decreasing input', () => {
    const result = findIndicesOfNumbersNotInLIS([5, 4, 3, 2, 1, 0]);
    expect(result).toEqual([4, 3, 2, 1, 0]);
  });

  it('should return indices of numbers not in LIS (one item moved)', () => {
    const result = findIndicesOfNumbersNotInLIS([
      0, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    expect(result).toEqual([
      1, // index of 10
    ]);
  });

  it('should return indices of numbers not in LIS (swap case)', () => {
    const result = findIndicesOfNumbersNotInLIS([
      0, 1, 2, 3, 4, 9, 6, 7, 8, 5, 10,
    ]); // 9 and 5 were swapped
    expect(result).toEqual([
      9, // index of 5
      5, // index of 9
    ]);
  });

  it('should prefer a longer subsequence', () => {
    const result = findIndicesOfNumbersNotInLIS([
      10, 11, 12, 13, 14, 0, 1, 2, 3,
    ]); // 10, 11, 12, 13, 14 is a longer subsequence than 0, 1, 2, 3
    expect(result).toEqual([
      8, // index of 3
      7, // index of 2
      6, // index of 1
      5, // index of 0
    ]);
  });

  it('should prefer later values for competing subsequences', () => {
    const result = findIndicesOfNumbersNotInLIS([0, 1, 3, 2, 4]);
    // Will prefer 2 over 3, both form valid max length subsequences
    // 0, 1, 2, 4 and 0, 1, 3, 4 but 2 is later in the array.
    expect(result).toEqual([
      2, // index of 3
    ]);
  });
});
