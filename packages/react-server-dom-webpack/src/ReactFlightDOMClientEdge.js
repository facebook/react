/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'shared/ReactTypes.js';

import type {SSRManifest} from './ReactFlightClientBundlerConfig';

import {
  createFromReadableStream as createFromReadableStreamImpl,
  createFromFetch as createFromFetchImpl,
  createServerReference as createServerReferenceImpl,
} from 'react-server-dom/src/ReactFlightDOMClientWebStreams';

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

function createFromFetch<T>(
  promiseForResponse: Promise<Response>,
  options?: Options,
): Thenable<T> {
  const moduleMap = options && options.moduleMap ? options.moduleMap : null;
  return createFromFetchImpl(promiseForResponse, moduleMap, noServerCall);
}

function createFromReadableStream<T>(
  stream: ReadableStream,
  options?: Options,
): Thenable<T> {
  const moduleMap = options && options.moduleMap ? options.moduleMap : null;
  return createFromReadableStreamImpl(stream, moduleMap, noServerCall);
}

function createServerReference<A: Iterable<any>, T>(
  id: any,
  callServer: any,
): (...A) => Promise<T> {
  return createServerReferenceImpl(id, noServerCall);
}

export {createFromFetch, createFromReadableStream, createServerReference};
