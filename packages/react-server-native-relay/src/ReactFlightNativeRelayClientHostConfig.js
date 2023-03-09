/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {JSONValue, ResponseBase} from 'react-client/src/ReactFlightClient';

import type {JSResourceReference} from 'JSResourceReference';

import type {ClientReferenceMetadata} from 'ReactFlightNativeRelayClientIntegration';

export type ClientReference<T> = JSResourceReference<T>;

import {
  parseValueString,
  parseValueTuple,
} from 'react-client/src/ReactFlightClient';

export {
  preloadModule,
  requireModule,
} from 'ReactFlightNativeRelayClientIntegration';

import {resolveClientReference as resolveClientReferenceImpl} from 'ReactFlightNativeRelayClientIntegration';

import isArray from 'shared/isArray';

export type {ClientReferenceMetadata} from 'ReactFlightNativeRelayClientIntegration';

export type SSRManifest = null;
export type ServerManifest = null;
export type ServerReferenceId = string;

export type UninitializedValue = JSONValue;

export type Response = ResponseBase;

export function resolveClientReference<T>(
  ssrManifest: SSRManifest,
  metadata: ClientReferenceMetadata,
): ClientReference<T> {
  return resolveClientReferenceImpl(metadata);
}

export function resolveServerReference<T>(
  serverManifest: ServerManifest,
  id: ServerReferenceId,
): ClientReference<T> {
  throw new Error('Not implemented.');
}

function parseValueRecursively(
  response: Response,
  parentObj: {+[key: string]: JSONValue} | $ReadOnlyArray<JSONValue>,
  key: string,
  value: JSONValue,
): $FlowFixMe {
  if (typeof value === 'string') {
    return parseValueString(response, parentObj, key, value);
  }
  if (typeof value === 'object' && value !== null) {
    if (isArray(value)) {
      const parsedValue: Array<$FlowFixMe> = [];
      for (let i = 0; i < value.length; i++) {
        (parsedValue: any)[i] = parseValueRecursively(
          response,
          value,
          '' + i,
          value[i],
        );
      }
      return parseValueTuple(response, parsedValue);
    } else {
      const parsedValue = {};
      for (const innerKey in value) {
        (parsedValue: any)[innerKey] = parseValueRecursively(
          response,
          value,
          innerKey,
          value[innerKey],
        );
      }
      return parsedValue;
    }
  }
  return value;
}

const dummy = {};

export function parseValue<T>(response: Response, json: UninitializedValue): T {
  return (parseValueRecursively(response, dummy, '', json): any);
}
