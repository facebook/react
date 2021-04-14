/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import ReactVersion from 'shared/ReactVersion';
import invariant from 'shared/invariant';

import type {ReactNodeList} from 'shared/ReactTypes';

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

type ServerOptions = {
  identifierPrefix?: string,
};

function onError() {
  // Non-fatal errors are ignored.
}

function renderToString(
  children: ReactNodeList,
  options?: ServerOptions,
): string {
  let didFatal = false;
  let fatalError = null;
  const result = [];
  const destination = {
    push(chunk) {
      if (chunk) {
        result.push(chunk);
      }
      return true;
    },
    destroy(error) {
      didFatal = true;
      fatalError = error;
    },
  };
  const request = createRequest(
    children,
    destination,
    createResponseState(options ? options.identifierPrefix : undefined),
    createRootFormatContext(undefined),
    Infinity,
    onError,
    undefined,
    undefined,
  );
  startWork(request);
  // If anything suspended and is still pending, we'll abort it before writing.
  // That way we write only client-rendered boundaries from the start.
  abort(request);
  startFlowing(request);
  if (didFatal) {
    throw fatalError;
  }
  return result.join('');
}

function renderToNodeStream() {
  invariant(
    false,
    'ReactDOMServer.renderToNodeStream(): The streaming API is not available ' +
      'in the browser. Use ReactDOMServer.renderToString() instead.',
  );
}

function renderToStaticNodeStream() {
  invariant(
    false,
    'ReactDOMServer.renderToStaticNodeStream(): The streaming API is not available ' +
      'in the browser. Use ReactDOMServer.renderToStaticMarkup() instead.',
  );
}

export {
  renderToString,
  renderToString as renderToStaticMarkup,
  renderToNodeStream,
  renderToStaticNodeStream,
  ReactVersion as version,
};
