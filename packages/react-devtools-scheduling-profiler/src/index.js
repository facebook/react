/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import 'regenerator-runtime/runtime';

import * as React from 'react';
// $FlowFixMe Flow does not yet know about createRoot()
import {unstable_createRoot as createRoot} from 'react-dom';
import nullthrows from 'nullthrows';
import App from './App';

import styles from './index.css';

const container = document.createElement('div');
container.className = styles.Container;
container.id = 'root';

const body = nullthrows(document.body, 'Expect document.body to exist');
body.appendChild(container);

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
