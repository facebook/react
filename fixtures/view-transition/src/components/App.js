import React, {
  startTransition,
  useInsertionEffect,
  useEffect,
  useState,
} from 'react';

import Chrome from './Chrome';
import Page from './Page';

const enableNavigationAPI = typeof navigation === 'object';

export default function App({assets, initialURL}) {
  const [routerState, setRouterState] = useState({
    pendingNav: () => {},
    url: initialURL,
  });
  function navigate(url) {
    if (enableNavigationAPI) {
      window.navigation.navigate(url);
    } else {
      startTransition(() => {
        setRouterState({
          url,
          pendingNav() {
            window.history.pushState({}, '', url);
          },
        });
      });
    }
  }
  useEffect(() => {
    if (enableNavigationAPI) {
      window.navigation.addEventListener('navigate', event => {
        if (!event.canIntercept) {
          return;
        }
        const newURL = new URL(event.destination.url);
        event.intercept({
          handler() {
            let promise;
            startTransition(() => {
              promise = new Promise(resolve => {
                setRouterState({
                  url: newURL.pathname + newURL.search,
                  pendingNav: resolve,
                });
              });
            });
            return promise;
          },
          commit: 'after-transition', // plz ship this, browsers
        });
      });
    } else {
      window.addEventListener('popstate', () => {
        // This should not animate because restoration has to be synchronous.
        // Even though it's a transition.
        startTransition(() => {
          setRouterState({
            url: document.location.pathname + document.location.search,
            pendingNav() {
              // Noop. URL has already updated.
            },
          });
        });
      });
    }
  }, []);
  const pendingNav = routerState.pendingNav;
  useInsertionEffect(() => {
    pendingNav();
  }, [pendingNav]);
  return (
    <Chrome title="Hello World" assets={assets}>
      <Page url={routerState.url} navigate={navigate} />
    </Chrome>
  );
}
