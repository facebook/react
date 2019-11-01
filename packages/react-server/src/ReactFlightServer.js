/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Destination} from './ReactServerHostConfig';

import {
  scheduleWork,
  beginWriting,
  writeChunk,
  completeWriting,
  flushBuffered,
  close,
  convertStringToBuffer,
} from './ReactServerHostConfig';
import {renderHostChildrenToString} from './ReactServerFormatConfig';
import {REACT_ELEMENT_TYPE} from 'shared/ReactSymbols';

export type ReactModel =
  | React$Element<any>
  | string
  | boolean
  | number
  | null
  | Iterable<ReactModel>
  | ReactModelObject;

type ReactJSONValue =
  | string
  | boolean
  | number
  | null
  | Array<ReactModel>
  | ReactModelObject;

type ReactModelObject = {
  +[key: string]: ReactModel,
};

type OpaqueRequest = {
  destination: Destination,
  model: ReactModel,
  completedChunks: Array<Uint8Array>,
  flowing: boolean,
};

export function createRequest(
  model: ReactModel,
  destination: Destination,
): OpaqueRequest {
  return {destination, model, completedChunks: [], flowing: false};
}

function resolveModelToJSON(key: string, value: ReactModel): ReactJSONValue {
  while (value && value.$$typeof === REACT_ELEMENT_TYPE) {
    let element: React$Element<any> = (value: any);
    let type = element.type;
    let props = element.props;
    if (typeof type === 'function') {
      // This is a nested view model.
      value = type(props);
      continue;
    } else if (typeof type === 'string') {
      // This is a host element. E.g. HTML.
      return renderHostChildrenToString(element);
    } else {
      throw new Error('Unsupported type.');
    }
  }
  return value;
}

function performWork(request: OpaqueRequest): void {
  let rootModel = request.model;
  request.model = null;
  let json = JSON.stringify(rootModel, resolveModelToJSON);
  request.completedChunks.push(convertStringToBuffer(json));
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
