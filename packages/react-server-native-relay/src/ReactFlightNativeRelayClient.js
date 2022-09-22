/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {RowEncoding} from './ReactFlightNativeRelayProtocol';

import type {Response} from 'react-client/src/ReactFlightClient';

import {
  createResponse,
  resolveModel,
  resolveModule,
  resolveSymbol,
  resolveError,
  close,
  getRoot,
} from 'react-client/src/ReactFlightClient';

export {createResponse, close, getRoot};

export function resolveRow(response: Response, chunk: RowEncoding): void {
  if (chunk[0] === 'J') {
    // $FlowFixMe `Chunk` doesn't flow into `JSONValue` because of the `E` row type.
    resolveModel(response, chunk[1], chunk[2]);
  } else if (chunk[0] === 'M') {
    // $FlowFixMe `Chunk` doesn't flow into `JSONValue` because of the `E` row type.
    resolveModule(response, chunk[1], chunk[2]);
  } else if (chunk[0] === 'S') {
    // $FlowFixMe: Flow doesn't support disjoint unions on tuples.
    resolveSymbol(response, chunk[1], chunk[2]);
  } else {
    // $FlowFixMe: Flow doesn't support disjoint unions on tuples.
    resolveError(response, chunk[1], chunk[2].message, chunk[2].stack);
  }
}
