/** @flow */

import { createElement } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import App from './App';

const container = document.createElement('div');

((document.body: any): HTMLBodyElement).appendChild(container);

function mountTestApp() {
  render(createElement(App), container);
}

function unmountTestApp() {
  unmountComponentAtNode(container);
}

mountTestApp();

window.parent.mountTestApp = mountTestApp;
window.parent.unmountTestApp = unmountTestApp;
