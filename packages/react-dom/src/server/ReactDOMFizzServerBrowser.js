/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList} from 'shared/ReactTypes';

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

type Options = {|
  identifierPrefix?: string,
  namespaceURI?: string,
  nonce?: string,
  bootstrapScriptContent?: string,
  bootstrapScripts?: Array<string>,
  bootstrapModules?: Array<string>,
  progressiveChunkSize?: number,
  signal?: AbortSignal,
  onCompleteAll?: () => void,
  onError?: (error: mixed) => void,
|};

function renderToReadableStream(
  children: ReactNodeList,
  options?: Options,
): Promise<ReadableStream> {
  return new Promise((resolve, reject) => {
    function onCompleteShell() {
      const stream = new ReadableStream({
        pull(controller) {
          // Pull is called immediately even if the stream is not passed to anything.
          // That's buffering too early. We want to start buffering once the stream
          // is actually used by something so we can give it the best result possible
          // at that point.
          if (stream.locked) {
            startFlowing(request, controller);
          }
        },
        cancel(reason) {},
      });
      resolve(stream);
    }
    function onErrorShell(error: mixed) {
      reject(error);
    }
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
      onCompleteShell,
      onErrorShell,
    );
    if (options && options.signal) {
      const signal = options.signal;
      const listener = () => {
        abort(request);
        signal.removeEventListener('abort', listener);
      };
      signal.addEventListener('abort', listener);
    }
    startWork(request);
  });
}

export {renderToReadableStream, ReactVersion as version};
