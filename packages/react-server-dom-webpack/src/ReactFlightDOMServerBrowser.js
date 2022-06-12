/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactModel} from 'react-server/src/ReactFlightServer';
import type {ServerContextJSONValue} from 'shared/ReactTypes';
import type {BundlerConfig} from './ReactFlightServerWebpackBundlerConfig';

import {
  createRequest,
  startWork,
  startFlowing,
} from 'react-server/src/ReactFlightServer';

type Options = {
  onError?: (error: mixed) => void,
  context?: Array<[string, ServerContextJSONValue]>,
  identifierPrefix?: string,
};

function renderToReadableStream(
  model: ReactModel,
  webpackMap: BundlerConfig,
  options?: Options,
): ReadableStream {
  const request = createRequest(
    model,
    webpackMap,
    options ? options.onError : undefined,
    options ? options.context : undefined,
    options ? options.identifierPrefix : undefined,
  );
  const stream = new ReadableStream(
    {
      type: 'bytes',
      start(controller) {
        startWork(request);
      },
      pull(controller) {
        startFlowing(request, controller);
      },
      cancel(reason) {},
    },
    // $FlowFixMe size() methods are not allowed on byte streams.
    {highWaterMark: 0},
  );
  return stream;
}

export {renderToReadableStream};
