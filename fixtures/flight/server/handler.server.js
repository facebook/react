'use strict';

import {pipeToNodeWritable} from 'react-transport-dom-webpack/server';
import {readFile} from 'fs';
import {resolve} from 'path';
import * as React from 'react';

module.exports = function(req, res) {
  // const m = require('../src/App.server.js');
  import('../src/App.server.js').then(m => {
    const dist = process.env.NODE_ENV === 'development' ? 'dist' : 'build';
    readFile(
      resolve(__dirname, `../${dist}/react-transport-manifest.json`),
      'utf8',
      (err, data) => {
        if (err) {
          throw err;
        }

        const App = m.default.default || m.default;
        res.setHeader('Access-Control-Allow-Origin', '*');
        const moduleMap = JSON.parse(data);
        pipeToNodeWritable(<App />, res, moduleMap);
      }
    );
  });
};
