/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

var babylon = require('babylon');
var fs = require('fs');
var gutil = require('gulp-util');
var path = require('path');
var through = require('through2');
var traverse = require('babel-traverse').default;

var evalToString = require('./evalToString');
var invertObject = require('./invertObject');

var PLUGIN_NAME = 'extract-errors';

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

module.exports = function(opts) {
  if (!opts || !('errorMapFilePath' in opts)) {
    throw new gutil.PluginError(
      PLUGIN_NAME,
      'Missing options. Ensure you pass an object with `errorMapFilePath`.'
    );
  }

  var errorMapFilePath = opts.errorMapFilePath;
  var existingErrorMap;
  try {
    existingErrorMap = require(
      path.join(__dirname, path.basename(errorMapFilePath))
    );
  } catch (e) {
    existingErrorMap = {};
  }

  var allErrorIDs = Object.keys(existingErrorMap);
  var currentID;

  if (allErrorIDs.length === 0) { // Map is empty
    currentID = 0;
  } else {
    currentID = Math.max.apply(null, allErrorIDs) + 1;
  }

  // Here we invert the map object in memory for faster error code lookup
  existingErrorMap = invertObject(existingErrorMap);

  function transform(file, enc, cb) {
    if (file.isNull()) {
      cb(null, file);
      return;
    }

    if (file.isStream()) {
      cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
      return;
    }

    var source = file.contents.toString();
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

    cb();
  }

  function flush(cb) {
    fs.writeFile(
      errorMapFilePath,
      JSON.stringify(invertObject(existingErrorMap), null, 2) + '\n',
      'utf-8',
      function() {
        // avoid calling cb with fs.write callback data
        cb();
      }
    );
  }

  return through.obj(transform, flush);
};
