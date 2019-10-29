/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Destination} from './ReactFlightClientHostConfig';

import {
  scheduleWork,
  beginWriting,
  writeChunk,
  completeWriting,
  flushBuffered,
  close,
  convertStringToBuffer,
  formatChunkAsString,
} from './ReactFlightClientHostConfig';
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

function resolveChildToHostFormat(child: ReactJSONValue): string {
  if (typeof child === 'string') {
    return child;
  } else if (typeof child === 'number') {
    return '' + child;
  } else if (typeof child === 'boolean' || child === null) {
    // Booleans are like null when they're React children.
    return '';
  } else if (Array.isArray(child)) {
    return (child: Array<ReactModel>)
      .map(c => resolveChildToHostFormat(resolveModelToJSON('', c)))
      .join('');
  } else {
    throw new Error('Object models are not valid as children of host nodes.');
  }
}

function resolveElementToHostFormat(type: string, props: Object): string {
  let child = resolveModelToJSON('', props.children);
  let childString = resolveChildToHostFormat(child);
  return formatChunkAsString(
    type,
    Object.assign({}, props, {children: childString}),
  );
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
      return resolveElementToHostFormat(type, props);
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
