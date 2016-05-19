/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Adler32Stream
 */

'use strict';

var rollingAdler32 = require('rollingAdler32');
var stream = require('stream');

// this is a pass through stream that can calculate the hash that is used to
// checksum react server-rendered elements.
class Adler32Stream extends stream.Transform {
  constructor(rootId, options) {
    super(options);
    this.rollingHash = rollingAdler32('');
    const errorHandler = e => {
      this.emit('error', e);
    };

    this.on('pipe', src => {
      src.on('error', errorHandler);
    });
    this.on('unpipe', src => {
      src.removeListener('error', errorHandler);
    });
  }

  _transform(chunk, encoding, next) {
    this.rollingHash = rollingAdler32(chunk.toString('utf-8'), this.rollingHash);
    this.push(chunk);
    next();
  }

  _flush(next) {
    let hash = this.rollingHash.hash();
    let scriptId = `react-script-${hash}`;
    this.push(
      `<script type="text/javascript" id="${scriptId}">
        var scriptElement = document.getElementById('${scriptId}');
        var renderedElement = scriptElement.previousSibling;
        if (renderedElement === null) {
          throw new Error("React server rendering: could not find the rendered element to add checksum.");
        }
        renderedElement.setAttribute("data-react-checksum", ${hash});
        scriptElement.parentElement.removeChild(scriptElement);
      </script>`
    );
    next();
  }
}

module.exports = Adler32Stream;
