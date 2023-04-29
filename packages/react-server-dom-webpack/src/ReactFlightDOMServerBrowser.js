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
import type {ClientManifest} from './ReactFlightServerConfigWebpackBundler';
import type {ServerManifest} from 'react-client/src/ReactFlightClientConfig';

import {
  createRequest,
  startWork,
  startFlowing,
  abort,
} from 'react-server/src/ReactFlightServer';

import {
  createResponse,
  close,
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
  if (typeof body === 'string') {
    const form = new FormData();
    form.append('0', body);
    body = form;
  }
  const response = createResponse(webpackMap, '', body);
  close(response);
  return getRoot(response);
}

export {renderToReadableStream, decodeReply};
