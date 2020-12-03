'use strict';

import {pipeToNodeWritable} from 'react-transport-dom-webpack/server';
import {readFileSync} from 'fs';
import {resolve} from 'path';
import * as React from 'react';

module.exports = async function(req, res) {
  const m = await import('../src/App.server.js');
  // const m = require('../src/App.server.js');
  const App = m.default.default || m.default;
  res.setHeader('Access-Control-Allow-Origin', '*');
  const moduleMap = JSON.parse(
    readFileSync(
      resolve(__dirname, '../dist/react-transport-manifest.json'),
      'utf8'
    )
  );
  pipeToNodeWritable(<App />, res, moduleMap);
};
