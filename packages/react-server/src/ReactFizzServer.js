/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Destination} from './ReactServerStreamConfig';
import type {ReactNodeList} from 'shared/ReactTypes';

import {
  scheduleWork,
  beginWriting,
  writeChunk,
  completeWriting,
  flushBuffered,
  close,
} from './ReactServerStreamConfig';
import {formatChunk} from './ReactServerFormatConfig';
import {REACT_ELEMENT_TYPE} from 'shared/ReactSymbols';

type OpaqueRequest = {
  destination: Destination,
  children: ReactNodeList,
  completedChunks: Array<Uint8Array>,
  flowing: boolean,
  ...
};

export function createRequest(
  children: ReactNodeList,
  destination: Destination,
): OpaqueRequest {
  return {destination, children, completedChunks: [], flowing: false};
}

function performWork(request: OpaqueRequest): void {
  const element = (request.children: any);
  request.children = null;
  if (element && element.$$typeof !== REACT_ELEMENT_TYPE) {
    return;
  }
  const type = element.type;
  const props = element.props;
  if (typeof type !== 'string') {
    return;
  }
  request.completedChunks.push(formatChunk(type, props));
  if (request.flowing) {
    flushCompletedChunks(request);
  }

  flushBuffered(request.destination);
}

function flushCompletedChunks(request: OpaqueRequest) {
  const destination = request.destination;
  const chunks = request.completedChunks;
  request.completedChunks = [];

  beginWriting(destination);
  try {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      writeChunk(destination, chunk);
    }
  } finally {
    completeWriting(destination);
  }
  close(destination);
}

export function startWork(request: OpaqueRequest): void {
  request.flowing = true;
  scheduleWork(() => performWork(request));
}

export function startFlowing(request: OpaqueRequest): void {
  request.flowing = false;
  flushCompletedChunks(request);
}
