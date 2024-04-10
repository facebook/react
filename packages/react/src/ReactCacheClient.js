/**
 * Copyright (c) Meta Platforms, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {disableClientCache} from 'shared/ReactFeatureFlags';
import {cache as cacheImpl} from './ReactCacheImpl';

export function noopCache<A: Iterable<mixed>, T>(fn: (...A) => T): (...A) => T {
  // On the client (i.e. not a Server Components environment) `cache` has
  // no caching behavior. We just return the function as-is.
  //
  // We intend to implement client caching in a future major release. In the
  // meantime, it's only exposed as an API so that Shared Components can use
  // per-request caching on the server without breaking on the client. But it
  // does mean they need to be aware of the behavioral difference.
  //
  // The rest of the behavior is the same as the server implementation — it
  // returns a new reference, extra properties like `displayName` are not
  // preserved, the length of the new function is 0, etc. That way apps can't
  // accidentally depend on those details.
  return function () {
    // $FlowFixMe[incompatible-call]: We don't want to use rest arguments since we transpile the code.
    return fn.apply(null, arguments);
  };
}

export const cache: typeof noopCache = disableClientCache
  ? noopCache
  : cacheImpl;
