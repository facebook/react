/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactClientValue} from 'react-server/src/ReactFlightServer';
import type {
  Destination,
  Chunk,
  PrecomputedChunk,
} from 'react-server/src/ReactServerStreamConfig';

import {setCheckIsClientReference} from './ReactFlightReferencesFB';

import {
  createRequest,
  startWork,
  startFlowing,
} from 'react-server/src/ReactFlightServer';

import {setByteLengthOfChunkImplementation} from 'react-server/src/ReactServerStreamConfig';

export {
  registerClientReference,
  registerServerReference,
  getRequestedClientReferencesKeys,
  clearRequestedClientReferencesKeysSet,
  setCheckIsClientReference,
} from './ReactFlightReferencesFB';

type Options = {
  onError?: (error: mixed) => void,
};

function renderToDestination(
  destination: Destination,
  model: ReactClientValue,
  options?: Options,
): void {
  if (!configured) {
    throw new Error(
      'Please make sure to call `setConfig(...)` before calling `renderToDestination`.',
    );
  }
  const request = createRequest(
    model,
    null,
    options ? options.onError : undefined,
    undefined,
    undefined,
  );
  startWork(request);
  startFlowing(request, destination);
}

type Config = {
  byteLength: (chunk: Chunk | PrecomputedChunk) => number,
  isClientReference: (reference: mixed) => boolean,
};

let configured = false;

function setConfig(config: Config): void {
  setByteLengthOfChunkImplementation(config.byteLength);
  setCheckIsClientReference(config.isClientReference);
  configured = true;
}

export {renderToDestination, setConfig};
