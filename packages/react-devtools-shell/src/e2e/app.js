/** @flow */

// This test harness mounts each test app as a separate root to test multi-root applications.

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {createRoot} from 'react-dom/client';

const container = document.createElement('div');

((document.body: any): HTMLBodyElement).appendChild(container);

// TODO We may want to parameterize this app
// so that it can load things other than just ToDoList.
const App = require('./apps/ListApp').default;

const root = createRoot(container);
root.render(<App />);

// ReactDOM Test Selector APIs used by Playwright e2e tests
window.parent.REACT_DOM_APP = ReactDOM;
