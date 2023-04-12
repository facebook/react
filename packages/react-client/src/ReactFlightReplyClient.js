/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'shared/ReactTypes';

import {knownServerReferences} from './ReactFlightServerReferenceRegistry';

import {
  REACT_ELEMENT_TYPE,
  REACT_LAZY_TYPE,
  REACT_PROVIDER_TYPE,
  getIteratorFn,
} from 'shared/ReactSymbols';

import {
  describeObjectForErrorMessage,
  isSimpleObject,
  objectName,
} from 'shared/ReactSerializationErrors';

import isArray from 'shared/isArray';

type ReactJSONValue =
  | string
  | boolean
  | number
  | null
  | $ReadOnlyArray<ReactJSONValue>
  | ReactServerObject;

export opaque type ServerReference<T> = T;

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
  | Iterable<ReactServerValue>
  | Array<ReactServerValue>
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

function serializeUndefined(): string {
  return '$undefined';
}

function serializeBigInt(n: bigint): string {
  return '$n' + n.toString(10);
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
    if (__DEV__) {
      // $FlowFixMe[incompatible-use]
      const originalValue = this[key];
      if (typeof originalValue === 'object' && originalValue !== value) {
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
            data.append('' + promiseId, partJSON);
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
      if (!isArray(value)) {
        const iteratorFn = getIteratorFn(value);
        if (iteratorFn) {
          return Array.from((value: any));
        }
      }

      if (__DEV__) {
        if (value !== null && !isArray(value)) {
          // Verify that this is a simple plain object.
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
          } else if ((value: any).$$typeof === REACT_PROVIDER_TYPE) {
            console.error(
              'React Context Providers cannot be passed to Server Functions from the Client.%s',
              describeObjectForErrorMessage(parent, key),
            );
          } else if (objectName(value) !== 'Object') {
            console.error(
              'Only plain objects can be passed to Client Components from Server Components. ' +
                '%s objects are not supported.%s',
              objectName(value),
              describeObjectForErrorMessage(parent, key),
            );
          } else if (!isSimpleObject(value)) {
            console.error(
              'Only plain objects can be passed to Client Components from Server Components. ' +
                'Classes or other objects with methods are not supported.%s',
              describeObjectForErrorMessage(parent, key),
            );
          } else if (Object.getOwnPropertySymbols) {
            const symbols = Object.getOwnPropertySymbols(value);
            if (symbols.length > 0) {
              console.error(
                'Only plain objects can be passed to Client Components from Server Components. ' +
                  'Objects with symbol properties like %s are not supported.%s',
                symbols[0].description,
                describeObjectForErrorMessage(parent, key),
              );
            }
          }
        }
      }

      // $FlowFixMe[incompatible-return]
      return value;
    }

    if (typeof value === 'string') {
      return escapeStringValue(value);
    }

    if (typeof value === 'boolean' || typeof value === 'number') {
      return value;
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
        formData.set('' + refId, metaDataJSON);
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
    formData.set('0', json);
    if (pendingParts === 0) {
      // $FlowFixMe[incompatible-call] this has already been refined.
      resolve(formData);
    }
  }
}
