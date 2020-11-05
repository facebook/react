/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
  | {
      type: 'json',
      id: number,
      json: JSONValue,
    }
  | {
      type: 'module',
      id: number,
      json: ModuleMetaData,
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
