/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactModel} from 'react-server/src/ReactFlightServer';
import type {
  BundlerConfig,
  Destination,
} from './ReactFlightNativeRelayServerHostConfig';

import {
  createRequest,
  startWork,
  startFlowing,
} from 'react-server/src/ReactFlightServer';

function render(
  model: ReactModel,
  destination: Destination,
  config: BundlerConfig,
): void {
  const request = createRequest(model, config);
  startWork(request);
  startFlowing(request, destination);
}

export {render};
