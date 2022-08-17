/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactModel} from 'react-server/src/ReactFlightServer';
import type {ServerContextJSONValue} from 'shared/ReactTypes';

import {__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as ReactSharedInternals} from 'react';

import {
  createRequest,
  startWork,
  startFlowing,
  abort,
} from 'react-server/src/ReactFlightServer';

type Options = {
  identifierPrefix?: string,
  signal?: AbortSignal,
  context?: Array<[string, ServerContextJSONValue]>,
  onError?: (error: mixed) => void,
};

function renderToReadableStream(
  model: ReactModel,
  options?: Options,
): ReadableStream {
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
    options ? options.context : undefined,
    options ? options.identifierPrefix : undefined,
  );
  if (options && options.signal) {
    const signal = options.signal;
    if (signal.aborted) {
      abort(request, (signal: any).reason);
    } else {
      const listener = () => {
        abort(request, (signal: any).reason);
        signal.removeEventListener('abort', listener);
      };
      signal.addEventListener('abort', listener);
    }
  }
  const stream = new ReadableStream(
    {
      type: 'bytes',
      start(controller) {
        startWork(request);
      },
      pull(controller) {
        startFlowing(request, controller);
      },
      cancel(reason) {},
    },
    // $FlowFixMe size() methods are not allowed on byte streams.
    {highWaterMark: 0},
  );
  return stream;
}

export {renderToReadableStream};
