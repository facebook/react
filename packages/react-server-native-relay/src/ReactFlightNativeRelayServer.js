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
} from './ReactFlightNativeRelayServerHostConfig';

import {
  createRequest,
  startWork,
  startFlowing,
} from 'react-server/src/ReactFlightServer';

function render(
  model: ReactClientValue,
  destination: Destination,
  config: ClientManifest,
): void {
  const request = createRequest(model, config);
  startWork(request);
  startFlowing(request, destination);
}

export {render};
