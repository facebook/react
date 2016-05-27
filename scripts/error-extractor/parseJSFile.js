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
    // As a parser, babylon has its own options and we can't directly
    // import/require a babel preset. It should be kept **the same** as
    // the `babel-plugin-syntax-*` ones specified in
    // https://github.com/facebook/fbjs/blob/master/babel-preset/configure.js
    plugins: [
      'classProperties',
      'flow',
      'jsx',
      'trailingFunctionCommas',
      'objectRestSpread',
    ],
  });
}

module.exports = parseJSFile;
