/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {RowEncoding, JSONValue} from './ReactFlightNativeRelayProtocol';
import type {Request, ReactModel} from 'react-server/src/ReactFlightServer';
import hasOwnProperty from 'shared/hasOwnProperty';
import isArray from 'shared/isArray';
import type {JSResourceReference} from 'JSResourceReference';
import JSResourceReferenceImpl from 'JSResourceReferenceImpl';

export type ModuleReference<T> = JSResourceReference<T>;

import type {
  Destination,
  BundlerConfig,
  ModuleMetaData,
} from 'ReactFlightNativeRelayServerIntegration';

import {resolveModelToJSON} from 'react-server/src/ReactFlightServer';

import {
  emitRow,
  close,
  resolveModuleMetaData as resolveModuleMetaDataImpl,
} from 'ReactFlightNativeRelayServerIntegration';

export type {
  Destination,
  BundlerConfig,
  ModuleMetaData,
} from 'ReactFlightNativeRelayServerIntegration';

export function isModuleReference(reference: Object): boolean {
  return reference instanceof JSResourceReferenceImpl;
}

export type ModuleKey = ModuleReference<any>;

export function getModuleKey(reference: ModuleReference<any>): ModuleKey {
  // We use the reference object itself as the key because we assume the
  // object will be cached by the bundler runtime.
  return reference;
}

export function resolveModuleMetaData<T>(
  config: BundlerConfig,
  resource: ModuleReference<T>,
): ModuleMetaData {
  return resolveModuleMetaDataImpl(config, resource);
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
  parent: {+[key: string]: ReactModel} | $ReadOnlyArray<ReactModel>,
  key: string,
  model: ReactModel,
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
      // $FlowFixMe no good way to define an empty exact object
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
  model: ReactModel,
): Chunk {
  // $FlowFixMe no good way to define an empty exact object
  const json = convertModelToJSON(request, {}, '', model);
  return ['J', id, json];
}

export function processReferenceChunk(
  request: Request,
  id: number,
  reference: string,
): Chunk {
  return ['J', id, reference];
}

export function processModuleChunk(
  request: Request,
  id: number,
  moduleMetaData: ModuleMetaData,
): Chunk {
  // The moduleMetaData is already a JSON serializable value.
  return ['M', id, moduleMetaData];
}

export function processProviderChunk(
  request: Request,
  id: number,
  contextName: string,
): Chunk {
  return ['P', id, contextName];
}

export function processSymbolChunk(
  request: Request,
  id: number,
  name: string,
): Chunk {
  return ['S', id, name];
}

export function scheduleWork(callback: () => void) {
  callback();
}

export function flushBuffered(destination: Destination) {}

export function beginWriting(destination: Destination) {}

export function writeChunk(destination: Destination, chunk: Chunk): void {
  // $FlowFixMe `Chunk` doesn't flow into `JSONValue` because of the `E` row type.
  emitRow(destination, chunk);
}

export function writeChunkAndReturn(
  destination: Destination,
  chunk: Chunk,
): boolean {
  // $FlowFixMe `Chunk` doesn't flow into `JSONValue` because of the `E` row type.
  emitRow(destination, chunk);
  return true;
}

export function completeWriting(destination: Destination) {}

export {close};

export function closeWithError(destination: Destination, error: mixed): void {
  close(destination);
}
