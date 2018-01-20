import React from 'react';
import {hydrate} from 'react-dom';

import App from './components/App';

// Remove the #hash (fragment identifier) component from the `url` to match the server-side value.
const url = window.location.href.replace(/[#].*/, '');
hydrate(<App assets={window.assetManifest} url={url} />, document);
