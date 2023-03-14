/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'shared/ReactTypes.js';

import type {Response as FlightResponse} from 'react-client/src/ReactFlightClientStream';

import type {ReactServerValue} from 'react-client/src/ReactFlightReplyClient';

import {
  createResponse,
  getRoot,
  reportGlobalError,
  processStringChunk,
  processBinaryChunk,
  close,
} from 'react-client/src/ReactFlightClientStream';

import {processReply} from 'react-client/src/ReactFlightReplyClient';

type CallServerCallback = <A, T>(string, args: A) => Promise<T>;

export type Options = {
  callServer?: CallServerCallback,
};

function createResponseFromOptions(options: void | Options) {
  return createResponse(
    null,
    options && options.callServer ? options.callServer : undefined,
  );
}

function startReadingFromStream(
  response: FlightResponse,
  stream: ReadableStream,
): void {
  const reader = stream.getReader();
  function progress({
    done,
    value,
  }: {
    done: boolean,
    value: ?any,
    ...
  }): void | Promise<void> {
    if (done) {
      close(response);
      return;
    }
    const buffer: Uint8Array = (value: any);
    processBinaryChunk(response, buffer);
    return reader.read().then(progress).catch(error);
  }
  function error(e: any) {
    reportGlobalError(response, e);
  }
  reader.read().then(progress).catch(error);
}

function createFromReadableStream<T>(
  stream: ReadableStream,
  options?: Options,
): Thenable<T> {
  const response: FlightResponse = createResponseFromOptions(options);
  startReadingFromStream(response, stream);
  return getRoot(response);
}

function createFromFetch<T>(
  promiseForResponse: Promise<Response>,
  options?: Options,
): Thenable<T> {
  const response: FlightResponse = createResponseFromOptions(options);
  promiseForResponse.then(
    function (r) {
      startReadingFromStream(response, (r.body: any));
    },
    function (e) {
      reportGlobalError(response, e);
    },
  );
  return getRoot(response);
}

function createFromXHR<T>(
  request: XMLHttpRequest,
  options?: Options,
): Thenable<T> {
  const response: FlightResponse = createResponseFromOptions(options);
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
  return getRoot(response);
}

function encodeReply(
  value: ReactServerValue,
): Promise<
  string | URLSearchParams | FormData,
> /* We don't use URLSearchParams yet but maybe */ {
  return new Promise((resolve, reject) => {
    processReply(value, resolve, reject);
  });
}

export {createFromXHR, createFromFetch, createFromReadableStream, encodeReply};
