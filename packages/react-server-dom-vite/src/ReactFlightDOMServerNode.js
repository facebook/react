/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactModel} from 'react-server/src/ReactFlightServer';
import type {Writable} from 'stream';
import type {ServerContextJSONValue} from 'shared/ReactTypes';

import {__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as ReactSharedInternals} from 'react';

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
  options?: Options,
  context?: Array<[string, ServerContextJSONValue]>,
): PipeableStream {
  const request = createRequest(
    // Wrap root in a dummy element that simply adds a flag
    // to the current dispatcher to check later in the proxies.
    {
      ...model,
      $$typeof: Symbol.for('react.element'),
      props: {children: model},
      type: () => {
        ReactSharedInternals.ReactCurrentDispatcher.current.isRsc = true;
        return model;
      },
    },
    {}, // Manifest, not used
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
