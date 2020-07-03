// @flow

import memoize from 'memoize-one';

import type {BatchUID, Milliseconds, ReactProfilerDataV2} from '../types';

// TODO Batch duration probably shouldn't include delayed passive effects?
// It should probably end with the layout effect.

function unmemoizedGetBatchRange(
  batchUID: BatchUID,
  data: ReactProfilerDataV2,
): [Milliseconds, Milliseconds] {
  const {measures} = data;

  let startTime = 0;
  let stopTime = Infinity;

  let i = 0;

  for (i; i < measures.length; i++) {
    const measure = measures[i];
    if (measure.batchUID === batchUID) {
      startTime = measure.timestamp;
      break;
    }
  }

  for (i; i < measures.length; i++) {
    const measure = measures[i];
    stopTime = measure.timestamp;
    if (measure.batchUID !== batchUID) {
      break;
    }
  }

  return [startTime, stopTime];
}

export const getBatchRange = memoize(unmemoizedGetBatchRange);
