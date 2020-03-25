/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Response as FlightResponse} from 'react-client/src/ReactFlightClientStream';

import {
  createResponse,
  reportGlobalError,
  processStringChunk,
  processBinaryChunk,
  close,
} from 'react-client/src/ReactFlightClientStream';

function startReadingFromStream<T>(
  response: FlightResponse<T>,
  stream: ReadableStream,
): void {
  let reader = stream.getReader();
  function progress({done, value}) {
    if (done) {
      close(response);
      return;
    }
    let buffer: Uint8Array = (value: any);
    processBinaryChunk(response, buffer);
    return reader.read().then(progress, error);
  }
  function error(e) {
    reportGlobalError(response, e);
  }
  reader.read().then(progress, error);
}

function createFromReadableStream<T>(
  stream: ReadableStream,
): FlightResponse<T> {
  let response: FlightResponse<T> = createResponse();
  startReadingFromStream(response, stream);
  return response;
}

function createFromFetch<T>(
  promiseForResponse: Promise<Response>,
): FlightResponse<T> {
  let response: FlightResponse<T> = createResponse();
  promiseForResponse.then(
    function(r) {
      startReadingFromStream(response, (r.body: any));
    },
    function(e) {
      reportGlobalError(response, e);
    },
  );
  return response;
}

function createFromXHR<T>(request: XMLHttpRequest): FlightResponse<T> {
  let response: FlightResponse<T> = createResponse();
  let processedLength = 0;
  function progress(e: ProgressEvent): void {
    let chunk = request.responseText;
    processStringChunk(response, chunk, processedLength);
    processedLength = chunk.length;
  }
  function load(e: ProgressEvent): void {
    progress(e);
    close(response);
  }
  function error(e: ProgressEvent): void {
    reportGlobalError(response, new TypeError('Network error'));
  }
  request.addEventListener('progress', progress);
  request.addEventListener('load', load);
  request.addEventListener('error', error);
  request.addEventListener('abort', error);
  request.addEventListener('timeout', error);
  return response;
}

export {createFromXHR, createFromFetch, createFromReadableStream};
