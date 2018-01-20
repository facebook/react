import React from 'react';
import {unstable_createRoot} from 'react-dom';

import App from './components/App';

// No host:port and #hash (fragment identifier) components in the `url` to match the server-side value.
const url = window.location.pathname + window.location.search;

let root = unstable_createRoot(document, {hydrate: true});
root.render(<App assets={window.assetManifest} url={url} />);
