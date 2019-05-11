import React from 'react';
import {unstable_createRoot} from 'react-dom';

import App from './components/App';

let root = unstable_createRoot(document, {hydrate: true});
root.render(<App assets={window.assetManifest} />);
