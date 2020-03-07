/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactModelRoot} from 'react-client/src/ReactFlightClient';

import {
  createResponse,
  getModelRoot,
  processStringChunk,
  complete,
} from 'react-client/src/ReactFlightClient';

type EncodedData = Array<string>;

function read<T>(data: EncodedData): ReactModelRoot<T> {
  let response = createResponse(data);
  for (let i = 0; i < data.length; i++) {
    processStringChunk(response, data[i], 0);
  }
  complete(response);
  return getModelRoot(response);
}

export {read};
