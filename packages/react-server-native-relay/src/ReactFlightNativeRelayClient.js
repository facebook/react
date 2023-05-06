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
  resolveErrorDev,
  resolveErrorProd,
  close,
  getRoot,
} from 'react-client/src/ReactFlightClient';

export {createResponse, close, getRoot};

export function resolveRow(response: Response, chunk: RowEncoding): void {
  if (chunk[0] === 'O') {
    // $FlowFixMe[incompatible-call] `Chunk` doesn't flow into `JSONValue` because of the `E` row type.
    resolveModel(response, chunk[1], chunk[2]);
  } else if (chunk[0] === 'I') {
    // $FlowFixMe[incompatible-call] `Chunk` doesn't flow into `JSONValue` because of the `E` row type.
    resolveModule(response, chunk[1], chunk[2]);
  } else {
    if (__DEV__) {
      resolveErrorDev(
        response,
        chunk[1],
        // $FlowFixMe[incompatible-call]: Flow doesn't support disjoint unions on tuples.
        // $FlowFixMe[incompatible-use]
        // $FlowFixMe[prop-missing]
        chunk[2].digest,
        // $FlowFixMe[incompatible-call]: Flow doesn't support disjoint unions on tuples.
        // $FlowFixMe[incompatible-use]
        chunk[2].message || '',
        // $FlowFixMe[incompatible-call]: Flow doesn't support disjoint unions on tuples.
        // $FlowFixMe[incompatible-use]
        chunk[2].stack || '',
      );
    } else {
      // $FlowFixMe[incompatible-call]: Flow doesn't support disjoint unions on tuples.
      // $FlowFixMe[incompatible-use]
      // $FlowFixMe[prop-missing]
      resolveErrorProd(response, chunk[1], chunk[2].digest);
    }
  }
}
