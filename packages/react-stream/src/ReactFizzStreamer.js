/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Destination} from './ReactFizzHostConfig';
import type {ReactNodeList} from 'shared/ReactTypes';

import {
  scheduleWork,
  beginWriting,
  writeChunk,
  completeWriting,
  flushBuffered,
  close,
} from './ReactFizzHostConfig';
import {formatChunk} from './ReactFizzFormatConfig';
import {REACT_ELEMENT_TYPE} from 'shared/ReactSymbols';

type OpaqueRequest = {
  destination: Destination,
  children: ReactNodeList,
  completedChunks: Array<Uint8Array>,
  flowing: boolean,
};

export function createRequest(
  children: ReactNodeList,
  destination: Destination,
): OpaqueRequest {
  return {destination, children, completedChunks: [], flowing: false};
}

function performWork(request: OpaqueRequest): void {
  let element = (request.children: any);
  request.children = null;
  if (element && element.$$typeof !== REACT_ELEMENT_TYPE) {
    return;
  }
  let type = element.type;
  let props = element.props;
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
  let destination = request.destination;
  let chunks = request.completedChunks;
  request.completedChunks = [];

  beginWriting(destination);
  try {
    for (let i = 0; i < chunks.length; i++) {
      let chunk = chunks[i];
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

export function startFlowing(
  request: OpaqueRequest,
  desiredBytes: number,
): void {
  request.flowing = false;
  flushCompletedChunks(request);
}
