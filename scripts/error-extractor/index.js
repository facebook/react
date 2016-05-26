/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var path = require('path');
var traverse = require('babel-traverse').default;

var evalToString = require('./evalToString');
var getFilePaths = require('./getFilePaths');
var invertObject = require('./invertObject');
var parseJSFile = require('./parseJSFile');
var writeJSON = require('./writeJSON');

var outputFileName = 'ErrorMap.json';
var outputFilePath = path.join(__dirname, '../../', outputFileName);

var existingErrorMap;
var currentID;

try {
  existingErrorMap = require(outputFilePath);
} catch (e) {
  existingErrorMap = {};
}

// Now the error map is in the format of `{ 0: 'MUCH ERROR', 1: 'SUCH WRONG' }`

var currentIDNumbers = Object.keys(existingErrorMap).map(function(str) {
  return parseInt(str, 10);
});

if (currentIDNumbers.length === 0) { // Map is empty
  currentID = 0;
} else {
  currentID = Math.max.apply(null, currentIDNumbers) + 1;
}

// Here we invert the map object in memory for faster error code lookup
existingErrorMap = invertObject(existingErrorMap);

var filePaths = getFilePaths();

// Let's sort the files using their (module) names to make the result more stable
filePaths.sort(function(path1/* : string */, path2/* : string */)/* : number */ {
  var moduleName1 = path.basename(path1);
  var moduleName2 = path.basename(path2);
  if (moduleName1 < moduleName2) {
    return -1;
  } else if (moduleName1 > moduleName2) {
    return 1;
  }
  return 0;
});

filePaths.forEach(function(filePath/* : string */) {
  var ast = parseJSFile(filePath);
  traverse(ast, {
    CallExpression: {
      exit: function(astPath) {
        if (astPath.get('callee').isIdentifier({ name: 'invariant' })) {
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

writeJSON(
  invertObject(existingErrorMap),
  outputFilePath
);
