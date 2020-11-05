/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {RowEncoding} from './ReactFlightDOMRelayProtocol';

import type {Response} from 'react-client/src/ReactFlightClient';

import {
  createResponse,
  resolveModel,
  resolveModule,
  resolveError,
  close,
} from 'react-client/src/ReactFlightClient';

export {createResponse, close};

export function resolveRow(response: Response, chunk: RowEncoding): void {
  if (chunk.type === 'json') {
    resolveModel(response, chunk.id, chunk.json);
  } else if (chunk.type === 'module') {
    resolveModule(response, chunk.id, chunk.json);
  } else {
    resolveError(response, chunk.id, chunk.json.message, chunk.json.stack);
  }
}
