/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Request, ReactModel} from 'react-server/src/ReactFlightServer';

import type {
  Destination,
  BundlerConfig,
  ModuleReference,
  ModuleMetaData,
} from 'ReactFlightDOMRelayServerIntegration';

import {resolveModelToJSON} from 'react-server/src/ReactFlightServer';

import {
  emitModel,
  emitError,
  resolveModuleMetaData as resolveModuleMetaDataImpl,
} from 'ReactFlightDOMRelayServerIntegration';

export type {
  Destination,
  BundlerConfig,
  ModuleReference,
  ModuleMetaData,
} from 'ReactFlightDOMRelayServerIntegration';

export function resolveModuleMetaData<T>(
  config: BundlerConfig,
  resource: ModuleReference<T>,
): ModuleMetaData {
  return resolveModuleMetaDataImpl(config, resource);
}

type JSONValue =
  | string
  | number
  | boolean
  | null
  | {+[key: string]: JSONValue}
  | Array<JSONValue>;

export type Chunk =
  | {
      type: 'json',
      id: number,
      json: JSONValue,
    }
  | {
      type: 'error',
      id: number,
      json: {
        message: string,
        stack: string,
        ...
      },
    };

export function processErrorChunk(
  request: Request,
  id: number,
  message: string,
  stack: string,
): Chunk {
  return {
    type: 'error',
    id: id,
    json: {
      message,
      stack,
    },
  };
}

function convertModelToJSON(
  request: Request,
  parent: {+[key: string]: ReactModel} | $ReadOnlyArray<ReactModel>,
  key: string,
  model: ReactModel,
): JSONValue {
  const json = resolveModelToJSON(request, parent, key, model);
  if (typeof json === 'object' && json !== null) {
    if (Array.isArray(json)) {
      const jsonArray: Array<JSONValue> = [];
      for (let i = 0; i < json.length; i++) {
        jsonArray[i] = convertModelToJSON(request, json, '' + i, json[i]);
      }
      return jsonArray;
    } else {
      const jsonObj: {[key: string]: JSONValue} = {};
      for (const nextKey in json) {
        jsonObj[nextKey] = convertModelToJSON(
          request,
          json,
          nextKey,
          json[nextKey],
        );
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
  const json = convertModelToJSON(request, {}, '', model);
  return {
    type: 'json',
    id: id,
    json: json,
  };
}

export function scheduleWork(callback: () => void) {
  callback();
}

export function flushBuffered(destination: Destination) {}

export function beginWriting(destination: Destination) {}

export function writeChunk(destination: Destination, chunk: Chunk): boolean {
  if (chunk.type === 'json') {
    emitModel(destination, chunk.id, chunk.json);
  } else {
    emitError(destination, chunk.id, chunk.json.message, chunk.json.stack);
  }
  return true;
}

export function completeWriting(destination: Destination) {}

export {close} from 'ReactFlightDOMRelayServerIntegration';
