/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Thenable,
  PendingThenable,
  FulfilledThenable,
  RejectedThenable,
  ReactCustomFormAction,
} from 'shared/ReactTypes';
import type {LazyComponent} from 'react/src/ReactLazy';
import type {TemporaryReferenceSet} from './ReactFlightTemporaryReferences';

import {
  enableRenderableContext,
  enableBinaryFlight,
  enableFlightReadableStream,
} from 'shared/ReactFeatureFlags';

import {
  REACT_ELEMENT_TYPE,
  REACT_LAZY_TYPE,
  REACT_CONTEXT_TYPE,
  REACT_PROVIDER_TYPE,
  getIteratorFn,
  ASYNC_ITERATOR,
} from 'shared/ReactSymbols';

import {
  describeObjectForErrorMessage,
  isSimpleObject,
  objectName,
} from 'shared/ReactSerializationErrors';

import {writeTemporaryReference} from './ReactFlightTemporaryReferences';

import isArray from 'shared/isArray';
import getPrototypeOf from 'shared/getPrototypeOf';

const ObjectPrototype = Object.prototype;

import {usedWithSSR} from './ReactFlightClientConfig';

type ReactJSONValue =
  | string
  | boolean
  | number
  | null
  | $ReadOnlyArray<ReactJSONValue>
  | ReactServerObject;

export opaque type ServerReference<T> = T;

export type CallServerCallback = <A, T>(id: any, args: A) => Promise<T>;

export type EncodeFormActionCallback = <A>(
  id: any,
  args: Promise<A>,
) => ReactCustomFormAction;

export type ServerReferenceId = any;

const knownServerReferences: WeakMap<
  Function,
  {id: ServerReferenceId, bound: null | Thenable<Array<any>>},
> = new WeakMap();

// Serializable values
export type ReactServerValue =
  // References are passed by their value
  | ServerReference<any>
  // The rest are passed as is. Sub-types can be passed in but lose their
  // subtype, so the receiver can only accept once of these.
  | string
  | boolean
  | number
  | null
  | void
  | bigint
  | $AsyncIterable<ReactServerValue, ReactServerValue, void>
  | $AsyncIterator<ReactServerValue, ReactServerValue, void>
  | Iterable<ReactServerValue>
  | Iterator<ReactServerValue>
  | Array<ReactServerValue>
  | Map<ReactServerValue, ReactServerValue>
  | Set<ReactServerValue>
  | FormData
  | Date
  | ReactServerObject
  | Promise<ReactServerValue>; // Thenable<ReactServerValue>

type ReactServerObject = {+[key: string]: ReactServerValue};

function serializeByValueID(id: number): string {
  return '$' + id.toString(16);
}

function serializePromiseID(id: number): string {
  return '$@' + id.toString(16);
}

function serializeServerReferenceID(id: number): string {
  return '$F' + id.toString(16);
}

function serializeTemporaryReferenceID(id: number): string {
  return '$T' + id.toString(16);
}

function serializeFormDataReference(id: number): string {
  // Why K? F is "Function". D is "Date". What else?
  return '$K' + id.toString(16);
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

function serializeDateFromDateJSON(dateJSON: string): string {
  // JSON.stringify automatically calls Date.prototype.toJSON which calls toISOString.
  // We need only tack on a $D prefix.
  return '$D' + dateJSON;
}

function serializeBigInt(n: bigint): string {
  return '$n' + n.toString(10);
}

function serializeMapID(id: number): string {
  return '$Q' + id.toString(16);
}

function serializeSetID(id: number): string {
  return '$W' + id.toString(16);
}

function serializeBlobID(id: number): string {
  return '$B' + id.toString(16);
}

function serializeIteratorID(id: number): string {
  return '$i' + id.toString(16);
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

interface Reference {}

export function processReply(
  root: ReactServerValue,
  formFieldPrefix: string,
  temporaryReferences: void | TemporaryReferenceSet,
  resolve: (string | FormData) => void,
  reject: (error: mixed) => void,
): void {
  let nextPartId = 1;
  let pendingParts = 0;
  let formData: null | FormData = null;
  const writtenObjects: WeakMap<Reference, string> = new WeakMap();
  let modelRoot: null | ReactServerValue = root;

  function serializeTypedArray(
    tag: string,
    typedArray: $ArrayBufferView,
  ): string {
    const blob = new Blob([
      // We should be able to pass the buffer straight through but Node < 18 treat
      // multi-byte array blobs differently so we first convert it to single-byte.
      new Uint8Array(
        typedArray.buffer,
        typedArray.byteOffset,
        typedArray.byteLength,
      ),
    ]);
    const blobId = nextPartId++;
    if (formData === null) {
      formData = new FormData();
    }
    formData.append(formFieldPrefix + blobId, blob);
    return '$' + tag + blobId.toString(16);
  }

  function serializeBinaryReader(reader: any): string {
    if (formData === null) {
      // Upgrade to use FormData to allow us to stream this value.
      formData = new FormData();
    }
    const data = formData;

    pendingParts++;
    const streamId = nextPartId++;

    const buffer = [];

    function progress(entry: {done: boolean, value: ReactServerValue, ...}) {
      if (entry.done) {
        const blobId = nextPartId++;
        // eslint-disable-next-line react-internal/safe-string-coercion
        data.append(formFieldPrefix + blobId, new Blob(buffer));
        // eslint-disable-next-line react-internal/safe-string-coercion
        data.append(
          formFieldPrefix + streamId,
          '"$o' + blobId.toString(16) + '"',
        );
        // eslint-disable-next-line react-internal/safe-string-coercion
        data.append(formFieldPrefix + streamId, 'C'); // Close signal
        pendingParts--;
        if (pendingParts === 0) {
          resolve(data);
        }
      } else {
        buffer.push(entry.value);
        reader.read(new Uint8Array(1024)).then(progress, reject);
      }
    }
    reader.read(new Uint8Array(1024)).then(progress, reject);

    return '$r' + streamId.toString(16);
  }

  function serializeReader(reader: ReadableStreamReader): string {
    if (formData === null) {
      // Upgrade to use FormData to allow us to stream this value.
      formData = new FormData();
    }
    const data = formData;

    pendingParts++;
    const streamId = nextPartId++;

    function progress(entry: {done: boolean, value: ReactServerValue, ...}) {
      if (entry.done) {
        // eslint-disable-next-line react-internal/safe-string-coercion
        data.append(formFieldPrefix + streamId, 'C'); // Close signal
        pendingParts--;
        if (pendingParts === 0) {
          resolve(data);
        }
      } else {
        try {
          // $FlowFixMe[incompatible-type]: While plain JSON can return undefined we never do here.
          const partJSON: string = JSON.stringify(entry.value, resolveToJSON);
          // eslint-disable-next-line react-internal/safe-string-coercion
          data.append(formFieldPrefix + streamId, partJSON);
          reader.read().then(progress, reject);
        } catch (x) {
          reject(x);
        }
      }
    }
    reader.read().then(progress, reject);

    return '$R' + streamId.toString(16);
  }

  function serializeReadableStream(stream: ReadableStream): string {
    // Detect if this is a BYOB stream. BYOB streams should be able to be read as bytes on the
    // receiving side. For binary streams, we serialize them as plain Blobs.
    let binaryReader;
    try {
      // $FlowFixMe[extra-arg]: This argument is accepted.
      binaryReader = stream.getReader({mode: 'byob'});
    } catch (x) {
      return serializeReader(stream.getReader());
    }
    return serializeBinaryReader(binaryReader);
  }

  function serializeAsyncIterable(
    iterable: $AsyncIterable<ReactServerValue, ReactServerValue, void>,
    iterator: $AsyncIterator<ReactServerValue, ReactServerValue, void>,
  ): string {
    if (formData === null) {
      // Upgrade to use FormData to allow us to stream this value.
      formData = new FormData();
    }
    const data = formData;

    pendingParts++;
    const streamId = nextPartId++;

    // Generators/Iterators are Iterables but they're also their own iterator
    // functions. If that's the case, we treat them as single-shot. Otherwise,
    // we assume that this iterable might be a multi-shot and allow it to be
    // iterated more than once on the receiving server.
    const isIterator = iterable === iterator;

    // There's a race condition between when the stream is aborted and when the promise
    // resolves so we track whether we already aborted it to avoid writing twice.
    function progress(
      entry:
        | {done: false, +value: ReactServerValue, ...}
        | {done: true, +value: ReactServerValue, ...},
    ) {
      if (entry.done) {
        if (entry.value === undefined) {
          // eslint-disable-next-line react-internal/safe-string-coercion
          data.append(formFieldPrefix + streamId, 'C'); // Close signal
        } else {
          // Unlike streams, the last value may not be undefined. If it's not
          // we outline it and encode a reference to it in the closing instruction.
          try {
            // $FlowFixMe[incompatible-type]: While plain JSON can return undefined we never do here.
            const partJSON: string = JSON.stringify(entry.value, resolveToJSON);
            data.append(formFieldPrefix + streamId, 'C' + partJSON); // Close signal
          } catch (x) {
            reject(x);
            return;
          }
        }
        pendingParts--;
        if (pendingParts === 0) {
          resolve(data);
        }
      } else {
        try {
          // $FlowFixMe[incompatible-type]: While plain JSON can return undefined we never do here.
          const partJSON: string = JSON.stringify(entry.value, resolveToJSON);
          // eslint-disable-next-line react-internal/safe-string-coercion
          data.append(formFieldPrefix + streamId, partJSON);
          iterator.next().then(progress, reject);
        } catch (x) {
          reject(x);
          return;
        }
      }
    }

    iterator.next().then(progress, reject);
    return '$' + (isIterator ? 'x' : 'X') + streamId.toString(16);
  }

  function resolveToJSON(
    this:
      | {+[key: string | number]: ReactServerValue}
      | $ReadOnlyArray<ReactServerValue>,
    key: string,
    value: ReactServerValue,
  ): ReactJSONValue {
    const parent = this;

    // Make sure that `parent[key]` wasn't JSONified before `value` was passed to us
    if (__DEV__) {
      // $FlowFixMe[incompatible-use]
      const originalValue = parent[key];
      if (
        typeof originalValue === 'object' &&
        originalValue !== value &&
        !(originalValue instanceof Date)
      ) {
        if (objectName(originalValue) !== 'Object') {
          console.error(
            'Only plain objects can be passed to Server Functions from the Client. ' +
              '%s objects are not supported.%s',
            objectName(originalValue),
            describeObjectForErrorMessage(parent, key),
          );
        } else {
          console.error(
            'Only plain objects can be passed to Server Functions from the Client. ' +
              'Objects with toJSON methods are not supported. Convert it manually ' +
              'to a simple value before passing it to props.%s',
            describeObjectForErrorMessage(parent, key),
          );
        }
      }
    }

    if (value === null) {
      return null;
    }

    if (typeof value === 'object') {
      switch ((value: any).$$typeof) {
        case REACT_ELEMENT_TYPE: {
          if (temporaryReferences === undefined) {
            throw new Error(
              'React Element cannot be passed to Server Functions from the Client without a ' +
                'temporary reference set. Pass a TemporaryReferenceSet to the options.' +
                (__DEV__ ? describeObjectForErrorMessage(parent, key) : ''),
            );
          }
          return serializeTemporaryReferenceID(
            writeTemporaryReference(temporaryReferences, value),
          );
        }
        case REACT_LAZY_TYPE: {
          // Resolve lazy as if it wasn't here. In the future this will be encoded as a Promise.
          const lazy: LazyComponent<any, any> = (value: any);
          const payload = lazy._payload;
          const init = lazy._init;
          if (formData === null) {
            // Upgrade to use FormData to allow us to stream this value.
            formData = new FormData();
          }
          pendingParts++;
          try {
            const resolvedModel = init(payload);
            // We always outline this as a separate part even though we could inline it
            // because it ensures a more deterministic encoding.
            const lazyId = nextPartId++;
            const partJSON = serializeModel(resolvedModel, lazyId);
            // $FlowFixMe[incompatible-type] We know it's not null because we assigned it above.
            const data: FormData = formData;
            // eslint-disable-next-line react-internal/safe-string-coercion
            data.append(formFieldPrefix + lazyId, partJSON);
            return serializeByValueID(lazyId);
          } catch (x) {
            if (
              typeof x === 'object' &&
              x !== null &&
              typeof x.then === 'function'
            ) {
              // Suspended
              pendingParts++;
              const lazyId = nextPartId++;
              const thenable: Thenable<any> = (x: any);
              const retry = function () {
                // While the first promise resolved, its value isn't necessarily what we'll
                // resolve into because we might suspend again.
                try {
                  const partJSON = serializeModel(value, lazyId);
                  // $FlowFixMe[incompatible-type] We know it's not null because we assigned it above.
                  const data: FormData = formData;
                  // eslint-disable-next-line react-internal/safe-string-coercion
                  data.append(formFieldPrefix + lazyId, partJSON);
                  pendingParts--;
                  if (pendingParts === 0) {
                    resolve(data);
                  }
                } catch (reason) {
                  reject(reason);
                }
              };
              thenable.then(retry, retry);
              return serializeByValueID(lazyId);
            } else {
              // In the future we could consider serializing this as an error
              // that throws on the server instead.
              reject(x);
              return null;
            }
          } finally {
            pendingParts--;
          }
        }
      }

      // $FlowFixMe[method-unbinding]
      if (typeof value.then === 'function') {
        // We assume that any object with a .then property is a "Thenable" type,
        // or a Promise type. Either of which can be represented by a Promise.
        if (formData === null) {
          // Upgrade to use FormData to allow us to stream this value.
          formData = new FormData();
        }
        pendingParts++;
        const promiseId = nextPartId++;
        const thenable: Thenable<any> = (value: any);
        thenable.then(
          partValue => {
            try {
              const partJSON = serializeModel(partValue, promiseId);
              // $FlowFixMe[incompatible-type] We know it's not null because we assigned it above.
              const data: FormData = formData;
              // eslint-disable-next-line react-internal/safe-string-coercion
              data.append(formFieldPrefix + promiseId, partJSON);
              pendingParts--;
              if (pendingParts === 0) {
                resolve(data);
              }
            } catch (reason) {
              reject(reason);
            }
          },
          // In the future we could consider serializing this as an error
          // that throws on the server instead.
          reject,
        );
        return serializePromiseID(promiseId);
      }

      const existingReference = writtenObjects.get(value);
      if (existingReference !== undefined) {
        if (modelRoot === value) {
          // This is the ID we're currently emitting so we need to write it
          // once but if we discover it again, we refer to it by id.
          modelRoot = null;
        } else {
          // We've already emitted this as an outlined object, so we can
          // just refer to that by its existing ID.
          return existingReference;
        }
      } else if (key.indexOf(':') === -1) {
        // TODO: If the property name contains a colon, we don't dedupe. Escape instead.
        const parentReference = writtenObjects.get(parent);
        if (parentReference !== undefined) {
          // If the parent has a reference, we can refer to this object indirectly
          // through the property name inside that parent.
          writtenObjects.set(value, parentReference + ':' + key);
        }
      }

      if (isArray(value)) {
        // $FlowFixMe[incompatible-return]
        return value;
      }
      // TODO: Should we the Object.prototype.toString.call() to test for cross-realm objects?
      if (value instanceof FormData) {
        if (formData === null) {
          // Upgrade to use FormData to allow us to use rich objects as its values.
          formData = new FormData();
        }
        const data: FormData = formData;
        const refId = nextPartId++;
        // Copy all the form fields with a prefix for this reference.
        // These must come first in the form order because we assume that all the
        // fields are available before this is referenced.
        const prefix = formFieldPrefix + refId + '_';
        // $FlowFixMe[prop-missing]: FormData has forEach.
        value.forEach((originalValue: string | File, originalKey: string) => {
          data.append(prefix + originalKey, originalValue);
        });
        return serializeFormDataReference(refId);
      }
      if (value instanceof Map) {
        const mapId = nextPartId++;
        const partJSON = serializeModel(Array.from(value), mapId);
        if (formData === null) {
          formData = new FormData();
        }
        formData.append(formFieldPrefix + mapId, partJSON);
        return serializeMapID(mapId);
      }
      if (value instanceof Set) {
        const setId = nextPartId++;
        const partJSON = serializeModel(Array.from(value), setId);
        if (formData === null) {
          formData = new FormData();
        }
        formData.append(formFieldPrefix + setId, partJSON);
        return serializeSetID(setId);
      }

      if (enableBinaryFlight) {
        if (value instanceof ArrayBuffer) {
          const blob = new Blob([value]);
          const blobId = nextPartId++;
          if (formData === null) {
            formData = new FormData();
          }
          formData.append(formFieldPrefix + blobId, blob);
          return '$' + 'A' + blobId.toString(16);
        }
        if (value instanceof Int8Array) {
          // char
          return serializeTypedArray('O', value);
        }
        if (value instanceof Uint8Array) {
          // unsigned char
          return serializeTypedArray('o', value);
        }
        if (value instanceof Uint8ClampedArray) {
          // unsigned clamped char
          return serializeTypedArray('U', value);
        }
        if (value instanceof Int16Array) {
          // sort
          return serializeTypedArray('S', value);
        }
        if (value instanceof Uint16Array) {
          // unsigned short
          return serializeTypedArray('s', value);
        }
        if (value instanceof Int32Array) {
          // long
          return serializeTypedArray('L', value);
        }
        if (value instanceof Uint32Array) {
          // unsigned long
          return serializeTypedArray('l', value);
        }
        if (value instanceof Float32Array) {
          // float
          return serializeTypedArray('G', value);
        }
        if (value instanceof Float64Array) {
          // double
          return serializeTypedArray('g', value);
        }
        if (value instanceof BigInt64Array) {
          // number
          return serializeTypedArray('M', value);
        }
        if (value instanceof BigUint64Array) {
          // unsigned number
          // We use "m" instead of "n" since JSON can start with "null"
          return serializeTypedArray('m', value);
        }
        if (value instanceof DataView) {
          return serializeTypedArray('V', value);
        }
        // TODO: Blob is not available in old Node/browsers. Remove the typeof check later.
        if (typeof Blob === 'function' && value instanceof Blob) {
          if (formData === null) {
            formData = new FormData();
          }
          const blobId = nextPartId++;
          formData.append(formFieldPrefix + blobId, value);
          return serializeBlobID(blobId);
        }
      }

      const iteratorFn = getIteratorFn(value);
      if (iteratorFn) {
        const iterator = iteratorFn.call(value);
        if (iterator === value) {
          // Iterator, not Iterable
          const iteratorId = nextPartId++;
          const partJSON = serializeModel(
            Array.from((iterator: any)),
            iteratorId,
          );
          if (formData === null) {
            formData = new FormData();
          }
          formData.append(formFieldPrefix + iteratorId, partJSON);
          return serializeIteratorID(iteratorId);
        }
        return Array.from((iterator: any));
      }

      if (enableFlightReadableStream) {
        // TODO: ReadableStream is not available in old Node. Remove the typeof check later.
        if (
          typeof ReadableStream === 'function' &&
          value instanceof ReadableStream
        ) {
          return serializeReadableStream(value);
        }
        const getAsyncIterator: void | (() => $AsyncIterator<any, any, any>) =
          (value: any)[ASYNC_ITERATOR];
        if (typeof getAsyncIterator === 'function') {
          // We treat AsyncIterables as a Fragment and as such we might need to key them.
          return serializeAsyncIterable(
            (value: any),
            getAsyncIterator.call((value: any)),
          );
        }
      }

      // Verify that this is a simple plain object.
      const proto = getPrototypeOf(value);
      if (
        proto !== ObjectPrototype &&
        (proto === null || getPrototypeOf(proto) !== null)
      ) {
        if (temporaryReferences === undefined) {
          throw new Error(
            'Only plain objects, and a few built-ins, can be passed to Server Actions. ' +
              'Classes or null prototypes are not supported.',
          );
        }
        // We can serialize class instances as temporary references.
        return serializeTemporaryReferenceID(
          writeTemporaryReference(temporaryReferences, value),
        );
      }
      if (__DEV__) {
        if (
          (value: any).$$typeof ===
          (enableRenderableContext ? REACT_CONTEXT_TYPE : REACT_PROVIDER_TYPE)
        ) {
          console.error(
            'React Context Providers cannot be passed to Server Functions from the Client.%s',
            describeObjectForErrorMessage(parent, key),
          );
        } else if (objectName(value) !== 'Object') {
          console.error(
            'Only plain objects can be passed to Server Functions from the Client. ' +
              '%s objects are not supported.%s',
            objectName(value),
            describeObjectForErrorMessage(parent, key),
          );
        } else if (!isSimpleObject(value)) {
          console.error(
            'Only plain objects can be passed to Server Functions from the Client. ' +
              'Classes or other objects with methods are not supported.%s',
            describeObjectForErrorMessage(parent, key),
          );
        } else if (Object.getOwnPropertySymbols) {
          const symbols = Object.getOwnPropertySymbols(value);
          if (symbols.length > 0) {
            console.error(
              'Only plain objects can be passed to Server Functions from the Client. ' +
                'Objects with symbol properties like %s are not supported.%s',
              symbols[0].description,
              describeObjectForErrorMessage(parent, key),
            );
          }
        }
      }

      // $FlowFixMe[incompatible-return]
      return value;
    }

    if (typeof value === 'string') {
      // TODO: Maybe too clever. If we support URL there's no similar trick.
      if (value[value.length - 1] === 'Z') {
        // Possibly a Date, whose toJSON automatically calls toISOString
        // $FlowFixMe[incompatible-use]
        const originalValue = parent[key];
        if (originalValue instanceof Date) {
          return serializeDateFromDateJSON(value);
        }
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

    if (typeof value === 'function') {
      const metaData = knownServerReferences.get(value);
      if (metaData !== undefined) {
        const metaDataJSON = JSON.stringify(metaData, resolveToJSON);
        if (formData === null) {
          // Upgrade to use FormData to allow us to stream this value.
          formData = new FormData();
        }
        // The reference to this function came from the same client so we can pass it back.
        const refId = nextPartId++;
        // eslint-disable-next-line react-internal/safe-string-coercion
        formData.set(formFieldPrefix + refId, metaDataJSON);
        return serializeServerReferenceID(refId);
      }
      if (temporaryReferences === undefined) {
        throw new Error(
          'Client Functions cannot be passed directly to Server Functions. ' +
            'Only Functions passed from the Server can be passed back again.',
        );
      }
      return serializeTemporaryReferenceID(
        writeTemporaryReference(temporaryReferences, value),
      );
    }

    if (typeof value === 'symbol') {
      if (temporaryReferences === undefined) {
        throw new Error(
          'Symbols cannot be passed to a Server Function without a ' +
            'temporary reference set. Pass a TemporaryReferenceSet to the options.' +
            (__DEV__ ? describeObjectForErrorMessage(parent, key) : ''),
        );
      }
      return serializeTemporaryReferenceID(
        writeTemporaryReference(temporaryReferences, value),
      );
    }

    if (typeof value === 'bigint') {
      return serializeBigInt(value);
    }

    throw new Error(
      `Type ${typeof value} is not supported as an argument to a Server Function.`,
    );
  }

  function serializeModel(model: ReactServerValue, id: number): string {
    if (typeof model === 'object' && model !== null) {
      writtenObjects.set(model, serializeByValueID(id));
    }
    modelRoot = model;
    // $FlowFixMe[incompatible-return] it's not going to be undefined because we'll encode it.
    return JSON.stringify(model, resolveToJSON);
  }

  const json = serializeModel(root, 0);

  if (formData === null) {
    // If it's a simple data structure, we just use plain JSON.
    resolve(json);
  } else {
    // Otherwise, we use FormData to let us stream in the result.
    formData.set(formFieldPrefix + '0', json);
    if (pendingParts === 0) {
      // $FlowFixMe[incompatible-call] this has already been refined.
      resolve(formData);
    }
  }
}

const boundCache: WeakMap<
  {id: ServerReferenceId, bound: null | Thenable<Array<any>>},
  Thenable<FormData>,
> = new WeakMap();

function encodeFormData(reference: any): Thenable<FormData> {
  let resolve, reject;
  // We need to have a handle on the thenable so that we can synchronously set
  // its status from processReply, when it can complete synchronously.
  const thenable: Thenable<FormData> = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  processReply(
    reference,
    '',
    undefined, // TODO: This means React Elements can't be used as state in progressive enhancement.
    (body: string | FormData) => {
      if (typeof body === 'string') {
        const data = new FormData();
        data.append('0', body);
        body = data;
      }
      const fulfilled: FulfilledThenable<FormData> = (thenable: any);
      fulfilled.status = 'fulfilled';
      fulfilled.value = body;
      resolve(body);
    },
    e => {
      const rejected: RejectedThenable<FormData> = (thenable: any);
      rejected.status = 'rejected';
      rejected.reason = e;
      reject(e);
    },
  );
  return thenable;
}

function defaultEncodeFormAction(
  this: any => Promise<any>,
  identifierPrefix: string,
): ReactCustomFormAction {
  const reference = knownServerReferences.get(this);
  if (!reference) {
    throw new Error(
      'Tried to encode a Server Action from a different instance than the encoder is from. ' +
        'This is a bug in React.',
    );
  }
  let data: null | FormData = null;
  let name;
  const boundPromise = reference.bound;
  if (boundPromise !== null) {
    let thenable = boundCache.get(reference);
    if (!thenable) {
      thenable = encodeFormData(reference);
      boundCache.set(reference, thenable);
    }
    if (thenable.status === 'rejected') {
      throw thenable.reason;
    } else if (thenable.status !== 'fulfilled') {
      throw thenable;
    }
    const encodedFormData = thenable.value;
    // This is hacky but we need the identifier prefix to be added to
    // all fields but the suspense cache would break since we might get
    // a new identifier each time. So we just append it at the end instead.
    const prefixedData = new FormData();
    // $FlowFixMe[prop-missing]
    encodedFormData.forEach((value: string | File, key: string) => {
      prefixedData.append('$ACTION_' + identifierPrefix + ':' + key, value);
    });
    data = prefixedData;
    // We encode the name of the prefix containing the data.
    name = '$ACTION_REF_' + identifierPrefix;
  } else {
    // This is the simple case so we can just encode the ID.
    name = '$ACTION_ID_' + reference.id;
  }
  return {
    name: name,
    method: 'POST',
    encType: 'multipart/form-data',
    data: data,
  };
}

function customEncodeFormAction(
  proxy: any => Promise<any>,
  identifierPrefix: string,
  encodeFormAction: EncodeFormActionCallback,
): ReactCustomFormAction {
  const reference = knownServerReferences.get(proxy);
  if (!reference) {
    throw new Error(
      'Tried to encode a Server Action from a different instance than the encoder is from. ' +
        'This is a bug in React.',
    );
  }
  let boundPromise: Promise<Array<any>> = (reference.bound: any);
  if (boundPromise === null) {
    boundPromise = Promise.resolve([]);
  }
  return encodeFormAction(reference.id, boundPromise);
}

function isSignatureEqual(
  this: any => Promise<any>,
  referenceId: ServerReferenceId,
  numberOfBoundArgs: number,
): boolean {
  const reference = knownServerReferences.get(this);
  if (!reference) {
    throw new Error(
      'Tried to encode a Server Action from a different instance than the encoder is from. ' +
        'This is a bug in React.',
    );
  }
  if (reference.id !== referenceId) {
    // These are different functions.
    return false;
  }
  // Now check if the number of bound arguments is the same.
  const boundPromise = reference.bound;
  if (boundPromise === null) {
    // No bound arguments.
    return numberOfBoundArgs === 0;
  }
  // Unwrap the bound arguments array by suspending, if necessary. As with
  // encodeFormData, this means isSignatureEqual can only be called while React
  // is rendering.
  switch (boundPromise.status) {
    case 'fulfilled': {
      const boundArgs = boundPromise.value;
      return boundArgs.length === numberOfBoundArgs;
    }
    case 'pending': {
      throw boundPromise;
    }
    case 'rejected': {
      throw boundPromise.reason;
    }
    default: {
      if (typeof boundPromise.status === 'string') {
        // Only instrument the thenable if the status if not defined.
      } else {
        const pendingThenable: PendingThenable<Array<any>> =
          (boundPromise: any);
        pendingThenable.status = 'pending';
        pendingThenable.then(
          (boundArgs: Array<any>) => {
            const fulfilledThenable: FulfilledThenable<Array<any>> =
              (boundPromise: any);
            fulfilledThenable.status = 'fulfilled';
            fulfilledThenable.value = boundArgs;
          },
          (error: mixed) => {
            const rejectedThenable: RejectedThenable<number> =
              (boundPromise: any);
            rejectedThenable.status = 'rejected';
            rejectedThenable.reason = error;
          },
        );
      }
      throw boundPromise;
    }
  }
}

export function registerServerReference(
  proxy: any,
  reference: {id: ServerReferenceId, bound: null | Thenable<Array<any>>},
  encodeFormAction: void | EncodeFormActionCallback,
) {
  // Expose encoder for use by SSR, as well as a special bind that can be used to
  // keep server capabilities.
  if (usedWithSSR) {
    // Only expose this in builds that would actually use it. Not needed on the client.
    const $$FORM_ACTION =
      encodeFormAction === undefined
        ? defaultEncodeFormAction
        : function (
            this: any => Promise<any>,
            identifierPrefix: string,
          ): ReactCustomFormAction {
            return customEncodeFormAction(
              this,
              identifierPrefix,
              encodeFormAction,
            );
          };
    Object.defineProperties((proxy: any), {
      $$FORM_ACTION: {value: $$FORM_ACTION},
      $$IS_SIGNATURE_EQUAL: {value: isSignatureEqual},
      bind: {value: bind},
    });
  }
  knownServerReferences.set(proxy, reference);
}

// $FlowFixMe[method-unbinding]
const FunctionBind = Function.prototype.bind;
// $FlowFixMe[method-unbinding]
const ArraySlice = Array.prototype.slice;
function bind(this: Function): Function {
  // $FlowFixMe[unsupported-syntax]
  const newFn = FunctionBind.apply(this, arguments);
  const reference = knownServerReferences.get(this);
  if (reference) {
    if (__DEV__) {
      const thisBind = arguments[0];
      if (thisBind != null) {
        // This doesn't warn in browser environments since it's not instrumented outside
        // usedWithSSR. This makes this an SSR only warning which we don't generally do.
        // TODO: Consider a DEV only instrumentation in the browser.
        console.error(
          'Cannot bind "this" of a Server Action. Pass null or undefined as the first argument to .bind().',
        );
      }
    }
    const args = ArraySlice.call(arguments, 1);
    let boundPromise = null;
    if (reference.bound !== null) {
      boundPromise = Promise.resolve((reference.bound: any)).then(boundArgs =>
        boundArgs.concat(args),
      );
    } else {
      boundPromise = Promise.resolve(args);
    }
    // Expose encoder for use by SSR, as well as a special bind that can be used to
    // keep server capabilities.
    if (usedWithSSR) {
      // Only expose this in builds that would actually use it. Not needed on the client.
      Object.defineProperties((newFn: any), {
        $$FORM_ACTION: {value: this.$$FORM_ACTION},
        $$IS_SIGNATURE_EQUAL: {value: isSignatureEqual},
        bind: {value: bind},
      });
    }
    knownServerReferences.set(newFn, {id: reference.id, bound: boundPromise});
  }
  return newFn;
}

export function createServerReference<A: Iterable<any>, T>(
  id: ServerReferenceId,
  callServer: CallServerCallback,
  encodeFormAction?: EncodeFormActionCallback,
): (...A) => Promise<T> {
  const proxy = function (): Promise<T> {
    // $FlowFixMe[method-unbinding]
    const args = Array.prototype.slice.call(arguments);
    return callServer(id, args);
  };
  registerServerReference(proxy, {id, bound: null}, encodeFormAction);
  return proxy;
}
