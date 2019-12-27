import React from 'react';
import {createRoot} from 'react-dom';

import App from './components/App';

let root = createRoot(document, {hydrate: true});
root.render(<App assets={window.assetManifest} />);
