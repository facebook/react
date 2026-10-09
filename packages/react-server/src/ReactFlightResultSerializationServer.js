/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ResultModel} from 'shared/ReactFlightResultModel';
import type {ErrorReference} from 'shared/ReactFlightResult';
import type {ReactStackTrace, ReactKey} from 'shared/ReactTypes';
import {describeObjectForErrorMessage} from 'shared/ReactSerializationErrors';
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
import {REACT_ELEMENT_TYPE, REACT_LAZY_TYPE} from 'shared/ReactSymbols';
import type {LazyComponent} from 'react/src/ReactLazy';
import isArray from 'shared/isArray';
import hasOwnProperty from 'shared/hasOwnProperty';
import noop from 'shared/noop';
import {
  isClientReference,
  getClientReferenceKey,
  resolveClientReferenceMetadata,
  parseStackTrace,
  supportsRequestStorage,
  cacheStorage,
  requestStorage,
} from './ReactFlightServerConfig';
import {setCurrentCache} from './flight/ReactFlightCurrentCache';

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
const RENDERING = 6;

type Task = {
  id: number,
  model: ReactClientValue,
  status: 0 | 1 | 4 | 6,
};
export type InputThenableReader = {
  resolve: ReactClientValue => void,
  reject: (mixed, void | ErrorReference) => void,
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
  subscribeToThenable: (
    ResultModel<ReactClientValue>,
    InputThenableReader,
  ) => () => void,
};
export type Request = {
  input: null | Input,
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
  bundlerConfig: ClientManifest,
  writtenClientReferences: Map<ClientReferenceKey, number>,
  writtenImportStrings: Map<string, string>,
  writtenImportStringsSize: number,
  completedImportChunks: Array<Chunk>,
  writtenModels: WeakMap<Object, number>,
  inputSubscriptions: Set<() => void>,
  writtenSymbols: Map<symbol, number>,
  writtenErrors: WeakMap<ErrorReference, number>,
  completedErrorChunks: Array<Chunk>,
  onError: mixed => ?string,
};

function RequestInstance(
  this: any,
  input: Input,
  bundlerConfig: ClientManifest,
  onError: void | (mixed => ?string),
) {
  this.input = input;
  this.destination = null;
  this.status = OPENING;
  this.fatalError = null;
  this.completedRegularChunks = [];
  this.completedHintChunks = [];
  this.flushScheduled = false;
  this.bundlerConfig = bundlerConfig;
  this.writtenClientReferences = new Map();
  this.writtenImportStrings = new Map();
  this.writtenImportStringsSize = 0;
  this.completedImportChunks = [];
  this.writtenModels = new WeakMap();
  this.inputSubscriptions = new Set();
  this.writtenSymbols = new Map();
  this.writtenErrors = new WeakMap();
  this.completedErrorChunks = [];
  this.onError = onError === undefined ? defaultErrorHandler : onError;
  this.pendingChunks = 0;
  this.nextChunkId = 0;
  this.abortableTasks = new Set();
  this.pingedTasks = [];
  const rootTask = createTask(this, null, this.abortableTasks);
  subscribeToInput(this, input, rootTask);
}

function defaultErrorHandler(error: mixed): void {
  console['error'](error);
}

export function createRequest(
  input: Input,
  bundlerConfig: ClientManifest,
  onError?: mixed => ?string,
): Request {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new RequestInstance(input, bundlerConfig, onError);
}

function renderClientElement(
  type: any,
  key: ReactKey,
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
    if ((value as any).$$typeof === REACT_LAZY_TYPE) {
      const lazy: LazyComponent<ReactClientValue, any> = value as any;
      return serializeLazyID(serializeThenable(request, lazy._payload));
    }
    if (typeof (value as any).then === 'function') {
      return serializePromiseID(serializeThenable(request, value as any));
    }
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
  if (typeof value === 'symbol') {
    const writtenSymbols = request.writtenSymbols;
    const existingId = writtenSymbols.get(value);
    if (existingId !== undefined) {
      return serializeByValueID(existingId);
    }
    // $FlowFixMe[incompatible-type] `description` might be undefined
    const name: string = value.description;
    request.pendingChunks++;
    const symbolId = request.nextChunkId++;
    emitSymbolChunk(request, symbolId, name);
    writtenSymbols.set(value, symbolId);
    return serializeByValueID(symbolId);
  }
  throw new Error('Not implemented.');
}

function renderModel(
  request: Request,
  task: Task,
  parent: ModelParent,
  key: string,
  value: ReactClientValue,
): ReactJSONValue {
  try {
    return renderModelDestructive(request, task, parent, key, value);
  } catch (thrownValue) {
    const model = task.model;
    const wasReactNode =
      typeof model === 'object' &&
      model !== null &&
      ((model as any).$$typeof === REACT_ELEMENT_TYPE ||
        (model as any).$$typeof === REACT_LAZY_TYPE);
    request.pendingChunks++;
    const errorId = request.nextChunkId++;
    const digest = logRecoverableError(request, thrownValue);
    emitErrorChunk(request, errorId, digest, thrownValue);
    return wasReactNode
      ? serializeLazyID(errorId)
      : serializeByValueID(errorId);
  }
}

function resolveModel(
  request: Request,
  task: Task,
  parent: ModelParent,
  parentPropertyName: string,
  value: ReactClientValue,
): ReactJSONValue {
  const rendered = renderModel(
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
  task.status = RENDERING;
  try {
    const model = task.model;
    const resolvedModel = resolveModel(request, task, {'': model}, '', model);
    const json = JSON.stringify(resolvedModel);
    emitModelChunk(request, task.id, json);
    task.status = COMPLETED;
    request.abortableTasks.delete(task);
  } catch (error) {
    try {
      erroredTask(request, task, error);
    } catch (fatal) {
      fatalError(request, fatal);
    }
  }
}

function performWork(request: Request): void {
  if (request.status === CLOSED || request.status === CLOSING) {
    return;
  }
  try {
    const pingedTasks = request.pingedTasks;
    request.pingedTasks = [];
    for (let i = 0; i < pingedTasks.length; i++) {
      retryTask(request, pingedTasks[i]);
      if (request.status === CLOSED || request.status === CLOSING) {
        return;
      }
    }
    flushCompletedChunks(request);
  } catch (error) {
    fatalError(request, error);
  }
}

function pingTask(request: Request, task: Task): void {
  if (request.status === CLOSED || task.status !== PENDING) {
    return;
  }
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

function serializePromiseID(id: number): string {
  return '$@' + id.toString(16);
}

function serializeSymbolReference(name: string): string {
  return '$S' + name;
}

function emitSymbolChunk(request: Request, id: number, name: string): void {
  const symbolReference = serializeSymbolReference(name);
  const processedChunk = encodeReferenceChunk(request, id, symbolReference);
  request.completedImportChunks.push(processedChunk);
}

function encodeReferenceChunk(
  request: Request,
  id: number,
  reference: string,
): Chunk {
  const json = JSON.stringify(reference);
  const row = id.toString(16) + ':' + json + '\n';
  return stringToChunk(row);
}

function subscribeToThenable(
  request: Request,
  task: Task,
  thenable: ResultModel<ReactClientValue>,
): void {
  const input = request.input;
  if (input === null) {
    return;
  }
  subscribeInput(request, detach =>
    input.subscribeToThenable(thenable, {
      resolve(value) {
        detach();
        if (request.status === OPENING && task.status === PENDING) {
          task.model = value;
          pingTask(request, task);
        }
      },
      reject(error, reference) {
        detach();
        if (request.status === OPENING && task.status === PENDING) {
          try {
            erroredInputTask(request, task, error, reference);
            enqueueFlush(request);
          } catch (fatal) {
            fatalError(request, fatal);
          }
        }
      },
    }),
  );
}

function subscribeInput(
  request: Request,
  subscribe: (detach: () => void) => () => void,
): void {
  let unsubscribe = noop;
  let active = true;
  function detach(): void {
    active = false;
    request.inputSubscriptions.delete(detach);
    unsubscribe();
  }
  request.inputSubscriptions.add(detach);
  unsubscribe = subscribe(detach);
  if (!active || request.status > OPENING) {
    detach();
  }
}

function serializeThenable(
  request: Request,
  thenable: ResultModel<ReactClientValue>,
): number {
  const existingId = request.writtenModels.get(thenable);
  if (existingId !== undefined) {
    return existingId;
  }
  const newTask = createTask(request, null, request.abortableTasks);
  request.writtenModels.set(thenable, newTask.id);
  subscribeToThenable(request, newTask, thenable);
  return newTask.id;
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
  try {
    const clientReferenceMetadata: ClientReferenceMetadata =
      resolveClientReferenceMetadata(request.bundlerConfig, clientReference);
    const json = stringifyImportMetadata(
      request,
      clientReferenceMetadata,
      false,
    );
    request.pendingChunks++;
    const importId = request.nextChunkId++;
    emitImportChunk(request, importId, json);
    writtenClientReferences.set(clientReferenceKey, importId);
    if (parent[0] === REACT_ELEMENT_TYPE && parentPropertyName === '1') {
      return serializeLazyID(importId);
    }
    return serializeByValueID(importId);
  } catch (error) {
    request.pendingChunks++;
    const errorId = request.nextChunkId++;
    const digest = logRecoverableError(request, error);
    emitErrorChunk(request, errorId, digest, error);
    return serializeByValueID(errorId);
  }
}

function emitImportChunk(request: Request, id: number, json: string): void {
  const row = id.toString(16) + ':I' + json + '\n';
  const processedChunk = stringToChunk(row);
  request.completedImportChunks.push(processedChunk);
}

function logRecoverableError(request: Request, error: mixed): string {
  const prevCache = setCurrentCache(null);
  let errorDigest;
  try {
    const onError = request.onError;
    // $FlowFixMe[constant-condition]
    if (supportsRequestStorage) {
      errorDigest = cacheStorage.run(undefined, () =>
        requestStorage.run(undefined, onError, error),
      );
    } else {
      errorDigest = onError(error);
    }
  } finally {
    setCurrentCache(prevCache);
  }
  if (errorDigest != null && typeof errorDigest !== 'string') {
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      `onError returned something with a type other than "string". onError should return a string and may return null or undefined but must not return anything else. It received something of type "${typeof errorDigest}" instead`,
    );
  }
  return errorDigest || '';
}

function erroredTask(request: Request, task: Task, error: mixed): void {
  task.status = ERRORED;
  request.abortableTasks.delete(task);
  const digest = logRecoverableError(request, error);
  emitErrorChunk(request, task.id, digest, error);
}

function erroredInputTask(
  request: Request,
  task: Task,
  error: mixed,
  reference: void | ErrorReference,
): void {
  if (reference === undefined) {
    erroredTask(request, task, error);
    return;
  }
  task.status = ERRORED;
  request.abortableTasks.delete(task);
  const existingId = request.writtenErrors.get(reference);
  if (existingId === undefined) {
    request.writtenErrors.set(reference, task.id);
    emitErrorChunk(request, task.id, reference.digest, error);
  } else {
    const ref = serializeByValueID(existingId);
    request.completedErrorChunks.push(
      encodeReferenceChunk(request, task.id, ref),
    );
  }
}

function emitErrorChunk(
  request: Request,
  id: number,
  digest: string,
  error: mixed,
): void {
  let errorInfo;
  if (__DEV__) {
    let name = 'Error';
    let message;
    let stack: ReactStackTrace;
    let env = 'Server';
    try {
      if (error instanceof Error) {
        name = error.name;
        // eslint-disable-next-line react-internal/safe-string-coercion
        message = String(error.message);
        stack = parseStackTrace(error, 0);
        const errorEnv = (error as any).environmentName;
        if (typeof errorEnv === 'string') {
          env = errorEnv;
        }
      } else if (typeof error === 'object' && error !== null) {
        message = describeObjectForErrorMessage(error);
        stack = [];
      } else {
        // eslint-disable-next-line react-internal/safe-string-coercion
        message = String(error);
        stack = [];
      }
    } catch (x) {
      message = 'An error occurred but serializing the error message failed.';
      stack = [];
    }
    errorInfo = {digest, name, message, stack, env, owner: null};
  } else {
    errorInfo = {digest};
  }
  const row = id.toString(16) + ':E' + JSON.stringify(errorInfo) + '\n';
  request.completedErrorChunks.push(stringToChunk(row));
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
  request.input = null;
  request.inputSubscriptions.forEach(detach => detach());
  request.inputSubscriptions.clear();
}

function subscribeHints(request: Request): void {
  const input = request.input;
  if (input === null) {
    return;
  }
  subscribeInput(request, detach =>
    input.subscribe({
      hint(code, model) {
        try {
          emitHint(request, code, model);
        } catch (error) {
          fatalError(request, error);
        }
      },
      complete() {
        detach();
        request.pendingChunks--;
        enqueueFlush(request);
      },
    }),
  );
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
    const errorChunks = request.completedErrorChunks;
    i = 0;
    for (; i < errorChunks.length; i++) {
      request.pendingChunks--;
      const keepWriting = writeChunkAndReturn(destination, errorChunks[i]);
      if (!keepWriting) {
        request.destination = null;
        i++;
        break;
      }
    }
    errorChunks.splice(0, i);
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
  subscribeHints(request);
  if (request.status > OPENING) {
    return;
  }
  subscribeToThenable(request, rootTask, input.root);
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
