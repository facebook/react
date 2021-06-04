/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {createRoot} from 'react-dom';
import App from './App';
import {DataProvider} from './data';

const root = createRoot(document, {hydrate: true});
root.render(<App assets={window.assetManifest} />);
