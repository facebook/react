/** @flow */

// This test harness mounts each test app as a separate root to test multi-root applications.

import {createElement} from 'react';
import {
  // $FlowFixMe Flow does not yet know about createRoot()
  createRoot,
} from 'react-dom';
import ToDoList from '../app/ToDoList';

const container = document.createElement('div');

((document.body: any): HTMLBodyElement).appendChild(container);

// TODO We may want to parameterize this app
// so that it can load things other than just ToDoList.

const root = createRoot(container);
root.render(createElement(ToDoList));
