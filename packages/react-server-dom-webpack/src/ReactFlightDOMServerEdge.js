/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactClientValue} from 'react-server/src/ReactFlightServer';
import type {ServerContextJSONValue, Thenable} from 'shared/ReactTypes';
import type {ClientManifest} from './ReactFlightServerWebpackBundlerConfig';
import type {ServerManifest} from 'react-client/src/ReactFlightClientHostConfig';

import {
  createRequest,
  startWork,
  startFlowing,
  abort,
} from 'react-server/src/ReactFlightServer';

import {
  createResponse,
  close,
  resolveField,
  resolveFile,
  getRoot,
} from 'react-server/src/ReactFlightReplyServer';

type Options = {
  identifierPrefix?: string,
  signal?: AbortSignal,
  context?: Array<[string, ServerContextJSONValue]>,
  onError?: (error: mixed) => void,
};

function renderToReadableStream(
  model: ReactClientValue,
  webpackMap: ClientManifest,
  options?: Options,
): ReadableStream {
  const request = createRequest(
    model,
    webpackMap,
    options ? options.onError : undefined,
    options ? options.context : undefined,
    options ? options.identifierPrefix : undefined,
  );
  if (options && options.signal) {
    const signal = options.signal;
    if (signal.aborted) {
      abort(request, (signal: any).reason);
    } else {
      const listener = () => {
        abort(request, (signal: any).reason);
        signal.removeEventListener('abort', listener);
      };
      signal.addEventListener('abort', listener);
    }
  }
  const stream = new ReadableStream(
    {
      type: 'bytes',
      start: (controller): ?Promise<void> => {
        startWork(request);
      },
      pull: (controller): ?Promise<void> => {
        startFlowing(request, controller);
      },
      cancel: (reason): ?Promise<void> => {},
    },
    // $FlowFixMe[prop-missing] size() methods are not allowed on byte streams.
    {highWaterMark: 0},
  );
  return stream;
}

function decodeReply<T>(
  body: string | FormData,
  webpackMap: ServerManifest,
): Thenable<T> {
  const response = createResponse(webpackMap);
  if (typeof body === 'string') {
    resolveField(response, 0, body);
  } else {
    // $FlowFixMe[prop-missing] Flow doesn't know that forEach exists.
    body.forEach((value: string | File, key: string) => {
      const id = +key;
      if (typeof value === 'string') {
        resolveField(response, id, value);
      } else {
        resolveFile(response, id, value);
      }
    });
  }
  close(response);
  return getRoot(response);
}

export {renderToReadableStream, decodeReply};
