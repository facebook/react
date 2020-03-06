/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactModel} from 'react-server/src/ReactFlightServer';
import type {Writable} from 'stream';

import {
  createRequest,
  startWork,
  startFlowing,
} from 'react-server/src/ReactFlightServer';

function createDrainHandler(destination, request) {
  return () => startFlowing(request);
}

function pipeToNodeWritable(model: ReactModel, destination: Writable): void {
  let request = createRequest(model, destination);
  destination.on('drain', createDrainHandler(destination, request));
  startWork(request);
}

export {pipeToNodeWritable};
