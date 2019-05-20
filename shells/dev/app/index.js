/** @flow */

// This test harness mounts each test app as a separate root to test multi-root applications.

import { createElement } from 'react';
import {
  unmountComponentAtNode,
  // $FlowFixMe Flow does not yet know about createRoot()
  unstable_createRoot as createRoot,
} from 'react-dom';
import DeeplyNestedComponents from './DeeplyNestedComponents';
import EditableProps from './EditableProps';
import ElementTypes from './ElementTypes';
import InspectableElements from './InspectableElements';
import InteractionTracing from './InteractionTracing';
import PriorityLevels from './PriorityLevels';
import ToDoList from './ToDoList';
import Toggle from './Toggle';
import SuspenseTree from './SuspenseTree';

import './styles.css';

const containers = [];

function mountHelper(App) {
  const container = document.createElement('div');

  ((document.body: any): HTMLBodyElement).appendChild(container);

  containers.push(container);

  const root = createRoot(container);
  root.render(createElement(App));
}

function mountTestApp() {
  mountHelper(ToDoList);
  mountHelper(InteractionTracing);
  mountHelper(InspectableElements);
  mountHelper(ElementTypes);
  mountHelper(EditableProps);
  mountHelper(PriorityLevels);
  mountHelper(Toggle);
  mountHelper(SuspenseTree);
  mountHelper(DeeplyNestedComponents);
}

function unmountTestApp() {
  containers.forEach(container => unmountComponentAtNode(container));
}

mountTestApp();

window.parent.mountTestApp = mountTestApp;
window.parent.unmountTestApp = unmountTestApp;
