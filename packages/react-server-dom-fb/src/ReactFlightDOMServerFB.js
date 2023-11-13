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
  model: ReactClientValue,
  bundlerConfig: ClientManifest,
  options?: Options,
): Destination {
  const destination: Destination = {
    buffer: '',
    done: false,
    fatal: false,
    error: null,
  };
  const request = createRequest(
    model,
    bundlerConfig,
    options ? options.onError : undefined,
  );
  startWork(request);
  startFlowing(request, destination);
  return destination;
}

export {renderToDestination};
