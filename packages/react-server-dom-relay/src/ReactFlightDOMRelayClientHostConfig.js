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

import type {ClientReferenceMetadata} from 'ReactFlightDOMRelayClientIntegration';

export type ClientReference<T> = JSResourceReference<T>;

import {
  parseJSONValueString,
  parseJSONValueTuple,
} from 'react-client/src/ReactFlightClient';

export {
  preloadModule,
  requireModule,
} from 'ReactFlightDOMRelayClientIntegration';

import {resolveClientReference as resolveClientReferenceImpl} from 'ReactFlightDOMRelayClientIntegration';

import isArray from 'shared/isArray';

export type {ClientReferenceMetadata} from 'ReactFlightDOMRelayClientIntegration';

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

function parseJSONValueRecursively(
  response: Response,
  parentObj: {+[key: string]: JSONValue} | $ReadOnlyArray<JSONValue>,
  key: string,
  value: JSONValue,
): $FlowFixMe {
  if (typeof value === 'string') {
    return parseJSONValueString(response, parentObj, key, value);
  }
  if (typeof value === 'object' && value !== null) {
    if (isArray(value)) {
      const parsedValue: Array<$FlowFixMe> = [];
      for (let i = 0; i < value.length; i++) {
        (parsedValue: any)[i] = parseJSONValueRecursively(
          response,
          value,
          '' + i,
          value[i],
        );
      }
      return parseJSONValueTuple(response, parsedValue);
    } else {
      const parsedValue = {};
      for (const innerKey in value) {
        (parsedValue: any)[innerKey] = parseJSONValueRecursively(
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

export function parseJSONValue<T>(
  response: Response,
  value: UninitializedValue,
): T {
  return (parseJSONValueRecursively(response, dummy, '', value): any);
}
