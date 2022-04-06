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
import type {Writable} from 'stream';
import type {ServerContextJSONValue} from 'shared/ReactTypes';

import {
  createRequest,
  startWork,
  startFlowing,
} from 'react-server/src/ReactFlightServer';

function createDrainHandler(destination, request) {
  return () => startFlowing(request, destination);
}

type Options = {
  onError?: (error: mixed) => void,
};

type PipeableStream = {|
  pipe<T: Writable>(destination: T): T,
|};

function renderToPipeableStream(
  model: ReactModel,
  webpackMap: BundlerConfig,
  options?: Options,
  context?: Array<[string, ServerContextJSONValue]>,
): PipeableStream {
  const request = createRequest(
    model,
    webpackMap,
    options ? options.onError : undefined,
    context,
  );
  let hasStartedFlowing = false;
  startWork(request);
  return {
    pipe<T: Writable>(destination: T): T {
      if (hasStartedFlowing) {
        throw new Error(
          'React currently only supports piping to one writable stream.',
        );
      }
      hasStartedFlowing = true;
      startFlowing(request, destination);
      destination.on('drain', createDrainHandler(destination, request));
      return destination;
    },
  };
}

export {renderToPipeableStream};
