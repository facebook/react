/** @flow */

import { createElement } from 'react';
// $FlowFixMe Flow does not yet know about createRoot()
import { unstable_createRoot as createRoot } from 'react-dom';
import Bridge from 'src/bridge';
import { installHook } from 'src/hook';
import { initDevTools } from 'src/devtools';
import Store from 'src/devtools/store';
import DevTools from 'src/devtools/views/DevTools';

const iframe = ((document.getElementById('target'): any): HTMLIFrameElement);

const { contentDocument, contentWindow } = iframe;

installHook(contentWindow);

const container = ((document.getElementById('devtools'): any): HTMLElement);

let isTestAppMounted = true;

const mountButton = ((document.getElementById(
  'mountButton'
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

inject('./build/app.js', () => {
  initDevTools({
    connect(cb) {
      const bridge = new Bridge({
        listen(fn) {
          contentWindow.parent.addEventListener('message', ({ data }) => {
            fn(data);
          });
        },
        send(event: string, payload: any, transferable?: Array<any>) {
          contentWindow.postMessage({ event, payload }, '*', transferable);
        },
      });

      cb(bridge);

      const store = new Store(bridge, { supportsCaptureScreenshots: true });

      const root = createRoot(container);
      const batch = root.createBatch();
      batch.render(
        createElement(DevTools, {
          bridge,
          browserName: 'Chrome',
          browserTheme: 'light',
          showTabBar: true,
          store,
        })
      );
      batch.then(() => {
        batch.commit();

        // Initialize the backend only once the DevTools frontend Store has been initialized.
        // Otherwise the Store may miss important initial tree op codes.
        inject('./build/backend.js');
      });
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
