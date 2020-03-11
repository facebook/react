/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Response, JSONValue} from 'react-client/src/ReactFlightClient';

import {
  createResponse,
  getModelRoot,
  parseModelFromJSON,
  resolveModelChunk,
  resolveErrorChunk,
  close,
} from 'react-client/src/ReactFlightClient';

function parseModel(response, targetObj, key, value) {
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        (value: any)[i] = parseModel(response, value, '' + i, value[i]);
      }
    } else {
      for (let innerKey in value) {
        (value: any)[innerKey] = parseModel(
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

export {createResponse, getModelRoot, close};

export function resolveModel(response: Response, id: number, json: JSONValue) {
  resolveModelChunk(response, id, parseModel(response, {}, '', json));
}

export function resolveError(
  response: Response,
  id: number,
  message: string,
  stack: string,
) {
  resolveErrorChunk(response, id, message, stack);
}
