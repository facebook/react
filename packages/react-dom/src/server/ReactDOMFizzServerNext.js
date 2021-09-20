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
  stopFlowing,
  abort,
} from 'react-server/src/ReactFizzServer';

import {
  createResponseState,
  createRootFormatContext,
} from './ReactDOMServerFormatConfig';

type Options = {|
  identifierPrefix?: string,
  namespaceURI?: string,
  progressiveChunkSize?: number,
  onReadyToStream?: () => void,
  onCompleteAll?: () => void,
  onError?: (error: mixed) => void,
|};

type Controls = {|
  abort(): void,
  update(): void,
|};

function createRequestImpl(
  children: ReactNodeList,
  destination: Destination,
  options: void | Options,
) {
  return createRequest(
    children,
    destination,
    createResponseState(options ? options.identifierPrefix : undefined),
    createRootFormatContext(options ? options.namespaceURI : undefined),
    options ? options.progressiveChunkSize : undefined,
    options ? options.onError : undefined,
    options ? options.onCompleteAll : undefined,
    options ? options.onReadyToStream : undefined,
  );
}

function renderToNextStream(
  children: ReactNodeList,
  destination: Destination,
  options?: Options,
): Controls {
  const request = createRequestImpl(children, destination, options);
  startWork(request);
  return {
    abort() {
      abort(request);
    },
    update() {
      if (destination.ready) {
        startFlowing();
      } else {
        stopFlowing();
      }
    },
  };
}

export {renderToNextStream, ReactVersion as version};
