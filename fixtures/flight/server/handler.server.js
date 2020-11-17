'use strict';

import {pipeToNodeWritable} from 'react-transport-dom-webpack/server';
import * as React from 'react';

import url from 'url';

function resolve(path) {
  return url.pathToFileURL(require.resolve(path)).href;
}

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const m = await import('../src/App.server.js');
  // const m = require('../src/App.server.js');
  const App = m.default.default || m.default;
  pipeToNodeWritable(<App />, res, {
    // TODO: Read from a map on the disk.
    [resolve('../src/Counter.client.js')]: {
      id: './src/Counter.client.js',
      chunks: ['1'],
      name: 'default',
    },
    [resolve('../src/ShowMore.client.js')]: {
      id: './src/ShowMore.client.js',
      chunks: ['2'],
      name: 'default',
    },
  });
};
