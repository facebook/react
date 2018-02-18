import React from 'react';
import {hydrate} from 'react-dom';

import App from './components/App';

// No host:port and #hash (fragment identifier) components in the `url` to match the server-side value.
const url = window.location.pathname + window.location.search;
hydrate(<App assets={window.assetManifest} url={url} />, document);
