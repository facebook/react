/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ResponseBase} from './ReactFlightClient';
import type {StringDecoder} from './ReactFlightClientHostConfig';

export type Response = ResponseBase & {
  _partialRow: string,
  _fromJSON: (key: string, value: JSONValue) => any,
  _stringDecoder: StringDecoder,
};

export type UninitializedValue = string;

export function parseJSONValue<T>(
  response: Response,
  value: UninitializedValue,
): T {
  return JSON.parse(value, response._fromJSON);
}
