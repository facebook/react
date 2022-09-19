/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList} from 'shared/ReactTypes';
import type {BootstrapScriptDescriptor} from './ReactDOMServerFormatConfig';

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

type Options = {
  identifierPrefix?: string,
  namespaceURI?: string,
  bootstrapScriptContent?: string,
  bootstrapScripts?: Array<string | BootstrapScriptDescriptor>,
  bootstrapModules?: Array<string | BootstrapScriptDescriptor>,
  progressiveChunkSize?: number,
  signal?: AbortSignal,
  onError?: (error: mixed) => ?string,
};

type StaticResult = {
  prelude: ReadableStream,
};

function prerender(
  children: ReactNodeList,
  options?: Options,
): Promise<StaticResult> {
  return new Promise((resolve, reject) => {
    const onFatalError = reject;

    function onAllReady() {
      const stream = new ReadableStream(
        {
          type: 'bytes',
          pull(controller): ?Promise<void> {
            startFlowing(request, controller);
          },
        },
        // $FlowFixMe size() methods are not allowed on byte streams.
        {highWaterMark: 0},
      );

      const result = {
        prelude: stream,
      };
      resolve(result);
    }
    const request = createRequest(
      children,
      createResponseState(
        options ? options.identifierPrefix : undefined,
        undefined,
        options ? options.bootstrapScriptContent : undefined,
        options ? options.bootstrapScripts : undefined,
        options ? options.bootstrapModules : undefined,
      ),
      createRootFormatContext(options ? options.namespaceURI : undefined),
      options ? options.progressiveChunkSize : undefined,
      options ? options.onError : undefined,
      onAllReady,
      undefined,
      undefined,
      onFatalError,
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
    startWork(request);
  });
}

export {prerender, ReactVersion as version};
