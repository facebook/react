/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList} from 'shared/ReactTypes';
import type {Writable} from 'stream';

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

function createDrainHandler(destination, request) {
  return () => startFlowing(request);
}

type Options = {|
  identifierPrefix?: string,
  namespaceURI?: string,
  progressiveChunkSize?: number,
  onReadyToStream?: () => void,
  onCompleteAll?: () => void,
  onError?: (error: mixed) => void,
|};

type Controls = {|
  // Cancel any pending I/O and put anything remaining into
  // client rendered mode.
  abort(): void,
  startWriting(): void,
|};

function createRequestImpl(
  children: ReactNodeList,
  destination: Writable,
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

function pipeToNodeWritable(
  children: ReactNodeList,
  destination: Writable,
  options?: Options,
): Controls {
  const request = createRequestImpl(children, destination, options);
  let hasStartedFlowing = false;
  startWork(request);
  return {
    startWriting() {
      if (hasStartedFlowing) {
        return;
      }
      hasStartedFlowing = true;
      startFlowing(request);
      destination.on('drain', createDrainHandler(destination, request));
    },
    abort() {
      abort(request);
    },
  };
}

export {pipeToNodeWritable, ReactVersion as version};
