/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useReducer, useTransition, Suspense} from 'react';
import loadPost from './Post';
import {createCache, CacheProvider} from './lib/cache';

const initialState = {
  cache: createCache(),
  params: {id: 1},
  RootBlock: loadPost({id: 1}),
};

function reducer(state, action) {
  switch (action.type) {
    case 'navigate':
      // TODO: cancel previous fetch?
      return {
        cache: state.cache,
        params: action.nextParams,
        RootBlock: loadPost(action.nextParams),
      };
    default:
      throw new Error();
  }
}

function Router() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [startTransition, isPending] = useTransition({
    timeoutMs: 3000,
  });
  return (
    <>
      <button
        disabled={isPending}
        onClick={() => {
          startTransition(() => {
            dispatch({
              type: 'navigate',
              nextParams: {
                id: state.params.id === 3 ? 1 : state.params.id + 1,
              },
            });
          });
        }}>
        Next
      </button>
      {isPending && ' ...'}
      <hr />
      <Suspense fallback={<h4>Loading Page...</h4>}>
        <CacheProvider value={state.cache}>
          <state.RootBlock />
        </CacheProvider>
      </Suspense>
    </>
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
