/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {Writable} from 'stream';
import * as React from 'react';
import {renderToPipeableStream} from 'react-dom/server';
import App from '../src/App';
import {ABORT_DELAY} from './delays';

// In a real setup, you'd read it from webpack build stats.
let assets = {
  'main.js': '/main.js',
  'main.css': '/main.css',
};

function HtmlWritable(options) {
  Writable.call(this, options);
  this.chunks = [];
  this.html = '';
}

HtmlWritable.prototype = Object.create(Writable.prototype);
HtmlWritable.prototype.getHtml = function getHtml() {
  return this.html;
};
HtmlWritable.prototype._write = function _write(chunk, encoding, callback) {
  this.chunks.push(chunk);
  callback();
};
HtmlWritable.prototype._final = function _final(callback) {
  this.html = Buffer.concat(this.chunks).toString();
  callback();
};

module.exports = function render(url, res) {
  let writable = new HtmlWritable();
  res.socket.on('error', error => {
    console.error('Fatal', error);
  });
  let didError = false;
  let didFinish = false;

  writable.on('finish', () => {
    // If something errored before we started streaming, we set the error code appropriately.
    res.statusCode = didError ? 500 : 200;
    res.setHeader('Content-type', 'text/html');
    res.send(writable.getHtml());
  });

  const {pipe, abort} = renderToPipeableStream(<App assets={assets} />, {
    bootstrapScripts: [assets['main.js']],
    onAllReady() {
      // Full completion.
      // You can use this for SSG or crawlers.
      didFinish = true;
    },
    onShellReady() {
      // If something errored before we started streaming, we set the error code appropriately.
      pipe(writable);
    },
    onShellError(x) {
      // Something errored before we could complete the shell so we emit an alternative shell.
      res.statusCode = 500;
      res.send('<!doctype><p>Error</p>');
    },
    onError(x) {
      didError = true;
      console.error(x);
    },
  });
  // Abandon and switch to client rendering if enough time passes.
  // Try lowering this to see the client recover.
  setTimeout(() => {
    if (!didFinish) {
      abort();
    }
  }, ABORT_DELAY);
};
