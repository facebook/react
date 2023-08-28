import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {createRoot} from 'react-dom/client';
import {
  activate as activateBackend,
  initialize as initializeBackend,
} from 'react-devtools-inline/backend';
import {initialize as createDevTools} from 'react-devtools-inline/frontend';

function inject(contentDocument, sourcePath, callback) {
  const script = contentDocument.createElement('script');
  script.onload = callback;
  script.src = sourcePath;

  ((contentDocument.body: any): HTMLBodyElement).appendChild(script);
}

function init(appIframe, devtoolsContainer, appSource) {
  const {contentDocument, contentWindow} = appIframe;

  initializeBackend(contentWindow);

  const DevTools = createDevTools(contentWindow);

  inject(contentDocument, appSource, () => {
    createRoot(devtoolsContainer).render(<DevTools showTabBar={true} />);
  });

  activateBackend(contentWindow);
}

const iframe = document.getElementById('iframe');
const devtoolsContainer = document.getElementById('devtools');

const {protocol, hostname} = window.location;
const port = 8181; // secondary webpack server port
init(
  iframe,
  devtoolsContainer,
  `${protocol}//${hostname}:${port}/dist/e2e-app-regression.js`,
);

// ReactDOM Test Selector APIs used by Playwright e2e tests
window.parent.REACT_DOM_DEVTOOLS = ReactDOM;
