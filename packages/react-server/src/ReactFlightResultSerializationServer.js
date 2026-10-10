/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ResultModel} from 'shared/ReactFlightResultModel';
import type {
  ReactClientValue,
  ReactClientObject,
} from './ReactFlightResultServer';
import type {ReactElement} from 'shared/ReactElementType';
import type {Chunk, Destination} from './ReactServerStreamConfig';
import type {HintCode, HintModel} from './ReactFlightResultServerConfig';
import type {
  ClientManifest,
  ClientReference,
  ClientReferenceKey,
  ClientReferenceMetadata,
} from './ReactFlightServerConfig';
import {
  beginWriting,
  writeChunkAndReturn,
  completeWriting,
  flushBuffered,
  close,
  closeWithError,
  stringToChunk,
  scheduleMicrotask,
  scheduleWork,
} from './ReactServerStreamConfig';
import {REACT_ELEMENT_TYPE} from 'shared/ReactSymbols';
import isArray from 'shared/isArray';
import hasOwnProperty from 'shared/hasOwnProperty';
import noop from 'shared/noop';
import {
  isClientReference,
  getClientReferenceKey,
  resolveClientReferenceMetadata,
} from './ReactFlightServerConfig';

const stringify = JSON.stringify;
const getPrototypeOf = Object.getPrototypeOf;
const ObjectPrototype = Object.prototype;
let importStringRequest: null | Request = null;

// Bundler metadata repeats the same chunk URLs across every client reference of
// a route, so strings in it at least this long get outlined and deduplicated
// when they repeat. The threshold is bounded away from zero because outlining
// something as short as an export name costs more than copying it.
const MIN_DEDUPLICATED_IMPORT_STRING_LENGTH = 16;

// Tracked strings are retained for the rest of the request, so their combined
// length is capped.
const MAX_DEDUPLICATED_IMPORT_STRINGS_SIZE = 32768;

// Bundler metadata is two or three levels deep. The bound is only there so a
// cycle ends up in stringify itself, which throws its own error for it.
const MAX_IMPORT_METADATA_DEPTH = 16;
const NOT_PLAIN_IMPORT_METADATA = {};

const OPENING = 10;
const CLOSING = 13;
const CLOSED = 14;

const PENDING = 0;
const COMPLETED = 1;
const ERRORED = 4;

type Task = {
  id: number,
  status: 0 | 1 | 4,
  model: ReactClientValue,
};

type ReactJSONValue =
  | string
  | boolean
  | number
  | null
  | Array<ReactClientValue>
  | ReactClientObject;
type ModelParent = ReactClientObject | $ReadOnlyArray<ReactClientValue>;

export type Input = {
  +root: ResultModel<ReactClientValue>,
  subscribe: ({
    hint: (HintCode, HintModel<any>) => void,
    complete: () => void,
  }) => () => void,
};
export type Request = {
  input: Input,
  destination: null | Destination,
  status: 10 | 13 | 14,
  fatalError: mixed,
  completedRegularChunks: Array<Chunk>,
  pendingChunks: number,
  nextChunkId: number,
  abortableTasks: Set<Task>,
  pingedTasks: Array<Task>,
  completedHintChunks: Array<Chunk>,
  flushScheduled: boolean,
  inputUnsubscribe: () => void,
  bundlerConfig: ClientManifest,
  writtenClientReferences: Map<ClientReferenceKey, number>,
  writtenImportStrings: Map<string, string>,
  writtenImportStringsSize: number,
  completedImportChunks: Array<Chunk>,
};

function RequestInstance(
  this: any,
  input: Input,
  bundlerConfig: ClientManifest,
) {
  this.input = input;
  this.destination = null;
  this.status = OPENING;
  this.fatalError = null;
  this.completedRegularChunks = [];
  this.completedHintChunks = [];
  this.flushScheduled = false;
  this.inputUnsubscribe = noop;
  this.bundlerConfig = bundlerConfig;
  this.writtenClientReferences = new Map();
  this.writtenImportStrings = new Map();
  this.writtenImportStringsSize = 0;
  this.completedImportChunks = [];
  this.pendingChunks = 0;
  this.nextChunkId = 0;
  this.abortableTasks = new Set();
  this.pingedTasks = [];
  const rootTask = createTask(this, null, this.abortableTasks);
  subscribeToInput(this, input, rootTask);
}

export function createRequest(
  input: Input,
  bundlerConfig: ClientManifest,
): Request {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new RequestInstance(input, bundlerConfig);
}

function renderClientElement(
  type: any,
  key: null | string,
  props: ReactClientValue,
  validated: number,
): ReactJSONValue {
  return __DEV__
    ? [REACT_ELEMENT_TYPE, type, key, props, null, null, validated]
    : [REACT_ELEMENT_TYPE, type, key, props];
}

function serializeNumber(number: number): string | number {
  if (Number.isFinite(number)) {
    if (number === 0 && 1 / number === -Infinity) {
      return '$-0';
    } else {
      return number;
    }
  } else {
    if (number === Infinity) {
      return '$Infinity';
    } else if (number === -Infinity) {
      return '$-Infinity';
    } else {
      return '$NaN';
    }
  }
}

function serializeUndefined(): string {
  return '$undefined';
}

function renderModelDestructive(
  request: Request,
  task: Task,
  parent: ModelParent,
  parentPropertyName: string,
  value: ReactClientValue,
): ReactJSONValue {
  task.model = value;
  if (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function') &&
    isClientReference(value)
  ) {
    const clientReference: ClientReference<any> = value as any;
    return serializeClientReference(
      request,
      task,
      parent,
      parentPropertyName,
      clientReference,
    );
  }
  if (value === null) {
    return null;
  }
  if (typeof value === 'object') {
    if ((value as any).$$typeof === REACT_ELEMENT_TYPE) {
      const element: ReactElement = value as any;
      return renderClientElement(
        element.type,
        element.key,
        element.props,
        __DEV__ ? element._store.validated : 0,
      );
    }
    return value as any;
  }
  if (typeof value === 'string') {
    return value[0] === '$' ? '$' + value : value;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return serializeNumber(value);
  }
  if (typeof value === 'undefined') {
    return serializeUndefined();
  }
  if (
    value === REACT_ELEMENT_TYPE &&
    parentPropertyName === '0' &&
    isArray(parent)
  ) {
    return '$';
  }
  throw new Error('Not implemented.');
}

function resolveModel(
  request: Request,
  task: Task,
  parent: ModelParent,
  parentPropertyName: string,
  value: ReactClientValue,
): ReactJSONValue {
  const rendered = renderModelDestructive(
    request,
    task,
    parent,
    parentPropertyName,
    value,
  );
  if (rendered === null || typeof rendered !== 'object') {
    return rendered;
  }
  if (isArray(rendered)) {
    let resolved: null | Array<ReactClientValue> = null;
    for (let i = 0; i < rendered.length; i++) {
      const child = rendered[i];
      const resolvedValue = resolveModel(
        request,
        task,
        rendered,
        '' + i,
        child,
      );
      if (resolved === null && resolvedValue !== child) {
        resolved = i === 0 ? [] : rendered.slice(0, i);
      }
      if (resolved !== null) {
        resolved[i] = resolvedValue;
      }
    }
    return resolved === null ? rendered : resolved;
  }
  let resolved: null | {[key: string]: ReactClientValue} = null;
  for (const key in rendered) {
    if (hasOwnProperty.call(rendered, key)) {
      const child = rendered[key];
      const resolvedValue = resolveModel(request, task, rendered, key, child);
      if (resolved === null && resolvedValue !== child) {
        resolved = {} as {[key: string]: ReactClientValue};
        for (const previousKey in rendered) {
          if (previousKey === key) {
            break;
          }
          if (hasOwnProperty.call(rendered, previousKey)) {
            if (previousKey === '__proto__') {
              Object.defineProperty(resolved, previousKey, {
                value: rendered[previousKey],
                enumerable: true,
                writable: true,
                configurable: true,
              });
            } else {
              resolved[previousKey] = rendered[previousKey];
            }
          }
        }
      }
      if (resolved !== null) {
        if (key === '__proto__') {
          Object.defineProperty(resolved, key, {
            value: resolvedValue,
            enumerable: true,
            writable: true,
            configurable: true,
          });
        } else {
          resolved[key] = resolvedValue;
        }
      }
    }
  }
  return resolved === null ? rendered : resolved;
}

function emitModelChunk(request: Request, id: number, json: string): void {
  const row = id.toString(16) + ':' + json + '\n';
  const processedChunk = stringToChunk(row);
  request.completedRegularChunks.push(processedChunk);
}

function createTask(
  request: Request,
  model: ReactClientValue,
  abortSet: Set<Task>,
): Task {
  const id = request.nextChunkId++;
  request.pendingChunks++;
  const task: Task = {
    id,
    status: PENDING,
    model,
  };
  abortSet.add(task);
  return task;
}

function retryTask(request: Request, task: Task): void {
  if (task.status !== PENDING) {
    return;
  }
  try {
    const model = task.model;
    const resolvedModel = resolveModel(request, task, {'': model}, '', model);
    const json = JSON.stringify(resolvedModel);
    emitModelChunk(request, task.id, json);
    task.status = COMPLETED;
    request.abortableTasks.delete(task);
  } catch (error) {
    task.status = ERRORED;
    request.abortableTasks.delete(task);
    fatalError(request, error);
  }
}

function performWork(request: Request): void {
  try {
    const pingedTasks = request.pingedTasks;
    request.pingedTasks = [];
    for (let i = 0; i < pingedTasks.length; i++) {
      retryTask(request, pingedTasks[i]);
    }
    flushCompletedChunks(request);
  } catch (error) {
    fatalError(request, error);
  }
}

function pingTask(request: Request, task: Task): void {
  const pingedTasks = request.pingedTasks;
  pingedTasks.push(task);
  if (pingedTasks.length === 1) {
    scheduleMicrotask(() => performWork(request));
  }
}

function serializeByValueID(id: number): string {
  return '$' + id.toString(16);
}

function serializeLazyID(id: number): string {
  return '$L' + id.toString(16);
}

function escapeStringValue(value: string): string {
  if (value[0] === '$') {
    // We need to escape $ prefixed strings since we use those to encode
    // references to IDs and as special symbol values.
    return '$' + value;
  } else {
    return value;
  }
}

function serializeImportString(request: Request, value: string): string {
  // No maximum length because import strings are short and repeat often.
  // Deduping model strings too would need one to skip very long strings.
  if (value.length < MIN_DEDUPLICATED_IMPORT_STRING_LENGTH) {
    return escapeStringValue(value);
  }
  const writtenStrings = request.writtenImportStrings;
  const existing = writtenStrings.get(value);
  if (existing !== undefined) {
    return existing;
  }
  const size = request.writtenImportStringsSize + value.length;
  if (size > MAX_DEDUPLICATED_IMPORT_STRINGS_SIZE) {
    // The map is full. Strings already outlined keep deduping; new ones are
    // written out every time.
    return escapeStringValue(value);
  }
  request.writtenImportStringsSize = size;
  // Chunk names are almost always shared, so the first occurrence is outlined
  // right away instead of waiting for a repeat.
  request.pendingChunks++;
  const outlinedId = request.nextChunkId++;
  // $FlowFixMe[incompatible-type] stringify can return null
  const json: string = stringify(escapeStringValue(value));
  // The client reads import metadata synchronously, so this row has to have
  // been written by the time the referencing row arrives. Import chunks are
  // flushed ahead of regular ones, which regular chunks can't guarantee.
  request.completedImportChunks.push(
    stringToChunk(outlinedId.toString(16) + ':' + json + '\n'),
  );
  const ref = serializeByValueID(outlinedId);
  writtenStrings.set(value, ref);
  return ref;
}

function importMetadataReplacer(key: string, value: mixed): mixed {
  if (typeof value === 'string') {
    const request = importStringRequest;
    if (request === null) {
      return escapeStringValue(value);
    }
    return serializeImportString(request, value);
  }
  return value;
}

function stringifyImportMetadataWithReplacer(
  request: Request,
  clientReferenceMetadata: ClientReferenceMetadata,
  debug: boolean,
): string {
  const prevRequest = importStringRequest;
  // The debug channel cannot reference string rows in the main stream.
  importStringRequest = __DEV__ && debug ? null : request;
  try {
    // $FlowFixMe[incompatible-type] stringify can return null
    return stringify(clientReferenceMetadata, importMetadataReplacer);
  } finally {
    importStringRequest = prevRequest;
  }
}

function transformImportMetadata(
  request: Request,
  value: mixed,
  depth: number,
): mixed {
  switch (typeof value) {
    case 'string':
      return serializeImportString(request, value);
    case 'number':
    case 'boolean':
    case 'undefined':
      return value;
    case 'object': {
      if (value === null) {
        return null;
      }
      if (depth > MAX_IMPORT_METADATA_DEPTH) {
        return NOT_PLAIN_IMPORT_METADATA;
      }
      const object = value as {+[string]: mixed};
      if (typeof object.toJSON === 'function') {
        return NOT_PLAIN_IMPORT_METADATA;
      }
      if (isArray(value)) {
        const length = value.length;
        const copy: Array<mixed> = new Array(length);
        for (let i = 0; i < length; i++) {
          const element = value[i];
          if (typeof element === 'string') {
            copy[i] = serializeImportString(request, element);
            continue;
          }
          const child = transformImportMetadata(request, element, depth + 1);
          if (child === NOT_PLAIN_IMPORT_METADATA) {
            return NOT_PLAIN_IMPORT_METADATA;
          }
          copy[i] = child;
        }
        return copy;
      }
      const proto = getPrototypeOf(value);
      if (proto !== ObjectPrototype && proto !== null) {
        return NOT_PLAIN_IMPORT_METADATA;
      }
      const keys = Object.keys(value);
      const copy: {[string]: mixed} = {};
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key in ObjectPrototype) {
          // The copy inherits from Object.prototype, so assigning this key would
          // hit an accessor like __proto__ or, if the prototype is frozen, throw.
          return NOT_PLAIN_IMPORT_METADATA;
        }
        const element = object[key];
        if (typeof element === 'string') {
          copy[key] = serializeImportString(request, element);
          continue;
        }
        const child = transformImportMetadata(request, element, depth + 1);
        if (child === NOT_PLAIN_IMPORT_METADATA) {
          return NOT_PLAIN_IMPORT_METADATA;
        }
        copy[key] = child;
      }
      return copy;
    }
    default:
      return NOT_PLAIN_IMPORT_METADATA;
  }
}

function stringifyImportMetadata(
  request: Request,
  clientReferenceMetadata: ClientReferenceMetadata,
  debug: boolean,
): string {
  if (!(__DEV__ && debug)) {
    const copy = transformImportMetadata(request, clientReferenceMetadata, 0);
    if (copy !== NOT_PLAIN_IMPORT_METADATA) {
      // $FlowFixMe[incompatible-type] stringify can return null
      return stringify(copy);
    }
  }
  return stringifyImportMetadataWithReplacer(
    request,
    clientReferenceMetadata,
    debug,
  );
}

function serializeClientReference(
  request: Request,
  task: Task,
  parent: ModelParent,
  parentPropertyName: string,
  clientReference: ClientReference<any>,
): string {
  const clientReferenceKey = getClientReferenceKey(clientReference);
  const writtenClientReferences = request.writtenClientReferences;
  const existingId = writtenClientReferences.get(clientReferenceKey);
  if (existingId !== undefined) {
    if (parent[0] === REACT_ELEMENT_TYPE && parentPropertyName === '1') {
      return serializeLazyID(existingId);
    }
    return serializeByValueID(existingId);
  }
  const clientReferenceMetadata: ClientReferenceMetadata =
    resolveClientReferenceMetadata(request.bundlerConfig, clientReference);
  const json = stringifyImportMetadata(request, clientReferenceMetadata, false);
  request.pendingChunks++;
  const importId = request.nextChunkId++;
  emitImportChunk(request, importId, json);
  writtenClientReferences.set(clientReferenceKey, importId);
  if (parent[0] === REACT_ELEMENT_TYPE && parentPropertyName === '1') {
    return serializeLazyID(importId);
  }
  return serializeByValueID(importId);
}

function emitImportChunk(request: Request, id: number, json: string): void {
  const row = id.toString(16) + ':I' + json + '\n';
  const processedChunk = stringToChunk(row);
  request.completedImportChunks.push(processedChunk);
}

function emitHintChunk<Code: HintCode>(
  request: Request,
  code: Code,
  model: HintModel<Code>,
): void {
  const json: string = JSON.stringify(model);
  const row = ':H' + code + json + '\n';
  const processedChunk = stringToChunk(row);
  request.completedHintChunks.push(processedChunk);
}

function emitHint<Code: HintCode>(
  request: Request,
  code: Code,
  model: HintModel<Code>,
): void {
  emitHintChunk(request, code, model);
  enqueueFlush(request);
}

function enqueueFlush(request: Request): void {
  if (!request.flushScheduled && request.destination !== null) {
    request.flushScheduled = true;
    scheduleWork(() => {
      request.flushScheduled = false;
      flushCompletedChunks(request);
    });
  }
}

function cleanupInput(request: Request): void {
  const unsubscribe = request.inputUnsubscribe;
  request.inputUnsubscribe = noop;
  unsubscribe();
}

function subscribeInput(request: Request): void {
  request.inputUnsubscribe = request.input.subscribe({
    hint(code, model) {
      try {
        emitHint(request, code, model);
      } catch (error) {
        fatalError(request, error);
      }
    },
    complete() {
      request.pendingChunks--;
      enqueueFlush(request);
    },
  });
}

function fatalError(request: Request, error: mixed): void {
  cleanupInput(request);
  const destination = request.destination;
  if (destination !== null) {
    request.status = CLOSED;
    closeWithError(destination, error);
  } else {
    request.status = CLOSING;
    request.fatalError = error;
  }
}

function flushCompletedChunks(request: Request): void {
  const destination = request.destination;
  if (destination === null || request.status === CLOSED) {
    return;
  }
  beginWriting(destination);
  try {
    const importsChunks = request.completedImportChunks;
    let i = 0;
    for (; i < importsChunks.length; i++) {
      request.pendingChunks--;
      const keepWriting = writeChunkAndReturn(destination, importsChunks[i]);
      if (!keepWriting) {
        request.destination = null;
        i++;
        break;
      }
    }
    importsChunks.splice(0, i);
    const hintChunks = request.completedHintChunks;
    i = 0;
    for (; i < hintChunks.length; i++) {
      const keepWriting = writeChunkAndReturn(destination, hintChunks[i]);
      if (!keepWriting) {
        request.destination = null;
        i++;
        break;
      }
    }
    hintChunks.splice(0, i);
    const regularChunks = request.completedRegularChunks;
    i = 0;
    for (; i < regularChunks.length; i++) {
      request.pendingChunks--;
      const keepWriting = writeChunkAndReturn(destination, regularChunks[i]);
      if (!keepWriting) {
        request.destination = null;
        i++;
        break;
      }
    }
    regularChunks.splice(0, i);
  } finally {
    completeWriting(destination);
  }
  flushBuffered(destination);
  if (request.pendingChunks === 0 && request.destination !== null) {
    const currentDestination = request.destination;
    request.status = CLOSED;
    cleanupInput(request);
    request.destination = null;
    close(currentDestination);
  }
}

function subscribeToInput(
  request: Request,
  input: Input,
  rootTask: Task,
): void {
  request.pendingChunks++;
  subscribeInput(request);
  input.root.then(
    model => {
      if (request.status === CLOSED) {
        return;
      }
      rootTask.model = model;
      pingTask(request, rootTask);
    },
    error => fatalError(request, error),
  );
}

export function startWork(request: Request): void {
  scheduleMicrotask(() => performWork(request));
}

export function startFlowing(request: Request, destination: Destination): void {
  if (request.status === CLOSING) {
    request.status = CLOSED;
    closeWithError(destination, request.fatalError);
    return;
  }
  if (request.status === CLOSED || request.destination !== null) {
    return;
  }
  request.destination = destination;
  try {
    flushCompletedChunks(request);
  } catch (error) {
    fatalError(request, error);
  }
}

export function stopFlowing(request: Request): void {
  request.destination = null;
}

export function abort(request: Request, reason: mixed): void {
  if (request.status !== CLOSED) {
    fatalError(request, reason);
  }
}
