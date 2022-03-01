import React from 'react';
import {hydrateRoot} from 'react-dom/client';

import App from './components/App';

let root = hydrateRoot(document, <App assets={window.assetManifest} />);
