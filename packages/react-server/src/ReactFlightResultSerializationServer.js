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
  ServerReferenceMetadata,
  ErrorReference,
  ModelReference,
} from 'shared/ReactFlightResult';
import type {
  ReactStackTrace,
  ReactKey,
  ReactFunctionLocation,
} from 'shared/ReactTypes';
import {
  MODEL_KIND_MASK,
  MODEL_OBJECT,
  MODEL_ARRAY,
  MODEL_ELEMENT,
} from 'shared/ReactFlightResult';
import {describeObjectForErrorMessage} from 'shared/ReactSerializationErrors';
import type {
  ReactClientValue,
  ReactClientObject,
} from './ReactFlightResultServer';
import type {ReactElement} from 'shared/ReactElementType';
import type {Chunk, BinaryChunk, Destination} from './ReactServerStreamConfig';
import type {HintCode, HintModel} from './ReactFlightResultServerConfig';
import type {
  ClientManifest,
  ClientReference,
  ClientReferenceKey,
  ClientReferenceMetadata,
  ServerReference,
  ServerReferenceId,
} from './ReactFlightServerConfig';
import {
  beginWriting,
  writeChunk,
  writeChunkAndReturn,
  typedArrayToBinaryChunk,
  byteLengthOfBinaryChunk,
  completeWriting,
  flushBuffered,
  close,
  closeWithError,
  stringToChunk,
  byteLengthOfChunk,
  scheduleMicrotask,
  scheduleWork,
} from './ReactServerStreamConfig';
import {
  REACT_ELEMENT_TYPE,
  REACT_LAZY_TYPE,
  getIteratorFn,
} from 'shared/ReactSymbols';
import type {LazyComponent} from 'react/src/ReactLazy';
import isArray from 'shared/isArray';
import hasOwnProperty from 'shared/hasOwnProperty';
import noop from 'shared/noop';
import type {TemporaryReferenceSet} from './ReactFlightServerTemporaryReferences';
import {resolveTemporaryReference} from './ReactFlightServerTemporaryReferences';
import {
  enableFlightWeakThenables,
  enableTaint,
  enableFlightObjectReferences,
} from 'shared/ReactFeatureFlags';
import ReactSharedInternals from './ReactSharedInternalsServer';
import binaryToComparableString from 'shared/binaryToComparableString';
import {
  isClientReference,
  isServerReference,
  getServerReferenceId,
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
const OPEN = 11;
const ABORTING = 12;
const CLOSING = 13;
const CLOSED = 14;
const NEXT_TWO_CHUNKS_ARE_ATOMIC: symbol = Symbol();
const PENDING = 0;
const COMPLETED = 1;
const ABORTED = 3;
const ERRORED = 4;
const RENDERING = 6;

type Task = {
  id: number,
  model: ReactClientValue,
  status: 0 | 1 | 3 | 4 | 6,
  returnedTupleReference: null | string,
};
export type InputSequenceEntry = {done?: boolean, value: ReactClientValue};
export type InputSequenceReader = {
  progress: InputSequenceEntry => void,
  error: (mixed, void | ErrorReference) => void,
  rejectEntry: (mixed, void | ErrorReference) => void,
  halt: () => void,
};

export type InputAsyncIterableReader = {
  enqueue: (Promise<ReactClientValue>, boolean) => void,
  close: () => void,
  error: (mixed, void | ErrorReference) => void,
  halt: () => void,
};

export type InputThenableReader = {
  halt: () => void,
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
  getReadableStream: Object => void | {
    isByteStream: boolean,
    subscribe: InputSequenceReader => () => void,
  },
  getAsyncIterable: Object => void | {
    isIterator: boolean,
    subscribe: InputAsyncIterableReader => () => void,
  },
  getIteratorEntries: Object => void | $ReadOnlyArray<mixed>,
  temporaryReferences: void | TemporaryReferenceSet,
  getServerReference: Object => void | ServerReferenceMetadata,
  getValueReference: Object => void | ModelReference,
  getModelInfo: Object => number,
  getCollectionEntries: Object => void | ResultModel<Array<any>>,
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
  status: 10 | 11 | 12 | 13 | 14,
  abortController: AbortController,
  fatalError: mixed,
  completedRegularChunks: Array<
    Chunk | BinaryChunk | typeof NEXT_TWO_CHUNKS_ARE_ATOMIC,
  >,
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
  writtenServerReferences: Map<ServerReference<any>, number>,
  temporaryReferences: void | TemporaryReferenceSet,
  completedImportChunks: Array<Chunk>,
  writtenModels: WeakMap<Object, number>,
  writtenObjects: WeakMap<Object, string>,
  inputSubscriptions: Set<() => void>,
  writtenSymbols: Map<symbol, number>,
  writtenErrors: WeakMap<ErrorReference, number>,
  completedErrorChunks: Array<Chunk>,
  onError: mixed => ?string,
  taintCleanupQueue: Array<string | bigint>,
};

const {
  TaintRegistryObjects,
  TaintRegistryValues,
  TaintRegistryByteLengths,
  TaintRegistryPendingRequests,
} = ReactSharedInternals;

function throwTaintViolation(message: string) {
  // eslint-disable-next-line react-internal/prod-error-codes
  throw new Error(message);
}

function cleanupTaintQueue(request: Request): void {
  const cleanupQueue = request.taintCleanupQueue;
  TaintRegistryPendingRequests.delete(cleanupQueue);
  for (let i = 0; i < cleanupQueue.length; i++) {
    const entryValue = cleanupQueue[i];
    const entry = TaintRegistryValues.get(entryValue);
    if (entry !== undefined) {
      if (entry.count === 1) {
        TaintRegistryValues.delete(entryValue);
      } else {
        entry.count--;
      }
    }
  }
  cleanupQueue.length = 0;
}

function RequestInstance(
  this: any,
  input: Input,
  bundlerConfig: ClientManifest,
  onError: void | (mixed => ?string),
  temporaryReferences: void | TemporaryReferenceSet,
) {
  const cleanupQueue: Array<string | bigint> = [];
  if (enableTaint) {
    TaintRegistryPendingRequests.add(cleanupQueue);
  }
  this.taintCleanupQueue = cleanupQueue;
  this.temporaryReferences = input.temporaryReferences || temporaryReferences;
  this.writtenServerReferences = new Map();
  this.input = input;
  this.abortController = new AbortController();
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
  this.writtenObjects = new WeakMap();
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
  temporaryReferences?: TemporaryReferenceSet,
): Request {
  // $FlowFixMe[invalid-constructor] Flow doesn't support functions as constructors
  return new RequestInstance(
    input,
    bundlerConfig,
    onError,
    temporaryReferences,
  );
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

let modelRoot: null | ReactClientValue = null;
// Approximate string length of the currently serializing row.
// Used to power outlining heuristics.
let serializedSize = 0;
const MAX_ROW_SIZE = 3200;

function deferTask(request: Request, task: Task): ReactJSONValue {
  // The item is scheduled to be serialized after its parent in the stream.
  const newTask = createTask(
    request,
    task.model, // the currently rendering element
    request.abortableTasks,
  );
  if (typeof task.model === 'object' && task.model !== null) {
    // This defining occurrence moves to the new row; aliases must follow it.
    request.writtenObjects.set(task.model, serializeByValueID(newTask.id));
  }

  pingTask(request, newTask);
  return serializeLazyID(newTask.id);
}

function outlineModel(request: Request, value: ReactClientValue): number {
  const task = createTask(request, value, request.abortableTasks);
  if (value !== null && typeof value === 'object') {
    request.writtenObjects.set(value, serializeByValueID(task.id));
  }
  retryTask(request, task);
  return task.id;
}

function renderObjectReference(
  request: Request,
  task: Task,
  parent: ModelParent,
  key: string,
  value: Object,
  parentReference?: null | string,
): null | string {
  const writtenObjects = request.writtenObjects;
  const existingReference = writtenObjects.get(value);
  if (existingReference !== undefined) {
    if (modelRoot === value) {
      if (existingReference !== serializeByValueID(task.id)) {
        return existingReference;
      }
      modelRoot = null;
    } else {
      return existingReference;
    }
  } else if (key.indexOf(':') !== -1) {
    return serializeByValueID(outlineModel(request, value));
  } else {
    if (parentReference === undefined) {
      parentReference = writtenObjects.get(parent);
    }
    if (parentReference != null) {
      let propertyName = key;
      if (isArray(parent) && parent[0] === REACT_ELEMENT_TYPE) {
        switch (key) {
          case '1':
            propertyName = 'type';
            break;
          case '2':
            propertyName = 'key';
            break;
          case '3':
            propertyName = 'props';
            break;
          case '4':
            propertyName = '_owner';
            break;
        }
      }
      writtenObjects.set(value, parentReference + ':' + propertyName);
    }
  }
  return null;
}

function renderModelDestructive(
  request: Request,
  task: Task,
  parent: ModelParent,
  parentPropertyName: string,
  value: ReactClientValue,
  parentReference?: null | string,
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
  if (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function')
  ) {
    if (
      (typeof value === 'function' || enableFlightObjectReferences) &&
      isServerReference(value)
    ) {
      return serializeServerReference(request, value as any);
    }
    if (request.temporaryReferences !== undefined) {
      const reference = resolveTemporaryReference(
        request.temporaryReferences,
        value as any,
      );
      if (reference !== undefined) {
        return '$T' + reference;
      }
    }
  }
  if (value === null) {
    return null;
  }
  if (typeof value === 'object') {
    if (enableTaint) {
      const tainted = TaintRegistryObjects.get(value);
      if (tainted !== undefined) {
        throwTaintViolation(tainted);
      }
    }
    const input = request.input;
    const reference =
      input === null ? undefined : input.getValueReference(value);
    if (reference !== undefined) {
      const id = serializeThenable(request, reference.root);
      const path = [];
      let location = reference;
      let ancestor = location.parent;
      while (ancestor !== null) {
        path.push(location.key);
        location = ancestor;
        ancestor = location.parent;
      }
      let name = serializeByValueID(id);
      for (let i = path.length - 1; i >= 0; i--) {
        name += ':' + path[i];
      }
      return name;
    }
    const kind =
      input === null ? 0 : input.getModelInfo(value) & MODEL_KIND_MASK;
    if (
      kind === MODEL_OBJECT ||
      kind === MODEL_ARRAY ||
      kind === MODEL_ELEMENT ||
      (kind === 0 &&
        (isArray(value) ||
          (value as any).$$typeof === REACT_ELEMENT_TYPE ||
          value instanceof Map ||
          value instanceof Set ||
          (typeof FormData === 'function' && value instanceof FormData) ||
          (typeof Blob === 'function' && value instanceof Blob) ||
          value instanceof ArrayBuffer ||
          ArrayBuffer.isView(value) ||
          (input !== null &&
            (input.getReadableStream(value) !== undefined ||
              input.getAsyncIterable(value) !== undefined ||
              input.getIteratorEntries(value) !== undefined)) ||
          getPrototypeOf(value) === ObjectPrototype))
    ) {
      const objectReference = renderObjectReference(
        request,
        task,
        parent,
        parentPropertyName,
        value,
        parentReference,
      );
      if (objectReference !== null) {
        return objectReference;
      }
    }
    if (kind === MODEL_OBJECT || kind === MODEL_ARRAY) {
      return value as any;
    }
    if ((value as any).$$typeof === REACT_LAZY_TYPE) {
      const lazy: LazyComponent<ReactClientValue, any> = value as any;
      return serializeLazyID(serializeThenable(request, lazy._payload));
    }
    if (typeof (value as any).then === 'function') {
      const id = serializeThenable(request, value as any);
      return enableFlightWeakThenables &&
        (value as any).status === 'pending_weak'
        ? serializeWeakPromiseID(id)
        : serializePromiseID(id);
    }
    if (value instanceof Date) {
      return serializeDate(value);
    }
    if (
      kind === MODEL_ELEMENT ||
      (value as any).$$typeof === REACT_ELEMENT_TYPE
    ) {
      const element: ReactElement = value as any;
      if (serializedSize > MAX_ROW_SIZE) {
        return deferTask(request, task);
      }
      const tuple = renderClientElement(
        element.type,
        element.key,
        element.props,
        __DEV__ ? element._store.validated : 0,
      );
      const elementReference = request.writtenObjects.get(value);
      if (!__DEV__) {
        task.returnedTupleReference =
          elementReference === undefined ? null : elementReference;
      } else if (elementReference !== undefined) {
        request.writtenObjects.set(tuple as any, elementReference);
      }
      return tuple;
    }
    if (value instanceof Map) {
      return serializeMap(request, value);
    }
    if (value instanceof Set) {
      return serializeSet(request, value);
    }
    if (value instanceof ArrayBuffer) {
      return serializeTypedArray(request, 'A', new Uint8Array(value));
    }
    if (value instanceof Int8Array) {
      // char
      return serializeTypedArray(request, 'O', value);
    }
    if (value instanceof Uint8Array) {
      // unsigned char
      return serializeTypedArray(request, 'o', value);
    }
    if (value instanceof Uint8ClampedArray) {
      // unsigned clamped char
      return serializeTypedArray(request, 'U', value);
    }
    if (value instanceof Int16Array) {
      // sort
      return serializeTypedArray(request, 'S', value);
    }
    if (value instanceof Uint16Array) {
      // unsigned short
      return serializeTypedArray(request, 's', value);
    }
    if (value instanceof Int32Array) {
      // long
      return serializeTypedArray(request, 'L', value);
    }
    if (value instanceof Uint32Array) {
      // unsigned long
      return serializeTypedArray(request, 'l', value);
    }
    if (value instanceof Float32Array) {
      // float
      return serializeTypedArray(request, 'G', value);
    }
    if (value instanceof Float64Array) {
      // double
      return serializeTypedArray(request, 'g', value);
    }
    if (value instanceof BigInt64Array) {
      // number
      return serializeTypedArray(request, 'M', value);
    }
    if (value instanceof BigUint64Array) {
      // unsigned number
      // We use "m" instead of "n" since JSON can start with "null"
      return serializeTypedArray(request, 'm', value);
    }
    if (value instanceof DataView) {
      return serializeTypedArray(request, 'V', value);
    }
    if (typeof FormData === 'function' && value instanceof FormData) {
      return serializeFormData(request, value);
    }
    if (typeof Blob === 'function' && value instanceof Blob) {
      return serializeBlob(request, value);
    }
    if (isArray(value)) {
      return value as any;
    }
    const iteratorFn = getIteratorFn(value);
    if (iteratorFn) {
      const entries =
        input === null ? undefined : input.getIteratorEntries(value);
      if (entries === undefined) {
        // eslint-disable-next-line react-internal/prod-error-codes
        throw new Error('A Result must record iterators before serialization.');
      }
      return serializeIterator(request, entries as any);
    }
    if (input !== null && input.getReadableStream(value) !== undefined) {
      return serializeReadableStream(request, task, value);
    }
    if (input !== null && input.getAsyncIterable(value) !== undefined) {
      return serializeAsyncIterable(request, task, value);
    }
    return value as any;
  }
  if (typeof value === 'string') {
    if (enableTaint) {
      const tainted = TaintRegistryValues.get(value);
      if (tainted !== undefined) {
        throwTaintViolation(tainted.message);
      }
    }
    serializedSize += value.length;
    // $FlowFixMe[invalid-compare]
    if (value.length >= 1024 && byteLengthOfChunk !== null) {
      // For large strings, we encode them outside the JSON payload so that we
      // don't have to double encode and double parse the strings. This can also
      // be more compact in case the string has a lot of escaped characters.
      return serializeLargeTextString(request, value);
    }
    return escapeStringValue(value);
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
  if (typeof value === 'bigint') {
    if (enableTaint) {
      const tainted = TaintRegistryValues.get(value);
      if (tainted !== undefined) {
        throwTaintViolation(tainted.message);
      }
    }
    return serializeBigInt(value);
  }
  throw new Error('Not implemented.');
}

function renderModel(
  request: Request,
  task: Task,
  parent: ModelParent,
  key: string,
  value: ReactClientValue,
  parentReference?: null | string,
): ReactJSONValue {
  // First time we're serializing the key, we should add it to the size.
  serializedSize += key.length;

  try {
    return renderModelDestructive(
      request,
      task,
      parent,
      key,
      value,
      parentReference,
    );
  } catch (thrownValue) {
    const model = task.model;
    const kind =
      model !== null && typeof model === 'object' && request.input !== null
        ? request.input.getModelInfo(model) & MODEL_KIND_MASK
        : 0;
    const wasReactNode =
      typeof model === 'object' &&
      model !== null &&
      (kind === MODEL_ELEMENT ||
        (kind === 0 &&
          ((model as any).$$typeof === REACT_ELEMENT_TYPE ||
            (model as any).$$typeof === REACT_LAZY_TYPE)));
    if (request.status === ABORTING) {
      task.status = ABORTED;
      const errorId = request.fatalError as any;
      return wasReactNode
        ? serializeLazyID(errorId)
        : serializeByValueID(errorId);
    }
    request.pendingChunks++;
    const errorId = request.nextChunkId++;
    const digest = logRecoverableError(request, thrownValue);
    emitErrorChunk(request, errorId, digest, thrownValue);
    return wasReactNode
      ? serializeLazyID(errorId)
      : serializeByValueID(errorId);
  }
}

function serializeDate(date: Date): string {
  // JSON.stringify automatically calls Date.prototype.toJSON which calls toISOString.
  // We need only tack on a $D prefix.
  const dateJSON = date.toJSON();
  if (enableTaint && typeof dateJSON === 'string') {
    const tainted = TaintRegistryValues.get(dateJSON);
    if (tainted !== undefined) {
      throwTaintViolation(tainted.message);
    }
  }
  return '$D' + dateJSON;
}

function serializeBigInt(n: bigint): string {
  return '$n' + n.toString(10);
}

function resolveModel(
  request: Request,
  task: Task,
  parent: ModelParent,
  parentPropertyName: string,
  value: ReactClientValue,
  parentReference?: null | string,
): ReactJSONValue {
  const rendered = renderModel(
    request,
    task,
    parent,
    parentPropertyName,
    value,
    parentReference,
  );
  if (rendered === null || typeof rendered !== 'object') {
    return rendered;
  }
  if (isArray(rendered)) {
    // In production, only renderClientElement returns an array distinct from its input.
    if (!__DEV__ && rendered !== value) {
      return resolveElementTuple(
        request,
        task,
        rendered,
        task.returnedTupleReference,
      );
    }
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

function resolveElementTuple(
  request: Request,
  task: Task,
  tuple: Array<ReactClientValue>,
  tupleReference: null | string,
): Array<ReactClientValue> {
  // The fresh tuple is private. Keep its element marker intact until all fields
  // have used it to classify client types and lower type/props property paths.
  const marker = resolveModel(
    request,
    task,
    tuple,
    '0',
    tuple[0],
    tupleReference,
  );
  const type = resolveModel(
    request,
    task,
    tuple,
    '1',
    tuple[1],
    tupleReference,
  );
  const key = resolveModel(request, task, tuple, '2', tuple[2], tupleReference);
  const props = resolveModel(
    request,
    task,
    tuple,
    '3',
    tuple[3],
    tupleReference,
  );
  tuple[0] = marker;
  tuple[1] = type;
  tuple[2] = key;
  tuple[3] = props;
  return tuple;
}

function serializeLargeTextString(request: Request, text: string): string {
  request.pendingChunks++;
  const textId = request.nextChunkId++;
  emitTextChunk(request, textId, text);
  return serializeByValueID(textId);
}

function emitTextChunk(request: Request, id: number, text: string): void {
  // $FlowFixMe[invalid-compare]
  if (byteLengthOfChunk === null) {
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'Existence of byteLengthOfChunk should have already been checked. This is a bug in React.',
    );
  }
  request.pendingChunks++;
  const textChunk = stringToChunk(text);
  const binaryLength = byteLengthOfChunk(textChunk);
  const row = id.toString(16) + ':T' + binaryLength.toString(16) + ',';
  const headerChunk = stringToChunk(row);
  request.completedRegularChunks.push(
    NEXT_TWO_CHUNKS_ARE_ATOMIC,
    headerChunk,
    textChunk,
  );
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
    returnedTupleReference: null,
  };
  abortSet.add(task);
  return task;
}

function retryTask(request: Request, task: Task): void {
  if (task.status !== PENDING) {
    return;
  }
  task.status = RENDERING;
  // We stash the outer parent size so we can restore it when we exit.
  const parentSerializedSize = serializedSize;
  // We don't reset the serialized size counter from reentry because that indicates that we
  // are outlining a model and we actually want to include that size into the parent since
  // it will still block the parent row. It only restores to zero at the top of the stack.
  try {
    const model = task.model;
    modelRoot = model;
    if (
      model !== null &&
      typeof model === 'object' &&
      !request.writtenObjects.has(model)
    ) {
      request.writtenObjects.set(model, serializeByValueID(task.id));
    }
    const resolvedModel = resolveModel(request, task, {'': model}, '', model);
    const json = JSON.stringify(resolvedModel);
    emitModelChunk(request, task.id, json);
    task.status = COMPLETED;
    request.abortableTasks.delete(task);
  } catch (error) {
    if (request.status === ABORTING) {
      request.abortableTasks.delete(task);
      task.status = PENDING;
      const errorId: number = request.fatalError as any;
      abortTask(task, request, errorId);
      finishAbortedTask(task, request, errorId);
      return;
    }
    try {
      erroredTask(request, task, error);
    } catch (fatal) {
      fatalError(request, fatal);
    }
  } finally {
    serializedSize = parentSerializedSize;
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
      halt() {
        detach();
        if (task.status === PENDING) {
          haltTask(task, request);
          request.abortableTasks.delete(task);
          finishHaltedTask(task, request);
          enqueueFlush(request);
        }
      },
      resolve(value) {
        detach();
        if (request.status <= OPEN && task.status === PENDING) {
          task.model = value;
          pingTask(request, task);
        }
      },
      reject(error, reference) {
        detach();
        if (request.status <= OPEN && task.status === PENDING) {
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
  if (!active || request.status > OPEN) {
    detach();
  }
}

function serializeThenable(
  request: Request,
  thenable: ResultModel<ReactClientValue>,
): number {
  if (request.input === null) {
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error('Cannot serialize a detached Result.');
  }
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
  if (enableTaint) {
    cleanupTaintQueue(request);
  }
}

function subscribeHints(request: Request): void {
  const input = request.input;
  if (input === null) {
    return;
  }
  let sourceComplete = false;
  function completeInput(): void {
    if (!sourceComplete) {
      sourceComplete = true;
      request.pendingChunks--;
      enqueueFlush(request);
    }
  }
  request.abortController.signal.addEventListener(
    'abort',
    () => {
      completeInput();
      cleanupInput(request);
    },
    {once: true},
  );
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
        completeInput();
      },
    }),
  );
}

function fatalError(request: Request, error: mixed): void {
  request.abortController.abort(error);
  request.fatalError = error;
  cleanupInput(request);
  const destination = request.destination;
  if (destination !== null) {
    request.status = CLOSED;
    closeWithError(destination, error);
  } else {
    request.status = CLOSING;
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
      const item = regularChunks[i];
      let keepWriting: boolean;
      if (typeof item === 'symbol') {
        const headerChunk = regularChunks[i + 1];
        const contentChunk = regularChunks[i + 2];
        if (
          i + 2 >= regularChunks.length ||
          typeof headerChunk === 'symbol' ||
          typeof contentChunk === 'symbol'
        ) {
          throw new Error(
            'A chunk pair is incomplete. This is a bug in React.',
          );
        }
        request.pendingChunks -= 2;
        writeChunk(destination, headerChunk);
        keepWriting = writeChunkAndReturn(destination, contentChunk);
        i += 2;
      } else {
        request.pendingChunks--;
        keepWriting = writeChunkAndReturn(destination, item);
      }
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
    request.abortController.abort(
      new Error(
        'This render completed successfully. All cacheSignals are now aborted to allow clean up of any unused resources.',
      ),
    );
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
  if (request.status > OPEN) {
    return;
  }
  request.writtenModels.set(input.root, rootTask.id);
  subscribeToThenable(request, rootTask, input.root);
}

export function startWork(request: Request): void {
  scheduleMicrotask(() => performWork(request));
  scheduleWork(() => {
    if (request.status === OPENING) {
      request.status = OPEN;
    }
  });
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

function abortTask(task: Task, request: Request, errorId: number): void {
  if (task.status !== PENDING) {
    return;
  }
  task.status = ABORTED;
}

function finishAbortedTask(
  task: Task,
  request: Request,
  errorId: number,
): void {
  if (task.status !== ABORTED) {
    return;
  }
  const ref = serializeByValueID(errorId);
  const processedChunk = encodeReferenceChunk(request, task.id, ref);
  request.completedErrorChunks.push(processedChunk);
}

function haltTask(task: Task, request: Request): void {
  if (task.status !== PENDING) {
    return;
  }
  task.status = ABORTED;
}

function finishHaltedTask(task: Task, request: Request): void {
  if (task.status !== ABORTED) {
    return;
  }
  request.pendingChunks--;
}

function finishAbort(
  request: Request,
  abortedTasks: Set<Task>,
  errorId: number,
): void {
  try {
    abortedTasks.forEach(task => finishAbortedTask(task, request, errorId));
    flushCompletedChunks(request);
  } catch (error) {
    logRecoverableError(request, error);
    fatalError(request, error);
  }
}

export function attachAbortSignal(request: Request, signal: AbortSignal): void {
  if (signal.aborted) {
    abort(request, signal.reason);
    return;
  }
  signal.addEventListener(
    'abort',
    () => {
      abort(request, signal.reason);
    },
    {signal: request.abortController.signal},
  );
}

export function abort(request: Request, reason: mixed): void {
  if (request.status > OPEN) {
    return;
  }
  try {
    request.status = ABORTING;
    request.abortController.abort(reason);
    const abortableTasks = request.abortableTasks;
    if (abortableTasks.size > 0) {
      const error =
        reason === undefined
          ? new Error('The render was aborted by the server without a reason.')
          : typeof reason === 'object' &&
              reason !== null &&
              typeof reason.then === 'function'
            ? new Error('The render was aborted by the server with a promise.')
            : reason;
      const digest = logRecoverableError(request, error);
      const errorId = request.nextChunkId++;
      request.fatalError = errorId;
      request.pendingChunks++;
      emitErrorChunk(request, errorId, digest, error);
      abortableTasks.forEach(task => abortTask(task, request, errorId));
      scheduleWork(() => finishAbort(request, abortableTasks, errorId));
    } else {
      flushCompletedChunks(request);
    }
  } catch (error) {
    logRecoverableError(request, error);
    fatalError(request, error);
  }
}

function serializeMap(
  request: Request,
  map: Map<ReactClientValue, ReactClientValue>,
): string {
  const input = request.input;
  const model = input === null ? undefined : input.getCollectionEntries(map);
  if (model !== undefined) {
    const id = serializeThenable(request, model as any);
    return '$Q' + id.toString(16);
  }
  const entries = Array.from(map);
  const id = outlineModel(request, entries);
  return '$Q' + id.toString(16);
}

function serializeSet(request: Request, set: Set<ReactClientValue>): string {
  const input = request.input;
  const model = input === null ? undefined : input.getCollectionEntries(set);
  if (model !== undefined) {
    const id = serializeThenable(request, model as any);
    return '$W' + id.toString(16);
  }
  const entries = Array.from(set);
  const id = outlineModel(request, entries);
  return '$W' + id.toString(16);
}

function serializeTypedArray(
  request: Request,
  tag: string,
  typedArray: $ArrayBufferView,
): string {
  const bufferId = request.nextChunkId++;
  emitTypedArrayChunk(request, bufferId, tag, typedArray);
  request.pendingChunks++;
  return serializeByValueID(bufferId);
}

function emitTypedArrayChunk(
  request: Request,
  id: number,
  tag: string,
  typedArray: $ArrayBufferView,
): void {
  if (enableTaint) {
    if (TaintRegistryByteLengths.has(typedArray.byteLength)) {
      // If we have had any tainted values of this length, we check
      // to see if these bytes matches any entries in the registry.
      const tainted = TaintRegistryValues.get(
        binaryToComparableString(typedArray),
      );
      if (tainted !== undefined) {
        throwTaintViolation(tainted.message);
      }
    }
  }
  request.pendingChunks++;
  const bytes = new Uint8Array(
    new Uint8Array(
      typedArray.buffer,
      typedArray.byteOffset,
      typedArray.byteLength,
    ),
  );
  const binaryChunk = typedArrayToBinaryChunk(bytes);
  const binaryLength = byteLengthOfBinaryChunk(binaryChunk);
  const row = id.toString(16) + ':' + tag + binaryLength.toString(16) + ',';
  const headerChunk = stringToChunk(row);
  // Push a NEXT_TWO_CHUNKS_ARE_ATOMIC sentinel before the header so that
  // flushCompletedChunks can write the header and binary chunks atomically.
  // Otherwise, if the destination's backpressure flips between the two writes,
  // the content chunk would be stranded at the front of the queue and the next
  // drain would emit Import or Hint chunks between the header and the content —
  // and the Flight Client would frame those intervening bytes as this row's
  // content.
  request.completedRegularChunks.push(
    NEXT_TWO_CHUNKS_ARE_ATOMIC,
    headerChunk,
    binaryChunk,
  );
}

function serializeFormData(request: Request, formData: FormData): string {
  const entries = Array.from(formData.entries());
  const id = outlineModel(request, entries as any);
  return '$K' + id.toString(16);
}

function serializeBlob(request: Request, blob: Blob): string {
  const model: Array<string | Uint8Array> = [blob.type];
  const reader = blob.stream().getReader();
  const newTask = createTask(request, model, request.abortableTasks);

  function progress(
    entry: {done: false, value: Uint8Array} | {done: true, value: void},
  ): Promise<void> | void {
    if (newTask.status !== PENDING) {
      return;
    }
    if (entry.done) {
      request.abortController.signal.removeEventListener('abort', abortBlob);
      pingTask(request, newTask);
      return;
    }
    // TODO: Emit the chunk early and refer to it later by dedupe.
    model.push(entry.value);
    // $FlowFixMe[incompatible-type]
    return reader.read().then(progress).catch(error);
  }
  function error(reason: mixed) {
    if (newTask.status !== PENDING) {
      return;
    }
    request.abortController.signal.removeEventListener('abort', abortBlob);
    erroredTask(request, newTask, reason);
    enqueueFlush(request);
    // $FlowFixMe[incompatible-type] should be able to pass mixed
    // $FlowFixMe[incompatible-use]
    reader.cancel(reason).then(error, error);
  }
  function abortBlob() {
    if (newTask.status !== PENDING) {
      return;
    }
    const signal = request.abortController.signal;
    signal.removeEventListener('abort', abortBlob);
    const reason = signal.reason;
    // TODO: Make this use abortTask() instead.
    erroredTask(request, newTask, reason);
    enqueueFlush(request);
    // $FlowFixMe[incompatible-use] should be able to pass mixed
    reader.cancel(reason).then(error, error);
  }

  request.abortController.signal.addEventListener('abort', abortBlob);

  // $FlowFixMe[incompatible-type]
  reader.read().then(progress).catch(error);

  return '$B' + newTask.id.toString(16);
}

function serializeIterator(
  request: Request,
  entries: $ReadOnlyArray<ReactClientValue>,
): string {
  const id = outlineModel(request, entries);
  return '$i' + id.toString(16);
}

function serializeServerReference(
  request: Request,
  serverReference: ServerReference<any>,
): string {
  const isObjectReference =
    enableFlightObjectReferences && typeof serverReference === 'object';
  const writtenServerReferences = request.writtenServerReferences;
  const existingId = writtenServerReferences.get(serverReference);
  if (existingId !== undefined) {
    return isObjectReference
      ? serializeServerObjectReferenceID(existingId)
      : serializeServerReferenceID(existingId);
  }
  const id = getServerReferenceId(request.bundlerConfig, serverReference);
  let serverReferenceMetadata: {
    id: ServerReferenceId,
    bound?: null | Promise<Array<any>>,
    name?: string, // DEV-only
    env?: string, // DEV-only
    location?: ReactFunctionLocation, // DEV-only
  };
  if (isObjectReference) {
    serverReferenceMetadata = {id};
  } else {
    const input = request.input;
    const metadata =
      input === null ? undefined : input.getServerReference(serverReference);
    if (metadata === undefined) {
      // eslint-disable-next-line react-internal/prod-error-codes
      throw new Error(
        'A Result must record server references before serialization.',
      );
    }
    const bound = metadata.bound;
    const location = __DEV__ ? metadata.location : undefined;
    serverReferenceMetadata =
      __DEV__ && location != null
        ? {
            id,
            bound,
            name: metadata.name,
            env: metadata.env,
            location,
          }
        : {id, bound};
  }
  const metadataId = outlineModel(request, serverReferenceMetadata);
  writtenServerReferences.set(serverReference, metadataId);
  return isObjectReference
    ? serializeServerObjectReferenceID(metadataId)
    : serializeServerReferenceID(metadataId);
}

function serializeServerReferenceID(id: number): string {
  return '$h' + id.toString(16);
}

function serializeServerObjectReferenceID(id: number): string {
  return '$H' + id.toString(16);
}

function emitChunk(
  request: Request,
  task: Task,
  value: ReactClientValue,
): void {
  const id = task.id;
  // For certain types we have special types, we typically outlined them but
  // we can emit them directly for this row instead of through an indirection.
  // $FlowFixMe[invalid-compare]
  if (typeof value === 'string' && byteLengthOfChunk !== null) {
    if (enableTaint) {
      const tainted = TaintRegistryValues.get(value);
      if (tainted !== undefined) {
        throwTaintViolation(tainted.message);
      }
    }
    emitTextChunk(request, id, value);
    return;
  }
  const input = request.input;
  const kind =
    value !== null && typeof value === 'object' && input !== null
      ? input.getModelInfo(value) & MODEL_KIND_MASK
      : 0;
  if (kind === 0) {
    if (
      enableFlightObjectReferences &&
      typeof value === 'object' &&
      value !== null &&
      isServerReference(value)
    ) {
      // Streamed values reach this function before model serialization. Keep
      // registered binary objects opaque instead of emitting their bytes.
      const json = JSON.stringify(
        serializeServerReference(request, value as any),
      );
      emitModelChunk(request, id, json);
      return;
    }
    if (value instanceof ArrayBuffer) {
      emitTypedArrayChunk(request, id, 'A', new Uint8Array(value));
      return;
    }
    if (value instanceof Int8Array) {
      // char
      emitTypedArrayChunk(request, id, 'O', value);
      return;
    }
    if (value instanceof Uint8Array) {
      // unsigned char
      emitTypedArrayChunk(request, id, 'o', value);
      return;
    }
    if (value instanceof Uint8ClampedArray) {
      // unsigned clamped char
      emitTypedArrayChunk(request, id, 'U', value);
      return;
    }
    if (value instanceof Int16Array) {
      // sort
      emitTypedArrayChunk(request, id, 'S', value);
      return;
    }
    if (value instanceof Uint16Array) {
      // unsigned short
      emitTypedArrayChunk(request, id, 's', value);
      return;
    }
    if (value instanceof Int32Array) {
      // long
      emitTypedArrayChunk(request, id, 'L', value);
      return;
    }
    if (value instanceof Uint32Array) {
      // unsigned long
      emitTypedArrayChunk(request, id, 'l', value);
      return;
    }
    if (value instanceof Float32Array) {
      // float
      emitTypedArrayChunk(request, id, 'G', value);
      return;
    }
    if (value instanceof Float64Array) {
      // double
      emitTypedArrayChunk(request, id, 'g', value);
      return;
    }
    if (value instanceof BigInt64Array) {
      // number
      emitTypedArrayChunk(request, id, 'M', value);
      return;
    }
    if (value instanceof BigUint64Array) {
      // unsigned number
      // We use "m" instead of "n" since JSON can start with "null"
      emitTypedArrayChunk(request, id, 'm', value);
      return;
    }
    if (value instanceof DataView) {
      emitTypedArrayChunk(request, id, 'V', value);
      return;
    }
  }
  // For anything else we need to try to serialize it using JSON.
  // We resolve the model tree first in pure JS to avoid the C++->JS boundary
  // overhead of JSON.stringify's replacer callback.
  const resolvedModel = resolveModel(request, task, {'': value}, '', value);
  // $FlowFixMe[incompatible-type] stringify can return null for undefined but we never do
  const json: string = JSON.stringify(resolvedModel);
  emitModelChunk(request, task.id, json);
}

function serializeReadableStream(
  request: Request,
  task: Task,
  stream: Object,
): string {
  const input = request.input;
  const source = input === null ? undefined : input.getReadableStream(stream);
  if (source === undefined) {
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error('A Result must record streams before serialization.');
  }
  const isByteStream = source.isByteStream;

  const streamTask = createTask(request, task.model, request.abortableTasks);
  // The task represents the Stop row. This adds a Start row.
  request.pendingChunks++;
  const startStreamRow =
    streamTask.id.toString(16) + ':' + (isByteStream ? 'r' : 'R') + '\n';
  request.writtenObjects.set(stream, serializeByValueID(streamTask.id));
  request.completedRegularChunks.push(stringToChunk(startStreamRow));

  function progress(entry: InputSequenceEntry): void {
    if (streamTask.status !== PENDING) {
      return;
    }
    if (entry.done) {
      streamTask.status = COMPLETED;
      const endStreamRow = streamTask.id.toString(16) + ':C\n';
      request.completedRegularChunks.push(stringToChunk(endStreamRow));
      request.abortableTasks.delete(streamTask);
      enqueueFlush(request);
    } else {
      request.pendingChunks++;
      let pendingEntry = true;
      try {
        streamTask.model = entry.value;
        if (isByteStream) {
          const chunk: Uint8Array = streamTask.model as any;
          emitTypedArrayChunk(request, streamTask.id, 'b', chunk);
        } else {
          tryStreamTask(request, streamTask);
        }
        pendingEntry = false;
        enqueueFlush(request);
      } catch (reason) {
        if (pendingEntry) {
          request.pendingChunks--;
        }
        error(reason, undefined);
      }
    }
  }
  function error(reason: mixed, reference: void | ErrorReference): void {
    if (streamTask.status === PENDING) {
      try {
        erroredInputTask(request, streamTask, reason, reference);
        scheduleMicrotask(() => flushCompletedChunks(request));
      } catch (fatal) {
        fatalError(request, fatal);
      }
    }
  }

  subscribeInput(request, detach =>
    source.subscribe({
      progress(entry) {
        progress(entry);
        if (streamTask.status !== PENDING) {
          detach();
        }
      },
      error(reason, reference) {
        detach();
        error(reason, reference);
      },
      rejectEntry(reason, reference) {
        detach();
        error(reason, reference);
      },
      halt() {
        detach();
        if (streamTask.status === PENDING) {
          haltInputTask(request, streamTask);
        }
      },
    }),
  );
  return serializeByValueID(streamTask.id);
}

function serializeWeakPromiseID(id: number): string {
  return '$w' + id.toString(16);
}

function tryStreamTask(request: Request, task: Task): void {
  const previousModelRoot = modelRoot;
  const parentSerializedSize = serializedSize;
  try {
    modelRoot = null;
    emitChunk(request, task, task.model);
  } finally {
    modelRoot = previousModelRoot;
    serializedSize = parentSerializedSize;
  }
}

function haltInputTask(request: Request, task: Task): void {
  request.abortableTasks.delete(task);
  haltTask(task, request);
  finishHaltedTask(task, request);
  enqueueFlush(request);
}

function serializeAsyncIterable(
  request: Request,
  task: Task,
  iterable: Object,
): string {
  const input = request.input;
  const source = input === null ? undefined : input.getAsyncIterable(iterable);
  if (source === undefined) {
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'A Result must record async iterables before serialization.',
    );
  }
  const streamTask = createTask(request, task.model, request.abortableTasks);
  // The task represents the Stop row. This adds a Start row.
  request.pendingChunks++;
  const startStreamRow =
    streamTask.id.toString(16) + ':' + (source.isIterator ? 'x' : 'X') + '\n';
  request.writtenObjects.set(iterable, serializeByValueID(streamTask.id));
  request.completedRegularChunks.push(stringToChunk(startStreamRow));

  function error(reason: mixed, reference: void | ErrorReference): void {
    if (streamTask.status === PENDING) {
      try {
        erroredInputTask(request, streamTask, reason, reference);
        scheduleMicrotask(() => flushCompletedChunks(request));
      } catch (fatal) {
        fatalError(request, fatal);
      }
    }
  }

  subscribeInput(request, detach =>
    source.subscribe({
      enqueue(entry, done) {
        if (streamTask.status !== PENDING) {
          return;
        }
        try {
          const entryId = serializeThenable(request, entry as any);
          const reference = serializeByValueID(entryId);
          if (done) {
            streamTask.status = COMPLETED;
            const endStreamRow =
              streamTask.id.toString(16) +
              ':C' +
              JSON.stringify(reference) +
              '\n';
            request.completedRegularChunks.push(stringToChunk(endStreamRow));
            request.abortableTasks.delete(streamTask);
            detach();
          } else {
            request.pendingChunks++;
            emitModelChunk(request, streamTask.id, JSON.stringify(reference));
          }
          enqueueFlush(request);
        } catch (reason) {
          detach();
          error(reason, undefined);
        }
      },
      close() {
        detach();
      },
      error(reason, reference) {
        detach();
        error(reason, reference);
      },
      halt() {
        detach();
        if (streamTask.status === PENDING) {
          haltInputTask(request, streamTask);
        }
      },
    }),
  );
  return serializeByValueID(streamTask.id);
}
