import React from 'react';
import {hydrateRoot} from 'react-dom';

import App from './components/App';

let root = hydrateRoot(document, <App assets={window.assetManifest} />);
