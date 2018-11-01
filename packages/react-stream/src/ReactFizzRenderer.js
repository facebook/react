/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {RequestInfo} from './ReactFizzHostConfig';
import {ping, write} from './ReactFizzHostConfig';

type OpaqueRequest = {requestInfo: RequestInfo};

export function createRequest(requestInfo: RequestInfo): OpaqueRequest {
  return {requestInfo};
}

export function readBuffer(request: OpaqueRequest): void {
  ping(request.requestInfo);
  write(request.requestInfo);
}
