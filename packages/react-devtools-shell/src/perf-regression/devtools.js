import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {
  activate as activateBackend,
  initialize as initializeBackend,
} from 'react-devtools-inline/backend';
import {initialize as createDevTools} from 'react-devtools-inline/frontend';

function inject(contentDocument, sourcePath) {
  const script = contentDocument.createElement('script');
  script.src = sourcePath;

  ((contentDocument.body: any): HTMLBodyElement).appendChild(script);
}

function init(
  appSource: string,
  appIframe: HTMLIFrameElement,
  devtoolsContainer: HTMLElement,
  loadDevToolsButton: HTMLButtonElement,
) {
  const {contentDocument, contentWindow} = appIframe;

  initializeBackend(contentWindow);

  inject(contentDocument, appSource);

  loadDevToolsButton.addEventListener('click', () => {
    const DevTools = createDevTools(contentWindow);
    createRoot(devtoolsContainer).render(<DevTools showTabBar={true} />);
    activateBackend(contentWindow);
  });
}

init(
  'dist/perf-regression-app.js',
  document.getElementById('iframe'),
  document.getElementById('devtools'),
  document.getElementById('load-devtools'),
);
