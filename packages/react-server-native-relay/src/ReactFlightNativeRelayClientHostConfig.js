/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {JSONValue, ResponseBase} from 'react-client/src/ReactFlightClient';

import type {JSResourceReference} from 'JSResourceReference';

import type {ModuleMetaData} from 'ReactFlightNativeRelayClientIntegration';

export type ModuleReference<T> = JSResourceReference<T>;

import {
  parseModelString,
  parseModelTuple,
} from 'react-client/src/ReactFlightClient';

export {
  preloadModule,
  requireModule,
} from 'ReactFlightNativeRelayClientIntegration';

import {resolveModuleReference as resolveModuleReferenceImpl} from 'ReactFlightNativeRelayClientIntegration';

import isArray from 'shared/isArray';

export type {ModuleMetaData} from 'ReactFlightNativeRelayClientIntegration';

export type BundlerConfig = null;

export type UninitializedModel = JSONValue;

export type Response = ResponseBase;

export function resolveModuleReference<T>(
  bundlerConfig: BundlerConfig,
  moduleData: ModuleMetaData,
): ModuleReference<T> {
  return resolveModuleReferenceImpl(moduleData);
}

function parseModelRecursively(response: Response, parentObj, key, value) {
  if (typeof value === 'string') {
    return parseModelString(response, parentObj, key, value);
  }
  if (typeof value === 'object' && value !== null) {
    if (isArray(value)) {
      const parsedValue = [];
      for (let i = 0; i < value.length; i++) {
        (parsedValue: any)[i] = parseModelRecursively(
          response,
          value,
          '' + i,
          value[i],
        );
      }
      return parseModelTuple(response, parsedValue);
    } else {
      const parsedValue = {};
      for (const innerKey in value) {
        (parsedValue: any)[innerKey] = parseModelRecursively(
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

export function parseModel<T>(response: Response, json: UninitializedModel): T {
  return (parseModelRecursively(response, dummy, '', json): any);
}
