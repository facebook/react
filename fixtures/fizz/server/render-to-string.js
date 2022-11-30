/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from 'react';
import {renderToString} from 'react-dom/server';
import App from '../src/App';
import {API_DELAY, ABORT_DELAY} from './delays';
import {performance} from 'perf_hooks';

// In a real setup, you'd read it from webpack build stats.
let assets = {
  'main.js': '/main.js',
  'main.css': '/main.css',
};

let textEncoder = new TextEncoder();

module.exports = function render(url, res) {
  let payload =
    '<!DOCTYPE html>' +
    renderToString(<App assets={assets} />) +
    '<script src="/main.js" async=""></script>';
  let arr = textEncoder.encode(payload);

  let buf = Buffer.from(arr);
  res.statusCode = 200;
  res.setHeader('Content-type', 'text/html');
  res.send(buf);
};
