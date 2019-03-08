/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const babylon = require('babylon');
const fs = require('fs');
const path = require('path');
const traverse = require('babel-traverse').default;
const invertObject = require('./invertObject');
const {
  evalStringConcat,
  evalStringAndTemplateConcat,
} = require('../shared/evalStringConcat');

const babylonOptions = {
  sourceType: 'module',
  // As a parser, babylon has its own options and we can't directly
  // import/require a babel preset. It should be kept **the same** as
  // the `babel-plugin-syntax-*` ones specified in
  // https://github.com/facebook/fbjs/blob/master/packages/babel-preset-fbjs/configure.js
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

  const errorMapFilePath = opts.errorMapFilePath;
  let existingErrorMap;
  try {
    // Using `fs.readFileSync` instead of `require` here, because `require()`
    // calls are cached, and the cache map is not properly invalidated after
    // file changes.
    existingErrorMap = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, path.basename(errorMapFilePath)),
        'utf8'
      )
    );
  } catch (e) {
    existingErrorMap = {};
  }

  const allErrorIDs = Object.keys(existingErrorMap);
  let currentID;

  if (allErrorIDs.length === 0) {
    // Map is empty
    currentID = 0;
  } else {
    currentID = Math.max.apply(null, allErrorIDs) + 1;
  }

  // Here we invert the map object in memory for faster error code lookup
  existingErrorMap = invertObject(existingErrorMap);

  function transform(source) {
    const ast = babylon.parse(source, babylonOptions);

    traverse(ast, {
      CallExpression(astPath) {
        if (astPath.get('callee').isIdentifier({name: 'invariant'})) {
          CallOrNewExpression(astPath);
          return;
        }
        if (astPath.get('callee').isIdentifier({name: 'invariant'})) {
          const node = astPath.node;

          // error messages can be concatenated (`+`) at runtime, so here's a
          // trivial partial evaluator that interprets the literal value
          const errorMsgLiteral = evalStringConcat(node.arguments[1]);
          addToErrorMap(errorMsgLiteral);
        }
      },
      NewExpression(astPath) {
        if (astPath.get('callee').isIdentifier({name: 'Error'})) {
          CallOrNewExpression(astPath);
        }
      },
    });
  }

  function CallOrNewExpression(astPath) {
    const node = astPath.node;
    try {
      const errorMsgLiteral = evalStringAndTemplateConcat(
        node.arguments[0],
        []
      );
      addToErrorMap(errorMsgLiteral);
    } catch (e) {
      // We use a lint rule to enforce that error messages are written in
      // a format that can be minified. If they aren't, assume this is
      // intentional and skip over it gracefully.
    }
  }

  function addToErrorMap(errorMsgLiteral) {
    if (existingErrorMap.hasOwnProperty(errorMsgLiteral)) {
      return;
    }
    existingErrorMap[errorMsgLiteral] = '' + currentID++;
  }

  function flush(cb) {
    fs.writeFileSync(
      errorMapFilePath,
      JSON.stringify(invertObject(existingErrorMap), null, 2) + '\n',
      'utf-8'
    );
  }

  return function extractErrors(source) {
    transform(source);
    flush();
  };
};
