/** @flow */

import { createElement } from 'react';
// $FlowFixMe Flow does not yet know about createRoot()
import { createRoot } from 'react-dom';
import Bridge from 'src/bridge';
import { installHook } from 'src/hook';
import { initDevTools } from 'src/devtools';
import Elements from 'src/devtools/views/Elements';

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

initDevTools({
  connect(cb) {
    inject('./build/backend.js', () => {
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

      const root = createRoot(container);
      root.render(
        createElement(Elements, {
          bridge,
          browserName: 'Chrome',
          themeName: 'light',
        })
      );
    });
  },

  onReload(reloadFn) {
    iframe.onload = reloadFn;
  },
});

inject('./build/App.js');

function inject(sourcePath, callback) {
  const script = contentDocument.createElement('script');
  script.onload = callback;
  script.src = sourcePath;

  ((contentDocument.body: any): HTMLBodyElement).appendChild(script);
}
