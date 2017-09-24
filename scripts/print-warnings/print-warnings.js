/**
 * Copyright (c) 2013-present, Facebook, Inc.
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
const Bundles = require('../rollup/bundles');
const Modules = require('../rollup/modules');

const evalToString = require('../shared/evalToString');

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

const sourcePaths = Bundles.bundles
  .filter(
    bundle =>
      bundle.bundleTypes.indexOf(Bundles.bundleTypes.FB_DEV) !== -1 ||
      bundle.bundleTypes.indexOf(Bundles.bundleTypes.FB_PROD) !== -1
  )
  .reduce((allPaths, bundle) => allPaths.concat(bundle.paths), [])
  .concat(Modules.getExcludedHasteGlobs().map(glob => `!${glob}`));

gs(sourcePaths).pipe(
  through.obj(transform, cb => {
    process.stdout.write(Array.from(warnings).sort().join('\n') + '\n');
    cb();
  })
);
