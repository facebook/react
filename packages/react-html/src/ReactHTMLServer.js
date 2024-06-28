/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList} from 'shared/ReactTypes';
import type {LazyComponent} from 'react/src/ReactLazy';

import ReactVersion from 'shared/ReactVersion';

import {
  createRequest as createFlightRequest,
  startWork as startFlightWork,
  startFlowing as startFlightFlowing,
  abort as abortFlight,
} from 'react-server/src/ReactFlightServer';

import {
  createResponse as createFlightResponse,
  getRoot as getFlightRoot,
  processBinaryChunk as processFlightBinaryChunk,
  close as closeFlight,
} from 'react-client/src/ReactFlightClient';

import {
  createRequest as createFizzRequest,
  startWork as startFizzWork,
  startFlowing as startFizzFlowing,
  abort as abortFizz,
} from 'react-server/src/ReactFizzServer';

import {
  createResumableState,
  createRenderState,
  createRootFormatContext,
} from 'react-dom-bindings/src/server/ReactFizzConfigDOMLegacy';

type ReactMarkupNodeList =
  // This is the intersection of ReactNodeList and ReactClientValue minus
  // Client/ServerReferences.
  | React$Element<React$AbstractComponent<any, any>>
  | LazyComponent<ReactMarkupNodeList, any>
  | React$Element<string>
  | string
  | boolean
  | number
  | symbol
  | null
  | void
  | bigint
  | $AsyncIterable<ReactMarkupNodeList, ReactMarkupNodeList, void>
  | $AsyncIterator<ReactMarkupNodeList, ReactMarkupNodeList, void>
  | Iterable<ReactMarkupNodeList>
  | Iterator<ReactMarkupNodeList>
  | Array<ReactMarkupNodeList>
  | Promise<ReactMarkupNodeList>; // Thenable<ReactMarkupNodeList>

type MarkupOptions = {
  identifierPrefix?: string,
  signal?: AbortSignal,
};

function noServerCallOrFormAction() {
  throw new Error(
    'renderToMarkup should not have emitted Server References. This is a bug in React.',
  );
}

export function renderToMarkup(
  children: ReactMarkupNodeList,
  options?: MarkupOptions,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const textEncoder = new TextEncoder();
    const flightDestination = {
      push(chunk: string | null): boolean {
        if (chunk !== null) {
          // TODO: Legacy should not use binary streams.
          processFlightBinaryChunk(flightResponse, textEncoder.encode(chunk));
        } else {
          closeFlight(flightResponse);
        }
        return true;
      },
      destroy(error: mixed): void {
        abortFizz(fizzRequest, error);
        reject(error);
      },
    };
    let buffer = '';
    const fizzDestination = {
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
        abortFlight(flightRequest, error);
        reject(error);
      },
    };
    function onError(error: mixed) {
      // Any error rejects the promise, regardless of where it happened.
      // Unlike other React SSR we don't want to put Suspense boundaries into
      // client rendering mode because there's no client rendering here.
      reject(error);
    }
    const flightRequest = createFlightRequest(
      // $FlowFixMe: This should be a subtype but not everything is typed covariant.
      children,
      null,
      onError,
      options ? options.identifierPrefix : undefined,
      undefined,
      'Markup',
      undefined,
    );
    const flightResponse = createFlightResponse(
      null,
      null,
      noServerCallOrFormAction,
      noServerCallOrFormAction,
      undefined,
      undefined,
      undefined,
    );
    const resumableState = createResumableState(
      options ? options.identifierPrefix : undefined,
      undefined,
    );
    const root = getFlightRoot<ReactNodeList>(flightResponse);
    const fizzRequest = createFizzRequest(
      // $FlowFixMe: Thenables as children are supported.
      root,
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
        abortFlight(flightRequest, (signal: any).reason);
        abortFizz(fizzRequest, (signal: any).reason);
      } else {
        const listener = () => {
          abortFlight(flightRequest, (signal: any).reason);
          abortFizz(fizzRequest, (signal: any).reason);
          signal.removeEventListener('abort', listener);
        };
        signal.addEventListener('abort', listener);
      }
    }
    startFlightWork(flightRequest);
    startFlightFlowing(flightRequest, flightDestination);
    startFizzWork(fizzRequest);
    startFizzFlowing(fizzRequest, fizzDestination);
  });
}

export {ReactVersion as version};
