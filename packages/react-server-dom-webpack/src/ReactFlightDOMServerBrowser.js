/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactClientValue} from 'react-server/src/ReactFlightServer';
import type {ServerContextJSONValue} from 'shared/ReactTypes';
import type {ClientManifest} from './ReactFlightServerBundlerConfig';

import {
  renderToReadableStream as renderToReadableStreamImpl,
  decodeReply,
  decodeAction,
} from 'react-server-dom/src/ReactFlightDOMServerWebStreams';

export {
  registerServerReference,
  registerClientReference,
  createClientModuleProxy,
} from './ReactFlightWebpackReferences';

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
  const onError = options ? options.onError : undefined;
  const context = options ? options.context : undefined;
  const identifierPrefix = options ? options.identifierPrefix : undefined;
  const signal = options ? options.signal : undefined;
  return renderToReadableStreamImpl(
    model,
    webpackMap,
    onError,
    context,
    identifierPrefix,
    signal,
  );
}

export {renderToReadableStream, decodeReply, decodeAction};
