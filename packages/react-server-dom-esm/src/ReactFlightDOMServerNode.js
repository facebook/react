/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactClientValue} from 'react-server/src/ReactFlightServer';
import type {ClientManifest} from './ReactFlightServerBundlerConfig';
import type {Writable} from 'stream';
import type {ServerContextJSONValue} from 'shared/ReactTypes';

import {
  renderToPipeableStream as renderToPipeableStreamImpl,
  decodeReplyFromBusboy,
  decodeReply,
  decodeAction,
} from 'react-server-dom/src/ReactFlightDOMServerNodeStreams';

export {
  registerServerReference,
  registerClientReference,
} from './ReactFlightESMReferences';

type Options = {
  onError?: (error: mixed) => void,
  context?: Array<[string, ServerContextJSONValue]>,
  identifierPrefix?: string,
};

type PipeableStream = {
  abort(reason: mixed): void,
  pipe<T: Writable>(destination: T): T,
};

function renderToPipeableStream(
  model: ReactClientValue,
  moduleBasePath: ClientManifest,
  options?: Options,
): PipeableStream {
  const onError = options ? options.onError : undefined;
  const context = options ? options.context : undefined;
  const identifierPrefix = options ? options.identifierPrefix : undefined;
  return renderToPipeableStreamImpl(
    model,
    moduleBasePath,
    onError,
    context,
    identifierPrefix,
  );
}

export {
  renderToPipeableStream,
  decodeReplyFromBusboy,
  decodeReply,
  decodeAction,
};
