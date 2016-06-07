/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var MapBuilder = require('./MapBuilder');

var evalToString = require('./evalToString');
var getCurrentErrorMap = require('./getCurrentErrorMap');
var getCurrentReactVersion = require('./getCurrentReactVersion');
var getFileCount = require('./getFileCount');
var invertObject = require('./invertObject');
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

  var currentFileCount = 0;
  var existingErrorMap = null;
  var totalFileCount = getFileCount();
  var currentReactVersion = null;

  return {
    visitor: {
      /*
       * We use the `Program` visitor to generate the error map (tricky, I know).
       */
      Program: {
        enter: function(path, state) {
          if (process.env.NODE_ENV === 'test' || existingErrorMap) {
            return;
          }

          if (currentFileCount === 0) { // figure out what to do
            currentReactVersion = getCurrentReactVersion();

            if (state.opts.forceBuild) {
              existingErrorMap = null;
              console.log(
                '`forceBuild` option specified. Will generate a new ' +
                'error map for version ' + currentReactVersion + '.'
              );

              currentFileCount++;
              return; // skip existing map checking
            }

            existingErrorMap = getCurrentErrorMap(state.opts.output);
            if (shouldConstructNewMap(existingErrorMap, currentReactVersion)) {
              existingErrorMap = null;
            } else {
              // here we invert the data object in memory for faster error code lookup
              existingErrorMap.data = invertObject(existingErrorMap.data);
            }

            if (existingErrorMap) {
              console.log(
                'Found a valid error map (version ' + existingErrorMap.version + ').'
              );
            } else {
              console.log(
                'Existing error map cannot be found or is out of date. ' +
                'Will generate a new one for version ' + currentReactVersion + '.'
              );
            }
          }

          currentFileCount++;
        },

        exit: function(path, state) {
          if (process.env.NODE_ENV === 'test' || existingErrorMap) {
            return;
          }

          if (currentFileCount > totalFileCount) {
            throw new Error(
              'Fatal: incorrect file count. ' +
              'Please update the glob patterns in `ReactGlobPatterns.js`.'
            );
          }

          if (currentFileCount === totalFileCount) {
            console.log('Writing error map file to `' + state.opts.output + '`...');
            var newMapData = mBuilder.generate();
            writeJSON(newMapData, state.opts.output, currentReactVersion);
            console.log(
              'Successfully generated error map for version ' + currentReactVersion + '.'
            );
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
          if (path.isIdentifier({ name: '__DEV__' })) {
            path.replaceWith(DEV_EXPRESSION);
          }
        },
      },

      CallExpression: {
        exit: function(path) {
          // Do nothing when testing
          if (process.env.NODE_ENV === 'test') {
            return;
          }

          var node = path.node;
          // Ignore if it's already been processed
          if (node[SEEN_SYMBOL]) {
            return;
          }
          if (path.get('callee').isIdentifier({name: 'invariant'})) {
            var condition = node.arguments[0];

            // error messages can be concatenated (`+`), so here's a
            // trivial partial evaluator that interprets the literal value
            var errorMsgLiteral = evalToString(node.arguments[1]);

            var prodErrorId;
            if (existingErrorMap) {
              prodErrorId = existingErrorMap.data[errorMsgLiteral];
              if (typeof prodErrorId === 'undefined') {
                // TODO: add a "forceBuild" option to the plugin?
                throw new Error(
                  'Fatal: error message "' + errorMsgLiteral +
                  '" cannot be found. The current React version ' +
                  'and the error map are probably out of sync. ' +
                  'Did you forget to bump the version number?'
                );
              }
            } else {
              prodErrorId = mBuilder.add(errorMsgLiteral);
            }

            var devInvariant = t.callExpression(
              node.callee,
              [t.booleanLiteral(false), t.stringLiteral(errorMsgLiteral)].concat(node.arguments.slice(2))
            );

            devInvariant[SEEN_SYMBOL] = true;
            var prodInvariant = t.callExpression(
              node.callee,
              // TODO should we do arguments and `%s`s here?
              [t.booleanLiteral(false), t.stringLiteral('Production Error #' + prodErrorId)]
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
