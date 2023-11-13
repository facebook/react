/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactClientValue} from 'react-server/src/ReactFlightServer';
import type {Destination} from 'react-server/src/ReactServerStreamConfig';
import type {ClientManifest} from './ReactFlightReferencesFB';

import {
  createRequest,
  startWork,
  startFlowing,
} from 'react-server/src/ReactFlightServer';

export {
  registerClientReference,
  registerServerReference,
} from './ReactFlightReferencesFB';

type Options = {
  onError?: (error: mixed) => void,
};

function renderToDestination(
  destination: Destination,
  model: ReactClientValue,
  bundlerConfig: ClientManifest,
  options?: Options,
): void {
  const request = createRequest(
    model,
    bundlerConfig,
    options ? options.onError : undefined,
  );
  startWork(request);
  startFlowing(request, destination);
}

export {renderToDestination};
