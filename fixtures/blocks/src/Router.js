/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {
  useReducer,
  useEffect,
  useTransition,
  useCallback,
  useMemo,
  Suspense,
} from 'react';
import {createCache, CacheProvider} from 'react/unstable-cache';
import {RouterProvider} from './client/RouterContext';
// TODO: entry point. This can't really done in the client code.
import loadApp from './server/App.block';

const initialUrl = window.location.pathname;

const initialState = {
  // TODO: use this for invalidation.
  cache: createCache(),
  url: initialUrl,
  RootBlock: loadApp(initialUrl),
};

function reducer(state, action) {
  switch (action.type) {
    case 'navigate':
      // TODO: cancel previous fetch?
      return {
        cache: state.cache,
        url: action.url,
        RootBlock: loadApp(action.url),
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

  useEffect(() => {
    document.body.style.cursor = isPending ? 'wait' : '';
  }, [isPending]);

  const navigate = useCallback(
    url => {
      startTransition(() => {
        // TODO: Here, There, and Everywhere.
        // TODO: Instant Transitions, somehow.
        // TODO: Buttons should update immediately.
        dispatch({
          type: 'navigate',
          url,
        });
      });
    },
    [startTransition]
  );

  useEffect(() => {
    const listener = () => {
      navigate(window.location.pathname);
    };
    window.addEventListener('popstate', listener);
    return () => window.removeEventListener('popstate', listener);
  }, [navigate]);

  const routeContext = useMemo(
    () => ({
      url: state.url,
      navigate,
    }),
    [state.url, navigate]
  );

  return (
    <Suspense fallback={<h2>Loading...</h2>}>
      <CacheProvider value={state.cache}>
        <RouterProvider value={routeContext}>
          <state.RootBlock />
        </RouterProvider>
      </CacheProvider>
    </Suspense>
  );
}

export default Router;
