/** @flow */

// This test harness mounts each test app as a separate root to test multi-root applications.

import {createElement} from 'react';
import {
  // $FlowFixMe Flow does not yet know about createRoot()
  unstable_createRoot as createRoot,
} from 'react-dom';
import DeeplyNestedComponents from './DeeplyNestedComponents';
import Iframe from './Iframe';
import EditableProps from './EditableProps';
import ElementTypes from './ElementTypes';
import Hydration from './Hydration';
import InspectableElements from './InspectableElements';
import InteractionTracing from './InteractionTracing';
import PriorityLevels from './PriorityLevels';
import ReactNativeWeb from './ReactNativeWeb';
import ToDoList from './ToDoList';
import Toggle from './Toggle';
import SuspenseTree from './SuspenseTree';
import {ignoreErrors, ignoreWarnings} from './console';

import './styles.css';

// DevTools intentionally tests compatibility with certain legacy APIs.
// Suppress their error messages in the local dev shell,
// because they might mask other more serious error messages.
ignoreErrors([
  'Warning: Legacy context API',
  'Warning: Unsafe lifecycle methods',
  'Warning: %s is deprecated in StrictMode.', // findDOMNode
]);
ignoreWarnings(['Warning: componentWillReceiveProps is deprecated']);

const roots = [];

function mountHelper(App) {
  const container = document.createElement('div');

  ((document.body: any): HTMLBodyElement).appendChild(container);

  const root = createRoot(container);
  root.render(createElement(App));

  roots.push(root);
}

function mountTestApp() {
  mountHelper(ToDoList);
  mountHelper(InteractionTracing);
  mountHelper(InspectableElements);
  mountHelper(Hydration);
  mountHelper(ElementTypes);
  mountHelper(EditableProps);
  mountHelper(PriorityLevels);
  mountHelper(ReactNativeWeb);
  mountHelper(Toggle);
  mountHelper(SuspenseTree);
  mountHelper(DeeplyNestedComponents);
  mountHelper(Iframe);
}

function unmountTestApp() {
  roots.forEach(root => root.unmount());
}

mountTestApp();

window.parent.mountTestApp = mountTestApp;
window.parent.unmountTestApp = unmountTestApp;
