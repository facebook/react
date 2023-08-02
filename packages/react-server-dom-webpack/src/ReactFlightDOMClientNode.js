/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  createFromNodeStream,
  createServerReference as createServerReferenceImpl,
} from 'react-server-dom/src/ReactFlightDOMClientNodeStreams';

function noServerCall() {
  throw new Error(
    'Server Functions cannot be called during initial render. ' +
      'This would create a fetch waterfall. Try to use a Server Component ' +
      'to pass data to Client Components instead.',
  );
}

function createServerReference<A: Iterable<any>, T>(
  id: any,
  callServer: any,
): (...A) => Promise<T> {
  return createServerReferenceImpl(id, noServerCall);
}

export {createFromNodeStream, createServerReference};
