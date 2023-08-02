/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'shared/ReactTypes.js';

import type {Response} from 'react-client/src/ReactFlightClient';
import type {SSRManifest} from 'react-client/src/ReactFlightClientConfig';

import type {Readable} from 'stream';

import {
  createResponse,
  getRoot,
  reportGlobalError,
  processBinaryChunk,
  close,
} from 'react-client/src/ReactFlightClient';

import {createServerReference} from 'react-client/src/ReactFlightReplyClient';

type CallServerCallback = <A, T>(string, args: A) => Promise<T>;

function createFromNodeStream<T>(
  stream: Readable,
  moduleRootPath: SSRManifest,
  callServer: void | CallServerCallback,
): Thenable<T> {
  const response: Response = createResponse(moduleRootPath, callServer);
  stream.on('data', chunk => {
    processBinaryChunk(response, chunk);
  });
  stream.on('error', error => {
    reportGlobalError(response, error);
  });
  stream.on('end', () => close(response));
  return getRoot(response);
}

export {createFromNodeStream, createServerReference};
