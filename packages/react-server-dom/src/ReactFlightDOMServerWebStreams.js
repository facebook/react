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
import type {ClientManifest} from 'react-server/src/ReactFlightServerConfig';
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

import {decodeAction} from 'react-server/src/ReactFlightActionServer';

type OnError = (error: mixed) => void;
type Context = Array<[string, ServerContextJSONValue]>;

function renderToReadableStream(
  model: ReactClientValue,
  webpackMap: ClientManifest,
  onError: void | OnError,
  context: void | Context,
  identifierPrefix: void | string,
  signal: void | AbortSignal,
): ReadableStream {
  const request = createRequest(
    model,
    webpackMap,
    onError,
    context,
    identifierPrefix,
  );
  if (signal) {
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

export {renderToReadableStream, decodeReply, decodeAction};
