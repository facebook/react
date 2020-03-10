/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactModelRoot} from 'react-client/src/ReactFlightClient';

import type {Chunk} from './ReactFlightDOMRelayClientHostConfig';

import {
  createResponse,
  getModelRoot,
  parseModelFromJSON,
  resolveModelChunk,
  resolveErrorChunk,
  close,
} from 'react-client/src/ReactFlightClient';

type EncodedData = Array<Chunk>;

function parseModel(response, targetObj, key, value) {
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        value[i] = parseModel(response, value, '' + i, value[i]);
      }
    } else {
      for (let innerKey in value) {
        value[innerKey] = parseModel(
          response,
          value,
          innerKey,
          value[innerKey],
        );
      }
    }
  }
  return parseModelFromJSON(response, targetObj, key, value);
}

function read<T>(data: EncodedData): ReactModelRoot<T> {
  let response = createResponse();
  for (let i = 0; i < data.length; i++) {
    let chunk = data[i];
    if (chunk.type === 'json') {
      resolveModelChunk(
        response,
        chunk.id,
        parseModel(response, {}, '', chunk.json),
      );
    } else {
      resolveErrorChunk(
        response,
        chunk.id,
        chunk.json.message,
        chunk.json.stack,
      );
    }
  }
  close(response);
  return getModelRoot(response);
}

export {read};
