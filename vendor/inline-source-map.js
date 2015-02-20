/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';
/*eslint-disable no-undef*/
var Buffer = require('buffer').Buffer;

function inlineSourceMap(sourceMap, sourceCode, sourceFilename) {
  // This can be used with a sourcemap that has already has toJSON called on it.
  // Check first.
  var json = sourceMap;
  if (typeof sourceMap.toJSON === 'function') {
    json = sourceMap.toJSON();
  }
  json.sources = [sourceFilename];
  json.sourcesContent = [sourceCode];
  var base64 = Buffer(JSON.stringify(json)).toString('base64');
  return '//# sourceMappingURL=data:application/json;base64,' + base64;
}

module.exports = inlineSourceMap;
