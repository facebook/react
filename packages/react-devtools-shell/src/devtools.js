/** @flow */

import {createElement} from 'react';
// $FlowFixMe Flow does not yet know about createRoot()
import {unstable_createRoot as createRoot} from 'react-dom';
import {
  activate as activateBackend,
  initialize as initializeBackend,
} from 'react-devtools-inline/backend';
import {initialize as initializeFrontend} from 'react-devtools-inline/frontend';
import {initDevTools} from 'react-devtools-shared/src/devtools';

const iframe = ((document.getElementById('target'): any): HTMLIFrameElement);

const {contentDocument, contentWindow} = iframe;

// Helps with positioning Overlay UI.
contentWindow.__REACT_DEVTOOLS_TARGET_WINDOW__ = window;

initializeBackend(contentWindow);

const container = ((document.getElementById('devtools'): any): HTMLElement);

let isTestAppMounted = true;

const mountButton = ((document.getElementById(
  'mountButton',
): any): HTMLButtonElement);
mountButton.addEventListener('click', function() {
  if (isTestAppMounted) {
    if (typeof window.unmountTestApp === 'function') {
      window.unmountTestApp();
      mountButton.innerText = 'Mount test app';
      isTestAppMounted = false;
    }
  } else {
    if (typeof window.mountTestApp === 'function') {
      window.mountTestApp();
      mountButton.innerText = 'Unmount test app';
      isTestAppMounted = true;
    }
  }
});

inject('dist/app.js', () => {
  initDevTools({
    connect(cb) {
      const DevTools = initializeFrontend(contentWindow);

      // Activate the backend only once the DevTools frontend Store has been initialized.
      // Otherwise the Store may miss important initial tree op codes.
      activateBackend(contentWindow);

      const root = createRoot(container);
      root.render(
        createElement(DevTools, {
          browserTheme: 'light',
          showTabBar: true,
          warnIfLegacyBackendDetected: true,
        }),
      );
    },

    onReload(reloadFn) {
      iframe.onload = reloadFn;
    },
  });
});

function inject(sourcePath, callback) {
  const script = contentDocument.createElement('script');
  script.onload = callback;
  script.src = sourcePath;

  ((contentDocument.body: any): HTMLBodyElement).appendChild(script);
}
