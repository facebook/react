/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const babylon = require('babylon');
const fs = require('fs');
const through = require('through2');
const traverse = require('babel-traverse').default;
const gs = require('glob-stream');

const evalToString = require('../shared/evalToString');

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

const warnings = new Set();

function transform(file, enc, cb) {
  fs.readFile(file.path, 'utf8', function(err, source) {
    if (err) {
      cb(err);
      return;
    }

    const ast = babylon.parse(source, babylonOptions);
    traverse(ast, {
      CallExpression: {
        exit: function(astPath) {
          const callee = astPath.get('callee');
          if (
            callee.isIdentifier({name: 'warning'}) ||
            callee.isIdentifier({name: 'warningWithoutStack'}) ||
            callee.isIdentifier({name: 'lowPriorityWarning'})
          ) {
            const node = astPath.node;

            // warning messages can be concatenated (`+`) at runtime, so here's
            // a trivial partial evaluator that interprets the literal value
            const warningMsgLiteral = evalToString(node.arguments[1]);
            warnings.add(JSON.stringify(warningMsgLiteral));
          }
        },
      },
    });

    cb(null);
  });
}

gs([
  'packages/**/*.js',
  '!packages/shared/warning.js',
  '!**/__tests__/**/*.js',
  '!**/__mocks__/**/*.js',
]).pipe(
  through.obj(transform, cb => {
    process.stdout.write(
      Array.from(warnings)
        .sort()
        .join('\n') + '\n'
    );
    cb();
  })
);
