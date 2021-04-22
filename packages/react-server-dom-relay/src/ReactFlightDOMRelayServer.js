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
} from './ReactFlightDOMRelayServerHostConfig';

import {createRequest, startWork} from 'react-server/src/ReactFlightServer';

type Options = {
  onError?: (error: mixed) => void,
};

function render(
  model: ReactModel,
  destination: Destination,
  config: BundlerConfig,
  options?: Options,
): void {
  const request = createRequest(
    model,
    destination,
    config,
    options ? options.onError : undefined,
  );
  startWork(request);
}

export {render};
