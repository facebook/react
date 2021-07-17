/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// This file uses workerize to load ./babelParse.worker as a webworker
// and instanciates it, exposing flow typed functions that can be used
// on other files.

import {parse} from '@babel/parser';
import WorkerizedBabelParser from './babelParser.worker';

const workerizedBabelParser = Worker && WorkerizedBabelParser();

export const workerizedParse = async (
  input: string,
  options?: {
    plugins: string[],
  },
) => {
  // Checks if worker is not available runs regular babel parse
  if (workerizedBabelParser) {
    const workerParse: typeof parse = WorkerizedBabelParser().workerizedParse;
    return workerParse(input, options);
  }
  return parse(input, options);
};
