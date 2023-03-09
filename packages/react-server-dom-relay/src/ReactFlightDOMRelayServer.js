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
  ClientManifest,
  Destination,
} from './ReactFlightDOMRelayServerHostConfig';

import {
  createRequest,
  startWork,
  startFlowing,
} from 'react-server/src/ReactFlightServer';

type Options = {
  onError?: (error: mixed) => void,
  identifierPrefix?: string,
};

function render(
  model: ReactClientValue,
  destination: Destination,
  config: ClientManifest,
  options?: Options,
): void {
  const request = createRequest(
    model,
    config,
    options ? options.onError : undefined,
    undefined, // not currently set up to supply context overrides
    options ? options.identifierPrefix : undefined,
  );
  startWork(request);
  startFlowing(request, destination);
}

export {render};
