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
import type {ServerReferenceId} from '../client/ReactFlightClientConfigBundlerParcel';

import {
  createResponse,
  getRoot,
  reportGlobalError,
  processBinaryChunk,
  close,
  injectIntoDevTools,
} from 'react-client/src/ReactFlightClient';

import {
  processReply,
  createServerReference as createServerReferenceImpl,
} from 'react-client/src/ReactFlightReplyClient';

export {registerServerReference} from 'react-client/src/ReactFlightReplyClient';

import type {TemporaryReferenceSet} from 'react-client/src/ReactFlightTemporaryReferences';

export {createTemporaryReferenceSet} from 'react-client/src/ReactFlightTemporaryReferences';
export type {TemporaryReferenceSet};

function findSourceMapURL(filename: string, environmentName: string) {
  const devServer = parcelRequire.meta.devServer;
  if (devServer != null) {
    const qs = new URLSearchParams();
    qs.set('filename', filename);
    qs.set('env', environmentName);
    return devServer + '/__parcel_source_map?' + qs.toString();
  }
  return null;
}

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
  id: string,
  exportName: string,
): (...A) => Promise<T> {
  return createServerReferenceImpl(
    id + '#' + exportName,
    callCurrentServerCallback,
    undefined,
    findSourceMapURL,
    exportName,
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

export type Options = {
  temporaryReferences?: TemporaryReferenceSet,
  replayConsoleLogs?: boolean,
  environmentName?: string,
};

export function createFromReadableStream<T>(
  stream: ReadableStream,
  options?: Options,
): Thenable<T> {
  const response: FlightResponse = createResponse(
    null, // bundlerConfig
    null, // serverReferenceConfig
    null, // moduleLoading
    callCurrentServerCallback,
    undefined, // encodeFormAction
    undefined, // nonce
    options && options.temporaryReferences
      ? options.temporaryReferences
      : undefined,
    __DEV__ ? findSourceMapURL : undefined,
    __DEV__ ? (options ? options.replayConsoleLogs !== false : true) : false, // defaults to true
    __DEV__ && options && options.environmentName
      ? options.environmentName
      : undefined,
  );
  startReadingFromStream(response, stream);
  return getRoot(response);
}

export function createFromFetch<T>(
  promiseForResponse: Promise<Response>,
  options?: Options,
): Thenable<T> {
  const response: FlightResponse = createResponse(
    null, // bundlerConfig
    null, // serverReferenceConfig
    null, // moduleLoading
    callCurrentServerCallback,
    undefined, // encodeFormAction
    undefined, // nonce
    options && options.temporaryReferences
      ? options.temporaryReferences
      : undefined,
    __DEV__ ? findSourceMapURL : undefined,
    __DEV__ ? (options ? options.replayConsoleLogs !== false : true) : false, // defaults to true
    __DEV__ && options && options.environmentName
      ? options.environmentName
      : undefined,
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
  options?: {temporaryReferences?: TemporaryReferenceSet, signal?: AbortSignal},
): Promise<
  string | URLSearchParams | FormData,
> /* We don't use URLSearchParams yet but maybe */ {
  return new Promise((resolve, reject) => {
    const abort = processReply(
      value,
      '', // formFieldPrefix
      options && options.temporaryReferences
        ? options.temporaryReferences
        : undefined,
      resolve,
      reject,
    );
    if (options && options.signal) {
      const signal = options.signal;
      if (signal.aborted) {
        abort((signal: any).reason);
      } else {
        const listener = () => {
          abort((signal: any).reason);
          signal.removeEventListener('abort', listener);
        };
        signal.addEventListener('abort', listener);
      }
    }
  });
}

if (__DEV__) {
  injectIntoDevTools();
}
