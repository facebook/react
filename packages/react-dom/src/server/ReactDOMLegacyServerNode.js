/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList} from 'shared/ReactTypes';

import type {Request} from 'react-server/src/ReactFizzServer';

import {
  createRequest,
  startWork,
  startFlowing,
  abort,
} from 'react-server/src/ReactFizzServer';

import {
  createResponseState,
  createRootFormatContext,
} from './ReactDOMServerLegacyFormatConfig';

import {
  version,
  renderToString,
  renderToStaticMarkup,
} from './ReactDOMLegacyServerBrowser';

import {Readable} from 'stream';

type ServerOptions = {
  identifierPrefix?: string,
};

class ReactMarkupReadableStream extends Readable {
  request: Request;
  startedFlowing: boolean;
  constructor() {
    // Calls the stream.Readable(options) constructor. Consider exposing built-in
    // features like highWaterMark in the future.
    super({});
    this.request = (null: any);
    this.startedFlowing = false;
  }

  _destroy(err, callback) {
    abort(this.request);
    // $FlowFixMe: The type definition for the callback should allow undefined and null.
    callback(err);
  }

  _read(size) {
    if (this.startedFlowing) {
      startFlowing(this.request, this);
    }
  }
}

function onError() {
  // Non-fatal errors are ignored.
}

function renderToNodeStreamImpl(
  children: ReactNodeList,
  options: void | ServerOptions,
  generateStaticMarkup: boolean,
): Readable {
  function onCompleteAll() {
    // We wait until everything has loaded before starting to write.
    // That way we only end up with fully resolved HTML even if we suspend.
    destination.startedFlowing = true;
    startFlowing(request, destination);
  }
  const destination = new ReactMarkupReadableStream();
  const request = createRequest(
    children,
    createResponseState(false, options ? options.identifierPrefix : undefined),
    createRootFormatContext(),
    Infinity,
    onError,
    onCompleteAll,
    undefined,
  );
  destination.request = request;
  startWork(request);
  return destination;
}

function renderToNodeStream(
  children: ReactNodeList,
  options?: ServerOptions,
): Readable {
  return renderToNodeStreamImpl(children, options, false);
}

function renderToStaticNodeStream(
  children: ReactNodeList,
  options?: ServerOptions,
): Readable {
  return renderToNodeStreamImpl(children, options, true);
}

export {
  renderToString,
  renderToStaticMarkup,
  renderToNodeStream,
  renderToStaticNodeStream,
  version,
};
