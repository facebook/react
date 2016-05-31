/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var babylon = require('babylon');
var fs = require('fs');
var glob = require('glob');
var os = require('os');
var path = require('path');
var traverse = require('babel-traverse').default;

var reactGlobPatterns = require('./globPatterns');

var evalToString = require('./evalToString');
var invertObject = require('./invertObject');
var safeParseJSON = require('./safeParseJSON');

var babylonOptions = {
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
var outputFilePath = path.join(__dirname, 'codes.json');

var existingErrorMap = safeParseJSON(outputFilePath);
// Now the error map is in the format of `{ 0: 'MUCH ERROR', 1: 'SUCH WRONG' }`

var allErrorIDs = Object.keys(existingErrorMap);
var currentID;

if (allErrorIDs.length === 0) { // Map is empty
  currentID = 0;
} else {
  currentID = Math.max.apply(null, allErrorIDs) + 1;
}

// Here we invert the map object in memory for faster error code lookup
existingErrorMap = invertObject(existingErrorMap);

var filePaths = glob.sync(reactGlobPatterns.includePattern, {
  ignore: reactGlobPatterns.ignorePatterns,
});

// Sort the files to make the result more stable
filePaths.sort();

filePaths.forEach(function(filePath/* : string */) {
  var source = fs.readFileSync(filePath, 'utf8');
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

          existingErrorMap[errorMsgLiteral] = '' + (currentID++);
        }
      },
    },
  });
});

fs.writeFileSync(
  outputFilePath,
  JSON.stringify(invertObject(existingErrorMap), null, 2) + os.EOL
);
