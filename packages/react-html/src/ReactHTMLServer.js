/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList} from 'shared/ReactTypes';

import type {
  Request,
  PostponedState,
  ErrorInfo,
} from 'react-server/src/ReactFizzServer';

import ReactVersion from 'shared/ReactVersion';

import {
  createRequest,
  startWork,
  startFlowing,
  abort,
} from 'react-server/src/ReactFizzServer';

import {
  createResumableState,
  createRenderState,
  createRootFormatContext,
} from 'react-dom-bindings/src/server/ReactFizzConfigDOMLegacy';

type MarkupOptions = {
  identifierPrefix?: string,
  signal?: AbortSignal,
};

export function renderToMarkup(
  children: ReactNodeList,
  options?: MarkupOptions,
): Promise<string> {
  return new Promise((resolve, reject) => {
    let didFatal = false;
    let fatalError = null;
    let buffer = '';
    const destination = {
      // $FlowFixMe[missing-local-annot]
      push(chunk) {
        if (chunk !== null) {
          buffer += chunk;
        } else {
          // null indicates that we finished
          resolve(buffer);
        }
        return true;
      },
      // $FlowFixMe[missing-local-annot]
      destroy(error) {
        reject(error);
      },
    };
    function onError(error: mixed) {
      // Any error rejects the promise, regardless of where it happened.
      // Unlike other React SSR we don't want to put Suspense boundaries into
      // client rendering mode because there's no client rendering here.
      reject(error);
    }
    const resumableState = createResumableState(
      options ? options.identifierPrefix : undefined,
      undefined,
    );
    const request = createRequest(
      children,
      resumableState,
      createRenderState(resumableState, true),
      createRootFormatContext(),
      Infinity,
      onError,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
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
    startFlowing(request, destination);
  });
}

export {ReactVersion as version};
