import React from 'react';
import {pipeToNodeWritable} from 'react-dom/unstable-fizz';

import App from '../src/components/App';

let assets;
if (process.env.NODE_ENV === 'development') {
  // Use the bundle from create-react-app's server in development mode.
  assets = {
    'main.js': '/static/js/bundle.js',
    'main.css': '',
  };
} else {
  assets = require('../build/asset-manifest.json');
}

export default function render(url, res) {
  res.socket.on('error', error => {
    // Log fatal errors
    console.error('Fatal', error);
  });
  let didError = false;
  const {startWriting, abort} = pipeToNodeWritable(
    <App assets={assets} />,
    res,
    {
      onReadyToStream() {
        // If something errored before we started streaming, we set the error code appropriately.
        res.statusCode = didError ? 500 : 200;
        res.setHeader('Content-type', 'text/html');
        // There's no way to render a doctype in React so prepend manually.
        res.write('<!DOCTYPE html>');
        startWriting();
      },
      onError(x) {
        didError = true;
        console.error(x);
      },
    }
  );
  // Abandon and switch to client rendering after 5 seconds.
  // Try lowering this to see the client recover.
  setTimeout(abort, 5000);
}
