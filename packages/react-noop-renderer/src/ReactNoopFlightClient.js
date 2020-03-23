/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * This is a renderer of React that doesn't have a render target output.
 * It is useful to demonstrate the internals of the reconciler in isolation
 * and for testing semantics of reconciliation separate from the host
 * environment.
 */

import type {ReactModelRoot} from 'react-client/flight';

import {readModule} from 'react-noop-renderer/flight-modules';

import ReactFlightClient from 'react-client/flight';

type Source = Array<string>;

const {
  createResponse,
  getModelRoot,
  processStringChunk,
  close,
} = ReactFlightClient({
  supportsBinaryStreams: false,
  resolveModuleReference(idx: string) {
    return idx;
  },
  preloadModule(idx: string) {},
  requireModule(idx: string) {
    return readModule(idx);
  },
});

function read<T>(source: Source): ReactModelRoot<T> {
  let response = createResponse(source);
  for (let i = 0; i < source.length; i++) {
    processStringChunk(response, source[i], 0);
  }
  close(response);
  return getModelRoot(response);
}

export {read};
