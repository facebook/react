/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactModel} from 'react-server/src/ReactFlightServer';
import type {BundlerConfig} from './ReactFlightServerWebpackBundlerConfig';
import type {Destination} from 'react-server/src/ReactServerStreamConfigNext';

import {
  createRequest,
  startWork,
  startFlowing,
} from 'react-server/src/ReactFlightServer';

type NextStreamSource = {
  start: (controller: Destination) => void,
  pull: (controller: Destination) => void,
  cancel: (reason: mixed) => void,
};

type Options = {
  onError?: (error: mixed) => void,
};

function renderToNextStream(
  model: ReactModel,
  webpackMap: BundlerConfig,
  options?: Options,
): NextStreamSource {
  const request = createRequest(
    model,
    webpackMap,
    options ? options.onError : undefined,
  );
  const stream = {
    start(controller) {
      startWork(request);
    },
    pull(controller) {
      startFlowing(request, controller);
    },
    cancel(reason) {},
  };
  return stream;
}

export {renderToNextStream};
