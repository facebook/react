/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {JSONValue, ResponseBase} from 'react-client/src/ReactFlightClient';

import {
  parseModelString,
  parseModelTuple,
} from 'react-client/src/ReactFlightClient';

export {
  resolveModuleReference,
  preloadModule,
  requireModule,
} from 'ReactFlightDOMRelayClientIntegration';

export type {
  ModuleReference,
  ModuleMetaData,
} from 'ReactFlightDOMRelayClientIntegration';

export opaque type UninitializedModel = JSONValue;

export type Response<T> = ResponseBase<T>;

function parseModelRecursively<T>(response: Response<T>, parentObj, value) {
  if (typeof value === 'string') {
    return parseModelString(response, parentObj, value);
  }
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        (value: any)[i] = parseModelRecursively(response, value, value[i]);
      }
      return parseModelTuple(response, value);
    } else {
      for (const innerKey in value) {
        (value: any)[innerKey] = parseModelRecursively(
          response,
          value,
          value[innerKey],
        );
      }
    }
  }
  return value;
}

const dummy = {};

export function parseModel<T, R>(
  response: Response<R>,
  json: UninitializedModel,
): T {
  return (parseModelRecursively(response, dummy, json): any);
}
