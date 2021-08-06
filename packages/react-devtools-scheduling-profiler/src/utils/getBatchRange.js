/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import memoize from 'memoize-one';

import type {BatchUID, Milliseconds, ReactProfilerData} from '../types';

function unmemoizedGetBatchRange(
  batchUID: BatchUID,
  data: ReactProfilerData,
  minStartTime?: ?number,
): [Milliseconds, Milliseconds] {
  const {measures} = data;

  let startTime = 0;
  let stopTime = Infinity;

  let i = 0;

  // Find the first measure in the current batch.
  for (i; i < measures.length; i++) {
    const measure = measures[i];
    if (measure.batchUID === batchUID) {
      if (minStartTime == null || measure.timestamp >= minStartTime) {
        startTime = measure.timestamp;
        break;
      }
    }
  }

  // Find the last measure in the current batch.
  for (i; i < measures.length; i++) {
    const measure = measures[i];
    if (measure.batchUID === batchUID) {
      stopTime = measure.timestamp;
    } else {
      break;
    }
  }

  return [startTime, stopTime];
}

export const getBatchRange = memoize(unmemoizedGetBatchRange);
