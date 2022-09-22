/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ModuleMetaData} from 'ReactFlightNativeRelayServerIntegration';

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | {+[key: string]: JSONValue}
  | Array<JSONValue>;

export type RowEncoding =
  | ['J', number, JSONValue]
  | ['M', number, ModuleMetaData]
  | ['P', number, string]
  | ['S', number, string]
  | [
      'E',
      number,
      {
        message: string,
        stack: string,
        ...
      },
    ];
