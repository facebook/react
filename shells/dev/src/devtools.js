/** @flow */

import { createElement } from 'react';
import {render } from 'react-dom';
import Bridge from 'src/bridge';
import { installHook } from 'src/hook';
import { initDevTools } from 'src/devtools';
import App from 'src/devtools/views/App';

const iframe = ((document.getElementById('target'): any): HTMLIFrameElement);

const {contentDocument, contentWindow} = iframe;

installHook(contentWindow);

initDevTools({
  connect(cb) {
    inject('./build/backend.js', () => {
      const bridge = new Bridge({
        listen(fn) {
          contentWindow.parent.addEventListener('message', ({ data }) => {
            fn(data)
          });
        },
        send(data) {
          contentWindow.postMessage(data, '*');
        }
      });

      cb(bridge);

      render(
        createElement(App, {bridge}),
        ((document.getElementById('devtools'): any): HTMLElement),
      );
    });
  },

  onReload(reloadFn) {
    iframe.onload = reloadFn;
  }
});

inject('./build/app.js');

function inject(sourcePath, callback) {
  const script = contentDocument.createElement('script')
  script.onload = callback;
  script.src = sourcePath;

  ((contentDocument.body: any): HTMLBodyElement).appendChild(script);
}