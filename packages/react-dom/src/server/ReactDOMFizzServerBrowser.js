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
  abort,
} from 'react-server/src/ReactFizzServer';

type Controls = {
  stream: ReadableStream,
  abort(): void,
};

function renderToReadableStream(children: ReactNodeList): Controls {
  let request;
  const stream = new ReadableStream({
    start(controller) {
      request = createRequest(children, controller);
      startWork(request);
    },
    pull(controller) {
      startFlowing(request);
    },
    cancel(reason) {},
  });
  return {
    stream,
    abort() {
      abort(request);
    },
  };
}

export {renderToReadableStream};
