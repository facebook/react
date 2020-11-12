import {pipeToNodeWritable} from 'react-transport-dom-webpack/server.js';
import * as React from 'react';
import App from '../src/App.server.js';

import {URL} from 'url';

const rootPath = import.meta.url;
function resolve(relative) {
  return new URL(relative, rootPath).href;
}

export default function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
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
