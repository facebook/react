/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList} from 'shared/ReactTypes';

import {
  createRequest,
  startWork,
  startFlowing,
} from 'react-stream/inline.dom-browser';

function renderToReadableStream(children: ReactNodeList): ReadableStream {
  let request;
  return new ReadableStream({
    start(controller) {
      request = createRequest(children, controller);
      startWork(request);
    },
    pull(controller) {
      startFlowing(request, controller.desiredSize);
    },
    cancel(reason) {},
  });
}

export default {
  renderToReadableStream,
};
