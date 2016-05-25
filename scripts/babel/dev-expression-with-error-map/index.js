/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/*
 * TODO
 * 1. Branch on `process.env.NODE_ENV`
 * 2. Read if JSON exists
 * 3. Keep `%s`s
 * 4. Concat strings (e.g., 'err' + 'msg' + 'bla')
 * 5. Error out when the JSON is out of date
 * 6. Figure out how to test this guy
 * 7. Add comments back
 */
'use strict';

var MapBuilder = require('./MapBuilder');

var countFiles = require('./countFiles');
var shouldConstructNewMap = require('./shouldConstructNewMap');
var writeJSON = require('./writeJSON');

module.exports = function(babel) {
  var t = babel.types;
  var SEEN_SYMBOL = Symbol();

  var DEV_EXPRESSION = t.binaryExpression(
    '!==',
    t.memberExpression(
      t.memberExpression(
        t.identifier('process'),
        t.identifier('env'),
        false
      ),
      t.identifier('NODE_ENV'),
      false
    ),
    t.stringLiteral('production')
  );

  var mBuilder = new MapBuilder();

  var options = {};
  var currentFileCount = 0;
  var totalFileCount = countFiles();

  return {
    visitor: {
      Program: {
        enter: function(path, state) {
          if (currentFileCount === 0) {
            options.shouldConstructNewMap = shouldConstructNewMap(state.opts.output);
          }

          currentFileCount++;
        },
        exit: function(path, state) {
          if (currentFileCount > totalFileCount) {
            throw new Error('This should never happen. Write a better error msg here'); // TODO
          }

          if (currentFileCount === totalFileCount) {
            console.log('done!');
            writeJSON(mBuilder.generate(), state.opts.output);
          }
        },
      },
      Identifier: {
        enter: function(path) {
          // Do nothing when testing
          if (process.env.NODE_ENV === 'test') {
            return;
          }
          // replace __DEV__ with process.env.NODE_ENV !== 'production'
          if (path.isIdentifier({name: '__DEV__'})) {
            path.replaceWith(DEV_EXPRESSION);
          }
        },
      },
      CallExpression: {
        exit: function(path) {
          var node = path.node;
          // Do nothing when testing
          if (process.env.NODE_ENV === 'test') {
            return;
          }
          // Ignore if it's already been processed
          if (node[SEEN_SYMBOL]) {
            return;
          }
          if (path.get('callee').isIdentifier({name: 'invariant'})) {
            var condition = node.arguments[0];
            var errorMsg = node.arguments[1].value;
            // TODO branch on `node.arguments[1]`'s type
            var prodErrorId = mBuilder.add(errorMsg);

            var devInvariant = t.callExpression(
              node.callee,
              [t.booleanLiteral(false)].concat(node.arguments.slice(1))
            );

            devInvariant[SEEN_SYMBOL] = true;
            var prodInvariant = t.callExpression(
              node.callee,
              // TODO add `%s`s
              [t.booleanLiteral(false), t.stringLiteral(`Production Error #${prodErrorId}`)]
            );

            prodInvariant[SEEN_SYMBOL] = true;
            path.replaceWith(t.ifStatement(
              t.unaryExpression('!', condition),
              t.blockStatement([
                t.ifStatement(
                  DEV_EXPRESSION,
                  t.blockStatement([
                    t.expressionStatement(devInvariant),
                  ]),
                  t.blockStatement([
                    t.expressionStatement(prodInvariant),
                  ])
                ),
              ])
            ));
          } else if (path.get('callee').isIdentifier({name: 'warning'})) {
            // Turns this code:
            //
            // warning(condition, argument, argument);
            //
            // into this:
            //
            // if ("production" !== process.env.NODE_ENV) {
            //   warning(condition, argument, argument);
            // }
            //
            // The goal is to strip out warning calls entirely in production. We
            // don't need the same optimizations for conditions that we use for
            // invariant because we don't care about an extra call in __DEV__

            node[SEEN_SYMBOL] = true;
            path.replaceWith(t.ifStatement(
              DEV_EXPRESSION,
              t.blockStatement([
                t.expressionStatement(
                  node
                ),
              ])
            ));
          }
        },
      },
    },
  };
};
