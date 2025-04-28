/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Finds the indices of numbers in the input array that do not
// belong to a Longest Increasing Subsequence (LIS).
//
// In case of multiple LIS's of the same maximum length, this algorithm
// prefers elements that appear later in the input array. For example,
// for input [1,3,2,4,0] that has two competing LIS's it will prefer
// 1,2,4 instead of 1,3,4.
//
// Time complexity:
// Best case: O(N) - all numbers are increasing or decreasing.
// Worst case: O(N log N) - all numbers are random.
//
// Example:
// findIndicesOfNumbersNotInLIS([4, 1, 8, 2, 3, 5, 7])
// returns [2 (index of 8), 0 (index of 4)]
// Note: indices of non-lis numbers will be returned in reverse order
// because we traverse the original array backwards to recover it.
export default function findIndicesOfNumbersNotInLIS(
  numbers: Array<number>,
): Array<number> {
  if (numbers.length === 0) {
    return [];
  }

  const tails = [numbers[0]];
  const lengths = [1];

  for (let i = 1; i < numbers.length; i++) {
    const num = numbers[i];
    if (num >= tails[tails.length - 1]) {
      // Extend the current increasing subsequence and
      // optimize for all numbers increasing.
      tails.push(num);
      lengths.push(tails.length);
    } else if (num <= tails[0]) {
      // Start a new increasing subsequence and
      // optimize for all numbers decreasing.
      tails[0] = num;
      lengths.push(1);
    } else {
      // Extend a previous but not the longest subsequence (yet).
      // Uses binary search to find the right position to extend.
      // We already checked low and high bounds above, so we can
      // reduce them.
      let low = 1;
      let high = tails.length - 1;

      while (low < high) {
        // Unsigned right shift by 1 to divide by 2 and floor the result.
        const mid = (low + high) >>> 1;
        if (tails[mid] < num) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
      tails[low] = num;
      lengths.push(low + 1);
    }
  }

  let currLen = tails.length; // This is the max LIS length we found
  const nonLISPositions: Array<number> = [];
  for (let i = numbers.length - 1; i >= 0; i--) {
    if (lengths[i] === currLen && currLen > 0) {
      currLen--;
    } else {
      nonLISPositions.push(i);
    }
  }

  return nonLISPositions;
}
