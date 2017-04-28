import React from 'react';
import {renderToString} from 'react-dom/server';

import App from '../src/components/App';
import assetManifest from '../build/asset-manifest.json';

let assets = assetManifest;
if (process.env.NODE_ENV === 'development') {
  // Use the bundle from create-react-app's server in development mode.
  assets = {
    'main.js': '/static/js/bundle.js',
    'main.css': '',
  };
}

export default function render() {
  var html = renderToString(<App assets={assets} />);
  // There's no way to render a doctype in React so prepend manually.
  // Also append a bootstrap script tag.
  return '<!DOCTYPE html>' + html;
};
