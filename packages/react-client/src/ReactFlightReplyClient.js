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

import {
  REACT_ELEMENT_TYPE,
  REACT_LAZY_TYPE,
  REACT_CONTEXT_TYPE,
  getIteratorFn,
} from 'shared/ReactSymbols';

import {
  describeObjectForErrorMessage,
  isSimpleObject,
  objectName,
} from 'shared/ReactSerializationErrors';

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
  | symbol
  | null
  | void
  | bigint
  | Iterable<ReactServerValue>
  | Array<ReactServerValue>
  | Map<ReactServerValue, ReactServerValue>
  | Set<ReactServerValue>
  | Date
  | ReactServerObject
  | Promise<ReactServerValue>; // Thenable<ReactServerValue>

type ReactServerObject = {+[key: string]: ReactServerValue};

// function serializeByValueID(id: number): string {
//   return '$' + id.toString(16);
// }

function serializePromiseID(id: number): string {
  return '$@' + id.toString(16);
}

function serializeServerReferenceID(id: number): string {
  return '$F' + id.toString(16);
}

function serializeSymbolReference(name: string): string {
  return '$S' + name;
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

function escapeStringValue(value: string): string {
  if (value[0] === '$') {
    // We need to escape $ prefixed strings since we use those to encode
    // references to IDs and as special symbol values.
    return '$' + value;
  } else {
    return value;
  }
}

export function processReply(
  root: ReactServerValue,
  formFieldPrefix: string,
  resolve: (string | FormData) => void,
  reject: (error: mixed) => void,
): void {
  let nextPartId = 1;
  let pendingParts = 0;
  let formData: null | FormData = null;

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
            const partJSON = JSON.stringify(partValue, resolveToJSON);
            // $FlowFixMe[incompatible-type] We know it's not null because we assigned it above.
            const data: FormData = formData;
            // eslint-disable-next-line react-internal/safe-string-coercion
            data.append(formFieldPrefix + promiseId, partJSON);
            pendingParts--;
            if (pendingParts === 0) {
              resolve(data);
            }
          },
          reason => {
            // In the future we could consider serializing this as an error
            // that throws on the server instead.
            reject(reason);
          },
        );
        return serializePromiseID(promiseId);
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
        const partJSON = JSON.stringify(Array.from(value), resolveToJSON);
        if (formData === null) {
          formData = new FormData();
        }
        const mapId = nextPartId++;
        formData.append(formFieldPrefix + mapId, partJSON);
        return serializeMapID(mapId);
      }
      if (value instanceof Set) {
        const partJSON = JSON.stringify(Array.from(value), resolveToJSON);
        if (formData === null) {
          formData = new FormData();
        }
        const setId = nextPartId++;
        formData.append(formFieldPrefix + setId, partJSON);
        return serializeSetID(setId);
      }
      const iteratorFn = getIteratorFn(value);
      if (iteratorFn) {
        return Array.from((value: any));
      }

      // Verify that this is a simple plain object.
      const proto = getPrototypeOf(value);
      if (
        proto !== ObjectPrototype &&
        (proto === null || getPrototypeOf(proto) !== null)
      ) {
        throw new Error(
          'Only plain objects, and a few built-ins, can be passed to Server Actions. ' +
            'Classes or null prototypes are not supported.',
        );
      }
      if (__DEV__) {
        if ((value: any).$$typeof === REACT_ELEMENT_TYPE) {
          console.error(
            'React Element cannot be passed to Server Functions from the Client.%s',
            describeObjectForErrorMessage(parent, key),
          );
        } else if ((value: any).$$typeof === REACT_LAZY_TYPE) {
          console.error(
            'React Lazy cannot be passed to Server Functions from the Client.%s',
            describeObjectForErrorMessage(parent, key),
          );
        } else if ((value: any).$$typeof === REACT_CONTEXT_TYPE) {
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
      throw new Error(
        'Client Functions cannot be passed directly to Server Functions. ' +
          'Only Functions passed from the Server can be passed back again.',
      );
    }

    if (typeof value === 'symbol') {
      // $FlowFixMe[incompatible-type] `description` might be undefined
      const name: string = value.description;
      if (Symbol.for(name) !== value) {
        throw new Error(
          'Only global symbols received from Symbol.for(...) can be passed to Server Functions. ' +
            `The symbol Symbol.for(${
              // $FlowFixMe[incompatible-type] `description` might be undefined
              value.description
            }) cannot be found among global symbols.`,
        );
      }
      return serializeSymbolReference(name);
    }

    if (typeof value === 'bigint') {
      return serializeBigInt(value);
    }

    throw new Error(
      `Type ${typeof value} is not supported as an argument to a Server Function.`,
    );
  }

  // $FlowFixMe[incompatible-type] it's not going to be undefined because we'll encode it.
  const json: string = JSON.stringify(root, resolveToJSON);
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

export function encodeFormAction(
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
) {
  // Expose encoder for use by SSR, as well as a special bind that can be used to
  // keep server capabilities.
  if (usedWithSSR) {
    // Only expose this in builds that would actually use it. Not needed on the client.
    Object.defineProperties((proxy: any), {
      $$FORM_ACTION: {value: encodeFormAction},
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
function bind(this: Function) {
  // $FlowFixMe[unsupported-syntax]
  const newFn = FunctionBind.apply(this, arguments);
  const reference = knownServerReferences.get(this);
  if (reference) {
    const args = ArraySlice.call(arguments, 1);
    let boundPromise = null;
    if (reference.bound !== null) {
      boundPromise = Promise.resolve((reference.bound: any)).then(boundArgs =>
        boundArgs.concat(args),
      );
    } else {
      boundPromise = Promise.resolve(args);
    }
    registerServerReference(newFn, {id: reference.id, bound: boundPromise});
  }
  return newFn;
}

export function createServerReference<A: Iterable<any>, T>(
  id: ServerReferenceId,
  callServer: CallServerCallback,
): (...A) => Promise<T> {
  const proxy = function (): Promise<T> {
    // $FlowFixMe[method-unbinding]
    const args = Array.prototype.slice.call(arguments);
    return callServer(id, args);
  };
  registerServerReference(proxy, {id, bound: null});
  return proxy;
}
