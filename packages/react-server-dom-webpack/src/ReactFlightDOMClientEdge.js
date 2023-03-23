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

import type {SSRManifest} from './ReactFlightClientWebpackBundlerConfig';

import {
  createResponse,
  getRoot,
  reportGlobalError,
  processBinaryChunk,
  close,
} from 'react-client/src/ReactFlightClientStream';

function noServerCall() {
  throw new Error(
    'Server Functions cannot be called during initial render. ' +
      'This would create a fetch waterfall. Try to use a Server Component ' +
      'to pass data to Client Components instead.',
  );
}

export type Options = {
  moduleMap?: $NonMaybeType<SSRManifest>,
};

function createResponseFromOptions(options: void | Options) {
  return createResponse(
    options && options.moduleMap ? options.moduleMap : null,
    noServerCall,
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

export {createFromFetch, createFromReadableStream};
