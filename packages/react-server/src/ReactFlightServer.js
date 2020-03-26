/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Destination,
  Chunk,
  BundlerConfig,
  ModuleMetaData,
  ModuleReference,
} from './ReactFlightServerConfig';

import {
  scheduleWork,
  beginWriting,
  writeChunk,
  completeWriting,
  flushBuffered,
  close,
  processModelChunk,
  processErrorChunk,
  resolveModuleMetaData,
} from './ReactFlightServerConfig';

import {
  REACT_BLOCK_TYPE,
  REACT_SERVER_BLOCK_TYPE,
  REACT_ELEMENT_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_LAZY_TYPE,
} from 'shared/ReactSymbols';

import invariant from 'shared/invariant';

type ReactJSONValue =
  | string
  | boolean
  | number
  | null
  | $ReadOnlyArray<ReactJSONValue>
  | ReactModelObject;

export type ReactModel =
  | React$Element<any>
  | string
  | boolean
  | number
  | null
  | Iterable<ReactModel>
  | ReactModelObject;

type ReactModelObject = {+[key: string]: ReactModel};

type Segment = {
  id: number,
  query: () => ReactModel,
  ping: () => void,
};

export type Request = {
  destination: Destination,
  bundlerConfig: BundlerConfig,
  nextChunkId: number,
  pendingChunks: number,
  pingedSegments: Array<Segment>,
  completedJSONChunks: Array<Chunk>,
  completedErrorChunks: Array<Chunk>,
  flowing: boolean,
  toJSON: (key: string, value: ReactModel) => ReactJSONValue,
};

export function createRequest(
  model: ReactModel,
  destination: Destination,
  bundlerConfig: BundlerConfig,
): Request {
  let pingedSegments = [];
  let request = {
    destination,
    bundlerConfig,
    nextChunkId: 0,
    pendingChunks: 0,
    pingedSegments: pingedSegments,
    completedJSONChunks: [],
    completedErrorChunks: [],
    flowing: false,
    toJSON: function(key: string, value: ReactModel): ReactJSONValue {
      return resolveModelToJSON(request, this, key, value);
    },
  };
  request.pendingChunks++;
  let rootSegment = createSegment(request, () => model);
  pingedSegments.push(rootSegment);
  return request;
}

function attemptResolveElement(element: React$Element<any>): ReactModel {
  let type = element.type;
  let props = element.props;
  if (typeof type === 'function') {
    // This is a server-side component.
    return type(props);
  } else if (typeof type === 'string') {
    // This is a host element. E.g. HTML.
    return [REACT_ELEMENT_TYPE, type, element.key, element.props];
  } else if (type[0] === REACT_SERVER_BLOCK_TYPE) {
    return [REACT_ELEMENT_TYPE, type, element.key, element.props];
  } else if (type === REACT_FRAGMENT_TYPE) {
    return element.props.children;
  } else {
    invariant(false, 'Unsupported type.');
  }
}

function pingSegment(request: Request, segment: Segment): void {
  let pingedSegments = request.pingedSegments;
  pingedSegments.push(segment);
  if (pingedSegments.length === 1) {
    scheduleWork(() => performWork(request));
  }
}

function createSegment(request: Request, query: () => ReactModel): Segment {
  let id = request.nextChunkId++;
  let segment = {
    id,
    query,
    ping: () => pingSegment(request, segment),
  };
  return segment;
}

function serializeIDRef(id: number): string {
  return '$' + id.toString(16);
}

function escapeStringValue(value: string): string {
  if (value[0] === '$' || value[0] === '@') {
    // We need to escape $ or @ prefixed strings since we use those to encode
    // references to IDs and as special symbol values.
    return '$' + value;
  } else {
    return value;
  }
}

export function resolveModelToJSON(
  request: Request,
  parent: {+[key: string | number]: ReactModel} | $ReadOnlyArray<ReactModel>,
  key: string,
  value: ReactModel,
): ReactJSONValue {
  // Special Symbols
  switch (value) {
    case REACT_ELEMENT_TYPE:
      return '$';
    case REACT_SERVER_BLOCK_TYPE:
      return '@';
    case REACT_LAZY_TYPE:
    case REACT_BLOCK_TYPE:
      invariant(
        false,
        'React Blocks (and Lazy Components) are expected to be replaced by a ' +
          'compiler on the server. Try configuring your compiler set up and avoid ' +
          'using React.lazy inside of Blocks.',
      );
  }

  if (parent[0] === REACT_SERVER_BLOCK_TYPE) {
    // We're currently encoding part of a Block. Look up which key.
    switch (key) {
      case '1': {
        // Module reference
        let moduleReference: ModuleReference<any> = (value: any);
        try {
          let moduleMetaData: ModuleMetaData = resolveModuleMetaData(
            request.bundlerConfig,
            moduleReference,
          );
          return (moduleMetaData: ReactJSONValue);
        } catch (x) {
          request.pendingChunks++;
          let errorId = request.nextChunkId++;
          emitErrorChunk(request, errorId, x);
          return serializeIDRef(errorId);
        }
      }
      case '2': {
        // Load function
        let load: () => ReactModel = (value: any);
        try {
          // Attempt to resolve the data.
          return load();
        } catch (x) {
          if (
            typeof x === 'object' &&
            x !== null &&
            typeof x.then === 'function'
          ) {
            // Something suspended, we'll need to create a new segment and resolve it later.
            request.pendingChunks++;
            let newSegment = createSegment(request, load);
            let ping = newSegment.ping;
            x.then(ping, ping);
            return serializeIDRef(newSegment.id);
          } else {
            // This load failed, encode the error as a separate row and reference that.
            request.pendingChunks++;
            let errorId = request.nextChunkId++;
            emitErrorChunk(request, errorId, x);
            return serializeIDRef(errorId);
          }
        }
      }
      default: {
        invariant(
          false,
          'A server block should never encode any other slots. This is a bug in React.',
        );
      }
    }
  }

  if (typeof value === 'string') {
    return escapeStringValue(value);
  }

  // Resolve server components.
  while (
    typeof value === 'object' &&
    value !== null &&
    value.$$typeof === REACT_ELEMENT_TYPE
  ) {
    // TODO: Concatenate keys of parents onto children.
    // TODO: Allow elements to suspend independently and serialize as references to future elements.
    let element: React$Element<any> = (value: any);
    value = attemptResolveElement(element);
  }

  return value;
}

function emitErrorChunk(request: Request, id: number, error: mixed): void {
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

  let processedChunk = processErrorChunk(request, id, message, stack);
  request.completedErrorChunks.push(processedChunk);
}

function retrySegment(request: Request, segment: Segment): void {
  let query = segment.query;
  try {
    let value = query();
    let processedChunk = processModelChunk(request, segment.id, value);
    request.completedJSONChunks.push(processedChunk);
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

function performWork(request: Request): void {
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
function flushCompletedChunks(request: Request): void {
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

export function startWork(request: Request): void {
  request.flowing = true;
  scheduleWork(() => performWork(request));
}

export function startFlowing(request: Request): void {
  request.flowing = true;
  flushCompletedChunks(request);
}
