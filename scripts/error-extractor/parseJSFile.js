/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

var babylon = require('babylon');
var fs = require('fs');

function parseJSFile(filePath/* : string */)/* : Object */ {
  var source = fs.readFileSync(filePath, 'utf8');
  return babylon.parse(source, {
    sourceType: 'module',
    plugins: [
      'jsx',
      'flow',
      'trailingFunctionCommas',
      'objectRestSpread',
    ],
  });
}

module.exports = parseJSFile;
