/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Response as FlightResponse} from 'react-client/src/ReactFlightClientStream';

import type {BundlerConfig} from './ReactFlightClientWebpackBundlerConfig';

import {
  createResponse,
  reportGlobalError,
  processStringChunk,
  processBinaryChunk,
  close,
} from 'react-client/src/ReactFlightClientStream';

export type Options = {
  moduleMap?: BundlerConfig,
};

function startReadingFromStream(
  response: FlightResponse,
  stream: ReadableStream,
): void {
  const reader = stream.getReader();
  function progress({done, value}) {
    if (done) {
      close(response);
      return;
    }
    const buffer: Uint8Array = (value: any);
    processBinaryChunk(response, buffer);
    return reader.read().then(progress, error);
  }
  function error(e) {
    reportGlobalError(response, e);
  }
  reader.read().then(progress, error);
}

function createFromReadableStream(
  stream: ReadableStream,
  options?: Options,
): FlightResponse {
  const response: FlightResponse = createResponse(
    options && options.moduleMap ? options.moduleMap : null,
  );
  startReadingFromStream(response, stream);
  return response;
}

function createFromFetch(
  promiseForResponse: Promise<Response>,
  options?: Options,
): FlightResponse {
  const response: FlightResponse = createResponse(
    options && options.moduleMap ? options.moduleMap : null,
  );
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

function createFromXHR(
  request: XMLHttpRequest,
  options?: Options,
): FlightResponse {
  const response: FlightResponse = createResponse(
    options && options.moduleMap ? options.moduleMap : null,
  );
  let processedLength = 0;
  function progress(e: ProgressEvent): void {
    const chunk = request.responseText;
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
