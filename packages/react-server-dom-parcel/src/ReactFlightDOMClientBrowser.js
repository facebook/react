/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'shared/ReactTypes.js';
import type {Response as FlightResponse} from 'react-client/src/ReactFlightClient';
import type {ReactServerValue} from 'react-client/src/ReactFlightReplyClient';
import type {ServerReferenceId} from './ReactFlightClientConfigBundlerParcel';

import {
  createResponse,
  getRoot,
  reportGlobalError,
  processBinaryChunk,
  close,
} from 'react-client/src/ReactFlightClient';

import {
  processReply,
  createServerReference as createServerReferenceImpl,
} from 'react-client/src/ReactFlightReplyClient';

type CallServerCallback = <A, T>(id: string, args: A) => Promise<T>;

let callServer: CallServerCallback | null = null;
export function setServerCallback(fn: CallServerCallback) {
  callServer = fn;
}

function callCurrentServerCallback<A, T>(
  id: ServerReferenceId,
  args: A,
): Promise<T> {
  if (!callServer) {
    throw new Error(
      'No server callback has been registered. Call setServerCallback to register one.',
    );
  }
  return callServer(id, args);
}

export function createServerReference<A: Iterable<any>, T>(
  id: ServerReferenceId,
): (...A) => Promise<T> {
  return createServerReferenceImpl(id, callCurrentServerCallback);
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

export function createFromReadableStream<T>(
  stream: ReadableStream,
): Thenable<T> {
  const response: FlightResponse = createResponse(
    null,
    null,
    callCurrentServerCallback,
    undefined, // encodeFormAction
    undefined, // nonce
  );
  startReadingFromStream(response, stream);
  return getRoot(response);
}

export function createFromFetch<T>(
  promiseForResponse: Promise<Response>,
): Thenable<T> {
  const response: FlightResponse = createResponse(
    null,
    null,
    callCurrentServerCallback,
    undefined, // encodeFormAction
    undefined, // nonce
  );
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

export function encodeReply(
  value: ReactServerValue,
): Promise<
  string | URLSearchParams | FormData,
> /* We don't use URLSearchParams yet but maybe */ {
  return new Promise((resolve, reject) => {
    processReply(value, '', resolve, reject);
  });
}
