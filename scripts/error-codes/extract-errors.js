/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const babylon = require('babylon');
const fs = require('fs');
const path = require('path');
const traverse = require('babel-traverse').default;
const evalToString = require('../shared/evalToString');
const invertObject = require('./invertObject');

const babylonOptions = {
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
};

module.exports = function(opts) {
  if (!opts || !('errorMapFilePath' in opts)) {
    throw new Error(
      'Missing options. Ensure you pass an object with `errorMapFilePath`.'
    );
  }

  var errorMapFilePath = opts.errorMapFilePath;
  var existingErrorMap;
  try {
    existingErrorMap = require(path.join(
      __dirname,
      path.basename(errorMapFilePath)
    ));
  } catch (e) {
    existingErrorMap = {};
  }

  var allErrorIDs = Object.keys(existingErrorMap);
  var currentID;

  if (allErrorIDs.length === 0) {
    // Map is empty
    currentID = 0;
  } else {
    currentID = Math.max.apply(null, allErrorIDs) + 1;
  }

  // Here we invert the map object in memory for faster error code lookup
  existingErrorMap = invertObject(existingErrorMap);

  function transform(source) {
    var ast = babylon.parse(source, babylonOptions);

    traverse(ast, {
      CallExpression: {
        exit: function(astPath) {
          if (astPath.get('callee').isIdentifier({name: 'invariant'})) {
            var node = astPath.node;

            // error messages can be concatenated (`+`) at runtime, so here's a
            // trivial partial evaluator that interprets the literal value
            var errorMsgLiteral = evalToString(node.arguments[1]);
            if (existingErrorMap.hasOwnProperty(errorMsgLiteral)) {
              return;
            }

            existingErrorMap[errorMsgLiteral] = '' + currentID++;
          }
        },
      },
    });
  }

  function flush(cb) {
    fs.writeFileSync(
      errorMapFilePath,
      JSON.stringify(invertObject(existingErrorMap), null, 2) + '\n',
      'utf-8'
    );
  }

  return function extractErrors(filepath) {
    const source = fs.readFileSync(filepath, 'utf-8');

    transform(source);
    flush();
  };
};
