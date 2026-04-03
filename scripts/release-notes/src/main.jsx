/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createRoot} from 'react-dom/client';
import App from './App';
import './style.css';

const root = createRoot(document.getElementById('app'));
root.render(<App />);
