/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useReducer, useEffect, useTransition, Suspense} from 'react';
import loadFeed from './server/Feed.block';
import {createCache, CacheProvider} from 'react/unstable-cache';

const initialState = {
  // TODO: use this for invalidation.
  cache: createCache(),
  params: {},
  RootBlock: loadFeed({}),
};

function reducer(state, action) {
  switch (action.type) {
    case 'navigate':
      // TODO: cancel previous fetch?
      return {
        cache: state.cache,
        params: action.nextParams,
        RootBlock: loadFeed(action.nextParams),
      };
    default:
      throw new Error();
  }
}

function Router() {
  const [state /*dispatch*/] = useReducer(reducer, initialState);
  const [, /*startTransition*/ isPending] = useTransition({
    timeoutMs: 3000,
  });

  useEffect(() => {
    document.body.style.cursor = isPending ? 'wait' : '';
  }, [isPending]);

  return (
    <Suspense fallback={<h2>Loading...</h2>}>
      <CacheProvider value={state.cache}>
        <state.RootBlock />
      </CacheProvider>
    </Suspense>
  );
}

function Root() {
  return (
    <Suspense fallback={<h1>Loading App...</h1>}>
      <Router />
    </Suspense>
  );
}

export default Root;
