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
  unstable_useCacheRefresh as useCacheRefresh,
  unstable_Cache as Cache,
} from 'react';
import {RouterProvider} from './client/RouterContext';
// TODO: can't really import a server component on the client.
import App from './server/App';

const initialUrl = window.location.pathname;

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
  const initialState = {
    url: initialUrl,
    pendingUrl: initialUrl,
    root: <App route={initialUrl} />,
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isPending, startTransition] = useTransition();
  const refresh = useCacheRefresh();

  useEffect(() => {
    document.body.style.cursor = isPending ? 'wait' : '';
  }, [isPending]);

  const navigate = useCallback(
    url => {
      startTransition(() => {
        // TODO: Here, There, and Everywhere.
        // TODO: Instant Transitions, somehow.
        refresh();
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
    [startTransition, refresh]
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
      <Cache>
        <RouterProvider value={routeContext}>{state.root}</RouterProvider>
      </Cache>
    </Suspense>
  );
}

export default Router;
