/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {createRoot} from 'react-dom';
import './index.css';
import Router from './Router';

createRoot(document.getElementById('root')).render(<Router />);
