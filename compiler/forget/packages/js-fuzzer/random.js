// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Random helpers.
 */

'use strict';

const assert = require('assert');

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choose(probability) {
  return Math.random() < probability;
}

function random() {
  return Math.random();
}

function uniform(min, max) {
  return Math.random() * (max - min) + min;
}

function sample(iterable, count) {
  const result = new Array(count);
  let index = 0;

  for (const item of iterable) {
    if (index < count) {
      result[index] = item;
    } else {
      const randIndex = randInt(0, index);
      if (randIndex < count) {
        result[randIndex] = item;
      }
    }

    index++;
  }

  if (index < count) {
    // Not enough items.
    result.length = index;
  }

  return result;
}

function swap(array, p1, p2) {
  [array[p1], array[p2]] = [array[p2], array[p1]];
}

/**
 * Returns "count" elements, randomly selected from "highProbArray" and
 * "lowProbArray". Elements from highProbArray have a "factor" times
 * higher chance to be chosen. As a side effect, this swaps the chosen
 * elements to the end of the respective input arrays. The complexity is
 * O(count).
 */
function twoBucketSample(lowProbArray, highProbArray, factor, count) {
  // Track number of available elements for choosing.
  let low = lowProbArray.length;
  let high = highProbArray.length;
  assert(low + high >= count);
  const result = [];
  for (let i = 0; i < count; i++) {
    // Map a random number to the summarized indices of both arrays. Give
    // highProbArray elements a "factor" times higher probability.
    const p = random();
    const index = Math.floor(p * (high * factor + low));
    if (index < low) {
      // If the index is in the low part, draw the element and discard it.
      result.push(lowProbArray[index]);
      swap(lowProbArray, index, --low);
    } else {
      // Same as above but for a highProbArray element. The index is first
      // mapped back to the array's range.
      const highIndex = Math.floor((index - low) / factor);
      result.push(highProbArray[highIndex]);
      swap(highProbArray, highIndex, --high);
    }
  }
  return result;
}

function single(array) {
  return array[randInt(0, array.length - 1)];
}

function shuffle(array) {
  for (let i = 0; i < array.length - 1; i++) {
    const j = randInt(i, array.length - 1);
    swap(array, i, j);
  }

  return array;
}

module.exports = {
  choose: choose,
  randInt: randInt,
  random: random,
  sample: sample,
  shuffle: shuffle,
  single: single,
  twoBucketSample: twoBucketSample,
  uniform: uniform,
}
