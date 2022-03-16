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

import {
  createRequest,
  startWork,
  startFlowing,
} from 'react-server/src/ReactFlightServer';

type Options = {
  onError?: (error: mixed) => void,
};

function renderToReadableStream(
  model: ReactModel,
  options?: Options,
  context?: Array<[string, ServerContextJSONValue]>,
): ReadableStream {
  const request = createRequest(
    model,
    {}, // Manifest, not used
    options ? options.onError : undefined,
    context,
  );
  const stream = new ReadableStream({
    start(controller) {
      startWork(request);
    },
    pull(controller) {
      // Pull is called immediately even if the stream is not passed to anything.
      // That's buffering too early. We want to start buffering once the stream
      // is actually used by something so we can give it the best result possible
      // at that point.
      if (stream.locked) {
        startFlowing(request, controller);
      }
    },
    cancel(reason) {},
  });
  return stream;
}

export {renderToReadableStream};
