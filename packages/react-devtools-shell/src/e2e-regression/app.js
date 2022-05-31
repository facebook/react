/** @flow */

// This test harness mounts each test app as a separate root to test multi-root applications.

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {createRoot} from 'react-dom/client';
import ListApp from '../e2e-apps/ListApp';

function mountApp(App) {
  const container = document.createElement('div');

  ((document.body: any): HTMLBodyElement).appendChild(container);

  const root = createRoot(container);
  root.render(<App />);
}
function mountTestApp() {
  mountApp(ListApp);
}

mountTestApp();

// ReactDOM Test Selector APIs used by Playwright e2e tests
window.parent.REACT_DOM_APP = ReactDOM;
