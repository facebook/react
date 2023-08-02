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
  createFromReadableStream as createFromReadableStreamImpl,
  createFromFetch as createFromFetchImpl,
  createServerReference,
  encodeReply,
} from 'react-server-dom/src/ReactFlightDOMClientWebStreams';

type CallServerCallback = <A, T>(string, args: A) => Promise<T>;

export type Options = {
  callServer?: CallServerCallback,
};

function createFromFetch<T>(
  promiseForResponse: Promise<Response>,
  options?: Options,
): Thenable<T> {
  const callServer =
    options && options.callServer ? options.callServer : undefined;
  return createFromFetchImpl(promiseForResponse, null, callServer);
}

function createFromReadableStream<T>(
  stream: ReadableStream,
  options?: Options,
): Thenable<T> {
  const callServer =
    options && options.callServer ? options.callServer : undefined;
  return createFromReadableStreamImpl(stream, null, callServer);
}
export {
  createFromFetch,
  createFromReadableStream,
  encodeReply,
  createServerReference,
};
