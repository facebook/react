'use strict';

import {pipeToNodeWritable} from 'react-transport-dom-webpack/server';
import * as React from 'react';
import App from './App.server';

module.exports = function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  pipeToNodeWritable(<App />, res, {
    // TODO: Read from a map on the disk.
    './src/Counter.client.js': {
      id: './src/Counter.client.js',
      chunks: ['2'],
      name: 'default',
    },
  });
};
