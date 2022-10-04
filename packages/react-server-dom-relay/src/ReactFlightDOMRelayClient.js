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
  resolveSymbol,
  resolveErrorDev,
  resolveErrorProd,
  close,
  getRoot,
} from 'react-client/src/ReactFlightClient';

export {createResponse, close, getRoot};

export function resolveRow(response: Response, chunk: RowEncoding): void {
  if (chunk[0] === 'J') {
    // $FlowFixMe unable to refine on array indices
    resolveModel(response, chunk[1], chunk[2]);
  } else if (chunk[0] === 'M') {
    // $FlowFixMe unable to refine on array indices
    resolveModule(response, chunk[1], chunk[2]);
  } else if (chunk[0] === 'S') {
    // $FlowFixMe: Flow doesn't support disjoint unions on tuples.
    resolveSymbol(response, chunk[1], chunk[2]);
  } else {
    if (__DEV__) {
      resolveErrorDev(
        response,
        chunk[1],
        // $FlowFixMe: Flow doesn't support disjoint unions on tuples.
        chunk[2].digest,
        // $FlowFixMe: Flow doesn't support disjoint unions on tuples.
        chunk[2].message || '',
        // $FlowFixMe: Flow doesn't support disjoint unions on tuples.
        chunk[2].stack || '',
      );
    } else {
      // $FlowFixMe: Flow doesn't support disjoint unions on tuples.
      resolveErrorProd(response, chunk[1], chunk[2].digest);
    }
  }
}
