/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactModelRoot} from 'react-flight/src/ReactFlightClient';

import {
  createResponse,
  getModelRoot,
  reportGlobalError,
  processStringChunk,
  processBinaryChunk,
  complete,
} from 'react-flight/inline.dom';

function startReadingFromStream(response, stream: ReadableStream): void {
  let reader = stream.getReader();
  function progress({done, value}) {
    if (done) {
      complete(response);
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

function readFromReadableStream<T>(stream: ReadableStream): ReactModelRoot<T> {
  let response = createResponse(stream);
  startReadingFromStream(response, stream);
  return getModelRoot(response);
}

function readFromFetch<T>(
  promiseForResponse: Promise<Response>,
): ReactModelRoot<T> {
  let response = createResponse(promiseForResponse);
  promiseForResponse.then(
    function(r) {
      startReadingFromStream(response, (r.body: any));
    },
    function(e) {
      reportGlobalError(response, e);
    },
  );
  return getModelRoot(response);
}

function readFromXHR<T>(request: XMLHttpRequest): ReactModelRoot<T> {
  let response = createResponse(request);
  let processedLength = 0;
  function progress(e: ProgressEvent): void {
    let chunk = request.responseText;
    processStringChunk(response, chunk, processedLength);
    processedLength = chunk.length;
  }
  function load(e: ProgressEvent): void {
    progress(e);
    complete(response);
  }
  function error(e: ProgressEvent): void {
    reportGlobalError(response, new TypeError('Network error'));
  }
  request.addEventListener('progress', progress);
  request.addEventListener('load', load);
  request.addEventListener('error', error);
  request.addEventListener('abort', error);
  request.addEventListener('timeout', error);
  return getModelRoot(response);
}

export default {
  readFromXHR,
  readFromFetch,
  readFromReadableStream,
};
