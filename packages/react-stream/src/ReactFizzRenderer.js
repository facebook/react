/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {RequestInfo} from './ReactFizzHostConfig';
import {scheduleWork, writeBuffer} from './ReactFizzHostConfig';
import {formatChunk} from './ReactFizzFormatConfig';

type OpaqueRequest = {requestInfo: RequestInfo};

export function createRequest(requestInfo: RequestInfo): OpaqueRequest {
  return {requestInfo};
}

function performWork(request: OpaqueRequest): void {
  writeBuffer(request.requestInfo, formatChunk());
}

export function flushChunk(request: OpaqueRequest): void {
  scheduleWork(() => performWork(request));
}
