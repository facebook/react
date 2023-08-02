/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'shared/ReactTypes.js';

import {
  createFromFetch as createFromFetchImpl,
  createFromReadableStream as createFromReadableStreamImpl,
  createServerReference,
  encodeReply,
} from 'react-server-dom/src/ReactFlightDOMClientWebStreams';

type CallServerCallback = <A, T>(string, args: A) => Promise<T>;

export type Options = {
  moduleBaseURL?: string,
  callServer?: CallServerCallback,
};

function createFromReadableStream<T>(
  stream: ReadableStream,
  options?: Options,
): Thenable<T> {
  const moduleBaseURL =
    options && options.moduleBaseURL ? options.moduleBaseURL : '';
  const callServer =
    options && options.callServer ? options.callServer : undefined;
  return createFromReadableStreamImpl(stream, moduleBaseURL, callServer);
}

function createFromFetch<T>(
  promiseForResponse: Promise<Response>,
  options?: Options,
): Thenable<T> {
  const moduleBaseURL =
    options && options.moduleBaseURL ? options.moduleBaseURL : '';
  const callServer =
    options && options.callServer ? options.callServer : undefined;
  return createFromFetchImpl(promiseForResponse, moduleBaseURL, callServer);
}

export {
  createFromFetch,
  createFromReadableStream,
  encodeReply,
  createServerReference,
};
