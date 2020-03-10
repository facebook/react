/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Response as ResponseBase, JSONValue} from './ReactFlightClient';

import type {StringDecoder} from './ReactFlightClientHostConfig';

import {
  createResponse as createResponseImpl,
  resolveModelChunk,
  resolveErrorChunk,
  parseModelFromJSON,
} from './ReactFlightClient';

import {
  supportsBinaryStreams,
  createStringDecoder,
  readPartialStringChunk,
  readFinalStringChunk,
} from './ReactFlightClientHostConfig';

export type ReactModelRoot<T> = {|
  model: T,
|};

type Response = ResponseBase & {
  fromJSON: (key: string, value: JSONValue) => any,
  stringDecoder: StringDecoder,
};

export function createResponse(): Response {
  let response: Response = (createResponseImpl(): any);
  response.fromJSON = function(key: string, value: JSONValue) {
    return parseModelFromJSON(response, this, key, value);
  };
  if (supportsBinaryStreams) {
    response.stringDecoder = createStringDecoder();
  }
  return response;
}

function processFullRow(response: Response, row: string): void {
  if (row === '') {
    return;
  }
  let tag = row[0];
  switch (tag) {
    case 'J': {
      let colon = row.indexOf(':', 1);
      let id = parseInt(row.substring(1, colon), 16);
      let json = row.substring(colon + 1);
      let model = JSON.parse(json, response.fromJSON);
      resolveModelChunk(response, id, model);
      return;
    }
    case 'E': {
      let colon = row.indexOf(':', 1);
      let id = parseInt(row.substring(1, colon), 16);
      let json = row.substring(colon + 1);
      let errorInfo = JSON.parse(json);
      resolveErrorChunk(response, id, errorInfo.message, errorInfo.stack);
      return;
    }
    default: {
      // Assume this is the root model.
      let model = JSON.parse(row, response.fromJSON);
      resolveModelChunk(response, 0, model);
      return;
    }
  }
}

export function processStringChunk(
  response: Response,
  chunk: string,
  offset: number,
): void {
  let linebreak = chunk.indexOf('\n', offset);
  while (linebreak > -1) {
    let fullrow = response.partialRow + chunk.substring(offset, linebreak);
    processFullRow(response, fullrow);
    response.partialRow = '';
    offset = linebreak + 1;
    linebreak = chunk.indexOf('\n', offset);
  }
  response.partialRow += chunk.substring(offset);
}

export function processBinaryChunk(
  response: Response,
  chunk: Uint8Array,
): void {
  if (!supportsBinaryStreams) {
    throw new Error("This environment don't support binary chunks.");
  }
  let stringDecoder = response.stringDecoder;
  let linebreak = chunk.indexOf(10); // newline
  while (linebreak > -1) {
    let fullrow =
      response.partialRow +
      readFinalStringChunk(stringDecoder, chunk.subarray(0, linebreak));
    processFullRow(response, fullrow);
    response.partialRow = '';
    chunk = chunk.subarray(linebreak + 1);
    linebreak = chunk.indexOf(10); // newline
  }
  response.partialRow += readPartialStringChunk(stringDecoder, chunk);
}

export {reportGlobalError, close, getModelRoot} from './ReactFlightClient';
