/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {
  // $FlowFixMe Flow does not yet know about createRoot()
  unstable_createRoot as createRoot,
} from 'react-dom';
import nullthrows from 'nullthrows';
import App from './App';
import './index.css';

const container = nullthrows(document.getElementById('root'));

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
