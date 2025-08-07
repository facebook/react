/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'shared/ReactTypes.js';

import type {
  Response as FlightResponse,
  FindSourceMapURLCallback,
  DebugChannelCallback,
} from 'react-client/src/ReactFlightClient';

import type {ReactServerValue} from 'react-client/src/ReactFlightReplyClient';

import {
  createResponse,
  createStreamState,
  getRoot,
  reportGlobalError,
  processBinaryChunk,
  processStringChunk,
  close,
  injectIntoDevTools,
} from 'react-client/src/ReactFlightClient';

import {processReply} from 'react-client/src/ReactFlightReplyClient';

export {
  createServerReference,
  registerServerReference,
} from 'react-client/src/ReactFlightReplyClient';

import type {TemporaryReferenceSet} from 'react-client/src/ReactFlightTemporaryReferences';

export {createTemporaryReferenceSet} from 'react-client/src/ReactFlightTemporaryReferences';

export type {TemporaryReferenceSet};

type CallServerCallback = <A, T>(string, args: A) => Promise<T>;

export type Options = {
  moduleBaseURL?: string,
  callServer?: CallServerCallback,
  debugChannel?: {writable?: WritableStream, readable?: ReadableStream, ...},
  temporaryReferences?: TemporaryReferenceSet,
  findSourceMapURL?: FindSourceMapURLCallback,
  replayConsoleLogs?: boolean,
  environmentName?: string,
};

function createDebugCallbackFromWritableStream(
  debugWritable: WritableStream,
): DebugChannelCallback {
  const textEncoder = new TextEncoder();
  const writer = debugWritable.getWriter();
  return message => {
    if (message === '') {
      writer.close();
    } else {
      // Note: It's important that this function doesn't close over the Response object or it can't be GC:ed.
      // Therefore, we can't report errors from this write back to the Response object.
      if (__DEV__) {
        writer.write(textEncoder.encode(message + '\n')).catch(console.error);
      }
    }
  };
}

function createResponseFromOptions(options: void | Options) {
  return createResponse(
    options && options.moduleBaseURL ? options.moduleBaseURL : '',
    null,
    null,
    options && options.callServer ? options.callServer : undefined,
    undefined, // encodeFormAction
    undefined, // nonce
    options && options.temporaryReferences
      ? options.temporaryReferences
      : undefined,
    __DEV__ && options && options.findSourceMapURL
      ? options.findSourceMapURL
      : undefined,
    __DEV__ ? (options ? options.replayConsoleLogs !== false : true) : false, // defaults to true
    __DEV__ && options && options.environmentName
      ? options.environmentName
      : undefined,
    __DEV__ &&
      options &&
      options.debugChannel !== undefined &&
      options.debugChannel.writable !== undefined
      ? createDebugCallbackFromWritableStream(options.debugChannel.writable)
      : undefined,
  );
}

function startReadingFromUniversalStream(
  response: FlightResponse,
  stream: ReadableStream,
): void {
  // This is the same as startReadingFromStream except this allows WebSocketStreams which
  // return ArrayBuffer and string chunks instead of Uint8Array chunks. We could potentially
  // always allow streams with variable chunk types.
  const streamState = createStreamState();
  const reader = stream.getReader();
  function progress({
    done,
    value,
  }: {
    done: boolean,
    value: any,
    ...
  }): void | Promise<void> {
    if (done) {
      close(response);
      return;
    }
    if (value instanceof ArrayBuffer) {
      // WebSockets can produce ArrayBuffer values in ReadableStreams.
      processBinaryChunk(response, streamState, new Uint8Array(value));
    } else if (typeof value === 'string') {
      // WebSockets can produce string values in ReadableStreams.
      processStringChunk(response, streamState, value);
    } else {
      processBinaryChunk(response, streamState, value);
    }
    return reader.read().then(progress).catch(error);
  }
  function error(e: any) {
    reportGlobalError(response, e);
  }
  reader.read().then(progress).catch(error);
}

function startReadingFromStream(
  response: FlightResponse,
  stream: ReadableStream,
  isSecondaryStream: boolean,
): void {
  const streamState = createStreamState();
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
      // If we're the secondary stream, then we don't close the response until the debug channel closes.
      if (!isSecondaryStream) {
        close(response);
      }
      return;
    }
    const buffer: Uint8Array = (value: any);
    processBinaryChunk(response, streamState, buffer);
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
  if (
    __DEV__ &&
    options &&
    options.debugChannel &&
    options.debugChannel.readable
  ) {
    startReadingFromUniversalStream(response, options.debugChannel.readable);
    startReadingFromStream(response, stream, true);
  } else {
    startReadingFromStream(response, stream, false);
  }
  return getRoot(response);
}

function createFromFetch<T>(
  promiseForResponse: Promise<Response>,
  options?: Options,
): Thenable<T> {
  const response: FlightResponse = createResponseFromOptions(options);
  promiseForResponse.then(
    function (r) {
      if (
        __DEV__ &&
        options &&
        options.debugChannel &&
        options.debugChannel.readable
      ) {
        startReadingFromUniversalStream(
          response,
          options.debugChannel.readable,
        );
        startReadingFromStream(response, (r.body: any), true);
      } else {
        startReadingFromStream(response, (r.body: any), false);
      }
    },
    function (e) {
      reportGlobalError(response, e);
    },
  );
  return getRoot(response);
}

function encodeReply(
  value: ReactServerValue,
  options?: {temporaryReferences?: TemporaryReferenceSet, signal?: AbortSignal},
): Promise<
  string | URLSearchParams | FormData,
> /* We don't use URLSearchParams yet but maybe */ {
  return new Promise((resolve, reject) => {
    const abort = processReply(
      value,
      '',
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

export {createFromFetch, createFromReadableStream, encodeReply};

if (__DEV__) {
  injectIntoDevTools();
}
