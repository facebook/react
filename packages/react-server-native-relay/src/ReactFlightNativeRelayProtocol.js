/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ClientReferenceMetadata} from 'ReactFlightNativeRelayServerIntegration';

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | {+[key: string]: JSONValue}
  | Array<JSONValue>;

export type RowEncoding =
  | ['O', number, JSONValue]
  | ['I', number, ClientReferenceMetadata]
  | ['P', number, string]
  | ['S', number, string]
  | [
      'E',
      number,
      {
        digest: string,
        message?: string,
        stack?: string,
        ...
      },
    ];
