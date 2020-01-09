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

/*

FLIGHT PROTOCOL GRAMMAR

Response
- JSONData RowSequence
- JSONData

RowSequence
- Row RowSequence
- Row

Row
- "J" RowID JSONData
- "H" RowID HTMLData
- "B" RowID BlobData
- "U" RowID URLData
- "E" RowID ErrorData

RowID
- HexDigits ":"

HexDigits
- HexDigit HexDigits
- HexDigit

HexDigit
- 0-F

URLData
- (UTF8 encoded URL) "\n"

ErrorData
- (UTF8 encoded JSON: {message: "...", stack: "..."}) "\n"

JSONData
- (UTF8 encoded JSON) "\n"
  - String values that begin with $ are escaped with a "$" prefix.
  - References to other rows are encoding as JSONReference strings.

JSONReference
- "$" HexDigits

HTMLData
- ByteSize (UTF8 encoded HTML)

BlobData
- ByteSize (Binary Data)

ByteSize
- (unsigned 32-bit integer)
*/

// TODO: Implement HTMLData, BlobData and URLData.

const stringify = JSON.stringify;

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

type ReactModelObject = {+[key: string]: ReactModel, ...};

type Segment = {
  id: number,
  model: ReactModel,
  ping: () => void,
  ...
};

type OpaqueRequest = {
  destination: Destination,
  nextChunkId: number,
  pendingChunks: number,
  pingedSegments: Array<Segment>,
  completedJSONChunks: Array<Uint8Array>,
  completedErrorChunks: Array<Uint8Array>,
  flowing: boolean,
  toJSON: (key: string, value: ReactModel) => ReactJSONValue,
  ...
};

export function createRequest(
  model: ReactModel,
  destination: Destination,
): OpaqueRequest {
  let pingedSegments = [];
  let request = {
    destination,
    nextChunkId: 0,
    pendingChunks: 0,
    pingedSegments: pingedSegments,
    completedJSONChunks: [],
    completedErrorChunks: [],
    flowing: false,
    toJSON: (key: string, value: ReactModel) =>
      resolveModelToJSON(request, value),
  };
  request.pendingChunks++;
  let rootSegment = createSegment(request, model);
  pingedSegments.push(rootSegment);
  return request;
}

function attemptResolveModelComponent(element: React$Element<any>): ReactModel {
  let type = element.type;
  let props = element.props;
  if (typeof type === 'function') {
    // This is a nested view model.
    return type(props);
  } else if (typeof type === 'string') {
    // This is a host element. E.g. HTML.
    return renderHostChildrenToString(element);
  } else {
    throw new Error('Unsupported type.');
  }
}

function pingSegment(request: OpaqueRequest, segment: Segment): void {
  let pingedSegments = request.pingedSegments;
  pingedSegments.push(segment);
  if (pingedSegments.length === 1) {
    scheduleWork(() => performWork(request));
  }
}

function createSegment(request: OpaqueRequest, model: ReactModel): Segment {
  let id = request.nextChunkId++;
  let segment = {
    id,
    model,
    ping: () => pingSegment(request, segment),
  };
  return segment;
}

function serializeIDRef(id: number): string {
  return '$' + id.toString(16);
}

function serializeRowHeader(tag: string, id: number) {
  return tag + id.toString(16) + ':';
}

function escapeStringValue(value: string): string {
  if (value[0] === '$') {
    // We need to escape $ prefixed strings since we use that to encode
    // references to IDs.
    return '$' + value;
  } else {
    return value;
  }
}

function resolveModelToJSON(
  request: OpaqueRequest,
  value: ReactModel,
): ReactJSONValue {
  if (typeof value === 'string') {
    return escapeStringValue(value);
  }

  while (
    typeof value === 'object' &&
    value !== null &&
    value.$$typeof === REACT_ELEMENT_TYPE
  ) {
    let element: React$Element<any> = (value: any);
    try {
      value = attemptResolveModelComponent(element);
    } catch (x) {
      if (typeof x === 'object' && x !== null && typeof x.then === 'function') {
        // Something suspended, we'll need to create a new segment and resolve it later.
        request.pendingChunks++;
        let newSegment = createSegment(request, element);
        let ping = newSegment.ping;
        x.then(ping, ping);
        return serializeIDRef(newSegment.id);
      } else {
        request.pendingChunks++;
        let errorId = request.nextChunkId++;
        emitErrorChunk(request, errorId, x);
        return serializeIDRef(errorId);
      }
    }
  }

  return value;
}

function emitErrorChunk(
  request: OpaqueRequest,
  id: number,
  error: mixed,
): void {
  // TODO: We should not leak error messages to the client in prod.
  // Give this an error code instead and log on the server.
  // We can serialize the error in DEV as a convenience.
  let message;
  let stack = '';
  try {
    if (error instanceof Error) {
      message = '' + error.message;
      stack = '' + error.stack;
    } else {
      message = 'Error: ' + (error: any);
    }
  } catch (x) {
    message = 'An error occurred but serializing the error message failed.';
  }
  let errorInfo = {message, stack};
  let row = serializeRowHeader('E', id) + stringify(errorInfo) + '\n';
  request.completedErrorChunks.push(convertStringToBuffer(row));
}

function retrySegment(request: OpaqueRequest, segment: Segment): void {
  let value = segment.model;
  try {
    while (
      typeof value === 'object' &&
      value !== null &&
      value.$$typeof === REACT_ELEMENT_TYPE
    ) {
      // If this is a nested model, there's no need to create another chunk,
      // we can reuse the existing one and try again.
      let element: React$Element<any> = (value: any);
      segment.model = element;
      value = attemptResolveModelComponent(element);
    }
    let json = stringify(value, request.toJSON);
    let row;
    let id = segment.id;
    if (id === 0) {
      row = json + '\n';
    } else {
      row = serializeRowHeader('J', id) + json + '\n';
    }
    request.completedJSONChunks.push(convertStringToBuffer(row));
  } catch (x) {
    if (typeof x === 'object' && x !== null && typeof x.then === 'function') {
      // Something suspended again, let's pick it back up later.
      let ping = segment.ping;
      x.then(ping, ping);
      return;
    } else {
      // This errored, we need to serialize this error to the
      emitErrorChunk(request, segment.id, x);
    }
  }
}

function performWork(request: OpaqueRequest): void {
  let pingedSegments = request.pingedSegments;
  request.pingedSegments = [];
  for (let i = 0; i < pingedSegments.length; i++) {
    let segment = pingedSegments[i];
    retrySegment(request, segment);
  }
  if (request.flowing) {
    flushCompletedChunks(request);
  }
}

let reentrant = false;
function flushCompletedChunks(request: OpaqueRequest): void {
  if (reentrant) {
    return;
  }
  reentrant = true;
  let destination = request.destination;
  beginWriting(destination);
  try {
    let jsonChunks = request.completedJSONChunks;
    let i = 0;
    for (; i < jsonChunks.length; i++) {
      request.pendingChunks--;
      let chunk = jsonChunks[i];
      if (!writeChunk(destination, chunk)) {
        request.flowing = false;
        i++;
        break;
      }
    }
    jsonChunks.splice(0, i);
    let errorChunks = request.completedErrorChunks;
    i = 0;
    for (; i < errorChunks.length; i++) {
      request.pendingChunks--;
      let chunk = errorChunks[i];
      if (!writeChunk(destination, chunk)) {
        request.flowing = false;
        i++;
        break;
      }
    }
    errorChunks.splice(0, i);
  } finally {
    reentrant = false;
    completeWriting(destination);
  }
  flushBuffered(destination);
  if (request.pendingChunks === 0) {
    // We're done.
    close(destination);
  }
}

export function startWork(request: OpaqueRequest): void {
  request.flowing = true;
  scheduleWork(() => performWork(request));
}

export function startFlowing(request: OpaqueRequest): void {
  request.flowing = true;
  flushCompletedChunks(request);
}
