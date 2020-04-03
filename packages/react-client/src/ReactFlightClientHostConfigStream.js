/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ResponseBase} from './ReactFlightClient';
import type {StringDecoder} from './ReactFlightClientHostConfig';

export type Response = ResponseBase & {
  partialRow: string,
  fromJSON: (key: string, value: JSONValue) => any,
  stringDecoder: StringDecoder,
};

export type UninitializedModel = string;

export function parseModel<T>(response: Response, json: UninitializedModel): T {
  return JSON.parse(json, response.fromJSON);
}
