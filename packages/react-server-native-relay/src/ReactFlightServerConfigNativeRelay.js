/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {RowEncoding, JSONValue} from './ReactFlightNativeRelayProtocol';
import type {
  Request,
  ReactClientValue,
} from 'react-server/src/ReactFlightServer';
import hasOwnProperty from 'shared/hasOwnProperty';
import isArray from 'shared/isArray';
import type {JSResourceReference} from 'JSResourceReference';
import JSResourceReferenceImpl from 'JSResourceReferenceImpl';

export type ClientReference<T> = JSResourceReference<T>;
export type ServerReference<T> = T;
export type ServerReferenceId = {};

import type {
  Destination,
  BundlerConfig as ClientManifest,
  ClientReferenceMetadata,
} from 'ReactFlightNativeRelayServerIntegration';

import {resolveModelToJSON} from 'react-server/src/ReactFlightServer';

import {
  emitRow,
  close,
  resolveClientReferenceMetadata as resolveClientReferenceMetadataImpl,
} from 'ReactFlightNativeRelayServerIntegration';

export type {
  Destination,
  BundlerConfig as ClientManifest,
  ClientReferenceMetadata,
} from 'ReactFlightNativeRelayServerIntegration';

export function isClientReference(reference: Object): boolean {
  return reference instanceof JSResourceReferenceImpl;
}

export function isServerReference(reference: Object): boolean {
  return false;
}

export type ClientReferenceKey = ClientReference<any>;

export function getClientReferenceKey(
  reference: ClientReference<any>,
): ClientReferenceKey {
  // We use the reference object itself as the key because we assume the
  // object will be cached by the bundler runtime.
  return reference;
}

export function resolveClientReferenceMetadata<T>(
  config: ClientManifest,
  resource: ClientReference<T>,
): ClientReferenceMetadata {
  return resolveClientReferenceMetadataImpl(config, resource);
}

export function getServerReferenceId<T>(
  config: ClientManifest,
  resource: ServerReference<T>,
): ServerReferenceId {
  throw new Error('Not implemented.');
}

export function getServerReferenceBoundArguments<T>(
  config: ClientManifest,
  resource: ServerReference<T>,
): Array<ReactClientValue> {
  throw new Error('Not implemented.');
}

export type Chunk = RowEncoding;

export function processErrorChunkProd(
  request: Request,
  id: number,
  digest: string,
): Chunk {
  if (__DEV__) {
    // These errors should never make it into a build so we don't need to encode them in codes.json
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'processErrorChunkProd should never be called while in development mode. Use processErrorChunkDev instead. This is a bug in React.',
    );
  }

  return [
    'E',
    id,
    {
      digest,
    },
  ];
}
export function processErrorChunkDev(
  request: Request,
  id: number,
  digest: string,
  message: string,
  stack: string,
): Chunk {
  if (!__DEV__) {
    // These errors should never make it into a build so we don't need to encode them in codes.json
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'processErrorChunkDev should never be called while in production mode. Use processErrorChunkProd instead. This is a bug in React.',
    );
  }

  return [
    'E',
    id,
    {
      digest,
      message,
      stack,
    },
  ];
}

function convertModelToJSON(
  request: Request,
  parent: {+[key: string]: ReactClientValue} | $ReadOnlyArray<ReactClientValue>,
  key: string,
  model: ReactClientValue,
): JSONValue {
  const json = resolveModelToJSON(request, parent, key, model);
  if (typeof json === 'object' && json !== null) {
    if (isArray(json)) {
      const jsonArray: Array<JSONValue> = [];
      for (let i = 0; i < json.length; i++) {
        jsonArray[i] = convertModelToJSON(request, json, '' + i, json[i]);
      }
      return jsonArray;
    } else {
      const jsonObj: {[key: string]: JSONValue} = {};
      for (const nextKey in json) {
        if (hasOwnProperty.call(json, nextKey)) {
          jsonObj[nextKey] = convertModelToJSON(
            request,
            json,
            nextKey,
            json[nextKey],
          );
        }
      }
      return jsonObj;
    }
  }
  return json;
}

export function processModelChunk(
  request: Request,
  id: number,
  model: ReactClientValue,
): Chunk {
  const json = convertModelToJSON(request, {}, '', model);
  return ['O', id, json];
}

export function processReferenceChunk(
  request: Request,
  id: number,
  reference: string,
): Chunk {
  return ['O', id, reference];
}

export function processImportChunk(
  request: Request,
  id: number,
  clientReferenceMetadata: ClientReferenceMetadata,
): Chunk {
  // The clientReferenceMetadata is already a JSON serializable value.
  return ['I', id, clientReferenceMetadata];
}

export function scheduleWork(callback: () => void) {
  callback();
}

export function flushBuffered(destination: Destination) {}

export const supportsRequestStorage = false;
export const requestStorage: AsyncLocalStorage<Map<Function, mixed>> =
  (null: any);

export function beginWriting(destination: Destination) {}

export function writeChunk(destination: Destination, chunk: Chunk): void {
  // $FlowFixMe[incompatible-call] `Chunk` doesn't flow into `JSONValue` because of the `E` row type.
  emitRow(destination, chunk);
}

export function writeChunkAndReturn(
  destination: Destination,
  chunk: Chunk,
): boolean {
  // $FlowFixMe[incompatible-call] `Chunk` doesn't flow into `JSONValue` because of the `E` row type.
  emitRow(destination, chunk);
  return true;
}

export function completeWriting(destination: Destination) {}

export {close};

export function closeWithError(destination: Destination, error: mixed): void {
  close(destination);
}
