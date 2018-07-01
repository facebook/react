/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const fs = require('fs');
const evalToString = require('../shared/evalToString');
const invertObject = require('./invertObject');

module.exports = function(babel) {
  const t = babel.types;

  const SEEN_SYMBOL = Symbol('replace-invariant-error-codes.seen');

  // Generate a hygienic identifier
  function getProdInvariantIdentifier(path, file, localState) {
    if (!localState.prodInvariantIdentifier) {
      localState.prodInvariantIdentifier = file.addImport(
        'shared/reactProdInvariant',
        'default',
        'prodInvariant'
      );
    }
    return localState.prodInvariantIdentifier;
  }

  const DEV_EXPRESSION = t.identifier('__DEV__');

  return {
    pre() {
      this.prodInvariantIdentifier = null;
    },

    visitor: {
      CallExpression: {
        exit(path, file) {
          const node = path.node;
          // Ignore if it's already been processed
          if (node[SEEN_SYMBOL]) {
            return;
          }
          // Insert `import PROD_INVARIANT from 'reactProdInvariant';`
          // before all `invariant()` calls.
          if (path.get('callee').isIdentifier({name: 'invariant'})) {
            // Turns this code:
            //
            // invariant(condition, argument, 'foo', 'bar');
            //
            // into this:
            //
            // if (!condition) {
            //   if ("production" !== process.env.NODE_ENV) {
            //     invariant(false, argument, 'foo', 'bar');
            //   } else {
            //     PROD_INVARIANT('XYZ', 'foo', 'bar');
            //   }
            // }
            //
            // where
            // - `XYZ` is an error code: a unique identifier (a number string)
            //   that references a verbose error message.
            //   The mapping is stored in `scripts/error-codes/codes.json`.
            // - `PROD_INVARIANT` is the `reactProdInvariant` function that always throws with an error URL like
            //   http://reactjs.org/docs/error-decoder.html?invariant=XYZ&args[]=foo&args[]=bar
            //
            // Specifically this does 3 things:
            // 1. Checks the condition first, preventing an extra function call.
            // 2. Adds an environment check so that verbose error messages aren't
            //    shipped to production.
            // 3. Rewrites the call to `invariant` in production to `reactProdInvariant`
            //   - `reactProdInvariant` is always renamed to avoid shadowing
            // The generated code is longer than the original code but will dead
            // code removal in a minifier will strip that out.
            const condition = node.arguments[0];
            const errorMsgLiteral = evalToString(node.arguments[1]);

            const devInvariant = t.callExpression(
              node.callee,
              [
                t.booleanLiteral(false),
                t.stringLiteral(errorMsgLiteral),
              ].concat(node.arguments.slice(2))
            );

            devInvariant[SEEN_SYMBOL] = true;

            // Avoid caching because we write it as we go.
            const existingErrorMap = JSON.parse(
              fs.readFileSync(__dirname + '/codes.json', 'utf-8')
            );
            const errorMap = invertObject(existingErrorMap);

            const localInvariantId = getProdInvariantIdentifier(
              path,
              file,
              this
            );
            const prodErrorId = errorMap[errorMsgLiteral];
            let body = null;

            if (prodErrorId === undefined) {
              // The error wasn't found in the map.
              // This is only expected to occur on master since we extract codes before releases.
              // Keep the original invariant.
              body = t.expressionStatement(devInvariant);
            } else {
              const prodInvariant = t.callExpression(
                localInvariantId,
                [t.stringLiteral(prodErrorId)].concat(node.arguments.slice(2))
              );
              prodInvariant[SEEN_SYMBOL] = true;
              // The error was found in the map.
              // Switch between development and production versions depending on the env.
              body = t.ifStatement(
                DEV_EXPRESSION,
                t.blockStatement([t.expressionStatement(devInvariant)]),
                t.blockStatement([t.expressionStatement(prodInvariant)])
              );
            }

            path.replaceWith(
              t.ifStatement(
                t.unaryExpression('!', condition),
                t.blockStatement([body])
              )
            );
          }
        },
      },
    },
  };
};
