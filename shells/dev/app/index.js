/** @flow */

// This test harness mounts each test app as a separate root to test multi-root applications.

import { createElement } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import ElementTypes from './ElementTypes';
import InspectableElements from './InspectableElements';
import ToDoList from './ToDoList';

const containers = [];

function mountHelper(App) {
  const container = document.createElement('div');

  ((document.body: any): HTMLBodyElement).appendChild(container);

  containers.push(container);

  render(createElement(App), container);
}

function mountTestApp() {
  mountHelper(ToDoList);
  mountHelper(InspectableElements);
  mountHelper(ElementTypes);
}

function unmountTestApp() {
  containers.forEach(container => unmountComponentAtNode(container));
}

mountTestApp();

window.parent.mountTestApp = mountTestApp;
window.parent.unmountTestApp = unmountTestApp;
