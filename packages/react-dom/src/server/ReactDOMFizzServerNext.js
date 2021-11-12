/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList} from 'shared/ReactTypes';
import type {Destination} from 'react-server/src/ReactServerStreamConfigNext';

import ReactVersion from 'shared/ReactVersion';

import {
  createRequest,
  startWork,
  startFlowing,
  abort,
} from 'react-server/src/ReactFizzServer';

import {
  createResponseState,
  createRootFormatContext,
} from './ReactDOMServerFormatConfig';

type NextStreamSource = {
  start: (controller: Destination) => void,
  pull: (controller: Destination) => void,
  cancel: (reason: mixed) => void,
};

type Options = {|
  identifierPrefix?: string,
  namespaceURI?: string,
  nonce?: string,
  bootstrapScriptContent?: string,
  bootstrapScripts?: Array<string>,
  bootstrapModules?: Array<string>,
  progressiveChunkSize?: number,
  signal?: AbortSignal,
  onCompleteShell?: () => void,
  onCompleteAll?: () => void,
  onError?: (error: mixed) => void,
|};

function renderToNextStream(
  children: ReactNodeList,
  options?: Options,
): NextStreamSource {
  const request = createRequest(
    children,
    createResponseState(
      options ? options.identifierPrefix : undefined,
      options ? options.nonce : undefined,
      options ? options.bootstrapScriptContent : undefined,
      options ? options.bootstrapScripts : undefined,
      options ? options.bootstrapModules : undefined,
    ),
    createRootFormatContext(options ? options.namespaceURI : undefined),
    options ? options.progressiveChunkSize : undefined,
    options ? options.onError : undefined,
    options ? options.onCompleteAll : undefined,
    options ? options.onCompleteShell : undefined,
  );
  if (options && options.signal) {
    const signal = options.signal;
    const listener = () => {
      abort(request);
      signal.removeEventListener('abort', listener);
    };
    signal.addEventListener('abort', listener);
  }
  const stream = {
    start(controller) {
      startWork(request);
    },
    pull(controller) {
      startFlowing(request, controller);
    },
    cancel(reason) {},
  };
  return stream;
}

export {renderToNextStream, ReactVersion as version};
