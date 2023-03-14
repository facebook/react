/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {CallServerCallback} from './ReactFlightClient';
import type {Response} from './ReactFlightClientHostConfigStream';
import type {SSRManifest} from './ReactFlightClientHostConfig';

import {
  resolveModule,
  resolveModel,
  resolveErrorProd,
  resolveErrorDev,
  createResponse as createResponseBase,
  parseModelString,
  parseModelTuple,
} from './ReactFlightClient';

import {
  readPartialStringChunk,
  readFinalStringChunk,
  supportsBinaryStreams,
  createStringDecoder,
} from './ReactFlightClientHostConfig';

export type {Response};

function processFullRow(response: Response, row: string): void {
  if (row === '') {
    return;
  }
  const colon = row.indexOf(':', 0);
  const id = parseInt(row.substring(0, colon), 16);
  const tag = row[colon + 1];
  // When tags that are not text are added, check them here before
  // parsing the row as text.
  // switch (tag) {
  // }
  switch (tag) {
    case 'I': {
      resolveModule(response, id, row.substring(colon + 2));
      return;
    }
    case 'E': {
      const errorInfo = JSON.parse(row.substring(colon + 2));
      if (__DEV__) {
        resolveErrorDev(
          response,
          id,
          errorInfo.digest,
          errorInfo.message,
          errorInfo.stack,
        );
      } else {
        resolveErrorProd(response, id, errorInfo.digest);
      }
      return;
    }
    default: {
      // We assume anything else is JSON.
      resolveModel(response, id, row.substring(colon + 1));
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
    const fullrow = response._partialRow + chunk.substring(offset, linebreak);
    processFullRow(response, fullrow);
    response._partialRow = '';
    offset = linebreak + 1;
    linebreak = chunk.indexOf('\n', offset);
  }
  response._partialRow += chunk.substring(offset);
}

export function processBinaryChunk(
  response: Response,
  chunk: Uint8Array,
): void {
  if (!supportsBinaryStreams) {
    throw new Error("This environment don't support binary chunks.");
  }
  const stringDecoder = response._stringDecoder;
  let linebreak = chunk.indexOf(10); // newline
  while (linebreak > -1) {
    const fullrow =
      response._partialRow +
      readFinalStringChunk(stringDecoder, chunk.subarray(0, linebreak));
    processFullRow(response, fullrow);
    response._partialRow = '';
    chunk = chunk.subarray(linebreak + 1);
    linebreak = chunk.indexOf(10); // newline
  }
  response._partialRow += readPartialStringChunk(stringDecoder, chunk);
}

function createFromJSONCallback(response: Response) {
  // $FlowFixMe[missing-this-annot]
  return function (key: string, value: JSONValue) {
    if (typeof value === 'string') {
      // We can't use .bind here because we need the "this" value.
      return parseModelString(response, this, key, value);
    }
    if (typeof value === 'object' && value !== null) {
      return parseModelTuple(response, value);
    }
    return value;
  };
}

export function createResponse(
  bundlerConfig: SSRManifest,
  callServer: void | CallServerCallback,
): Response {
  // NOTE: CHECK THE COMPILER OUTPUT EACH TIME YOU CHANGE THIS.
  // It should be inlined to one object literal but minor changes can break it.
  const stringDecoder = supportsBinaryStreams ? createStringDecoder() : null;
  const response: any = createResponseBase(bundlerConfig, callServer);
  response._partialRow = '';
  if (supportsBinaryStreams) {
    response._stringDecoder = stringDecoder;
  }
  // Don't inline this call because it causes closure to outline the call above.
  response._fromJSON = createFromJSONCallback(response);
  return response;
}

export {reportGlobalError, getRoot, close} from './ReactFlightClient';
