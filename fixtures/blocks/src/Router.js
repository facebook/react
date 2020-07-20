/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {
  useReducer,
  useEffect,
  unstable_useTransition as useTransition,
  useCallback,
  useMemo,
  Suspense,
} from 'react';
import {createCache, CacheProvider} from 'react/unstable-cache';
import {RouterProvider} from './client/RouterContext';
// TODO: can't really import a server component on the client.
import App from './server/App';

const initialUrl = window.location.pathname;
const initialState = {
  // TODO: use this for invalidation.
  cache: createCache(),
  url: initialUrl,
  pendingUrl: initialUrl,
  root: <App route={initialUrl} />,
};

function reducer(state, action) {
  switch (action.type) {
    case 'startNavigation':
      return {
        ...state,
        pendingUrl: action.url,
      };
    case 'completeNavigation':
      // TODO: cancel previous fetch?
      return {
        ...state,
        url: action.url,
        pendingUrl: action.url,
        root: action.root,
      };
    default:
      throw new Error();
  }
}

function Router() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [startTransition, isPending] = useTransition({
    timeoutMs: 1500,
  });

  useEffect(() => {
    document.body.style.cursor = isPending ? 'wait' : '';
  }, [isPending]);

  const navigate = useCallback(
    url => {
      startTransition(() => {
        // TODO: Here, There, and Everywhere.
        // TODO: Instant Transitions, somehow.
        dispatch({
          type: 'completeNavigation',
          root: <App route={url} />,
          url,
        });
      });
      dispatch({
        type: 'startNavigation',
        url,
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
      pendingUrl: state.pendingUrl,
      url: state.url,
      navigate,
    }),
    [state.url, state.pendingUrl, navigate]
  );

  return (
    <Suspense fallback={<h2>Loading...</h2>}>
      <CacheProvider value={state.cache}>
        <RouterProvider value={routeContext}>{state.root}</RouterProvider>
      </CacheProvider>
    </Suspense>
  );
}

export default Router;
