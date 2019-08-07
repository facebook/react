/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const fs = require('fs');
const evalToString = require('../shared/evalToString');
const invertObject = require('./invertObject');
const helperModuleImports = require('@babel/helper-module-imports');

module.exports = function(babel) {
  const t = babel.types;

  const DEV_EXPRESSION = t.identifier('__DEV__');

  return {
    visitor: {
      CallExpression(path, file) {
        const node = path.node;
        const noMinify = file.opts.noMinify;
        if (path.get('callee').isIdentifier({name: 'invariant'})) {
          // Turns this code:
          //
          // invariant(condition, 'A %s message that contains %s', adj, noun);
          //
          // into this:
          //
          // if (!condition) {
          //   if (__DEV__) {
          //     throw ReactError(Error(`A ${adj} message that contains ${noun}`));
          //   } else {
          //     throw ReactErrorProd(Error(ERR_CODE), adj, noun);
          //   }
          // }
          //
          // where ERR_CODE is an error code: a unique identifier (a number
          // string) that references a verbose error message. The mapping is
          // stored in `scripts/error-codes/codes.json`.
          const condition = node.arguments[0];
          const errorMsgLiteral = evalToString(node.arguments[1]);
          const errorMsgExpressions = Array.from(node.arguments.slice(2));
          const errorMsgQuasis = errorMsgLiteral
            .split('%s')
            .map(raw => t.templateElement({raw, cooked: String.raw({raw})}));

          const reactErrorIdentfier = helperModuleImports.addDefault(
            path,
            'shared/ReactError',
            {
              nameHint: 'ReactError',
            }
          );

          // Outputs:
          //   throw ReactError(Error(`A ${adj} message that contains ${noun}`));
          const devThrow = t.throwStatement(
            t.callExpression(reactErrorIdentfier, [
              t.callExpression(t.identifier('Error'), [
                t.templateLiteral(errorMsgQuasis, errorMsgExpressions),
              ]),
            ])
          );

          if (noMinify) {
            // Error minification is disabled for this build.
            //
            // Outputs:
            //   if (!condition) {
            //     throw ReactError(Error(`A ${adj} message that contains ${noun}`));
            //   }
            path.replaceWith(
              t.ifStatement(
                t.unaryExpression('!', condition),
                t.blockStatement([devThrow])
              )
            );
            return;
          }

          // Avoid caching because we write it as we go.
          const existingErrorMap = JSON.parse(
            fs.readFileSync(__dirname + '/codes.json', 'utf-8')
          );
          const errorMap = invertObject(existingErrorMap);

          let prodErrorId = errorMap[errorMsgLiteral];

          if (prodErrorId === undefined) {
            // There is no error code for this message. Add an inline comment
            // that flags this as an unminified error. This allows the build
            // to proceed, while also allowing a post-build linter to detect it.
            //
            // Outputs:
            //   /* FIXME (minify-errors-in-prod): Unminified error message in production build! */
            //   if (!condition) {
            //     throw ReactError(Error(`A ${adj} message that contains ${noun}`));
            //   }
            path.replaceWith(
              t.ifStatement(
                t.unaryExpression('!', condition),
                t.blockStatement([devThrow])
              )
            );
            path.addComment(
              'leading',
              'FIXME (minify-errors-in-prod): Unminified error message in production build!'
            );
            return;
          }
          prodErrorId = parseInt(prodErrorId, 10);

          // Import ReactErrorProd
          const reactErrorProdIdentfier = helperModuleImports.addDefault(
            path,
            'shared/ReactErrorProd',
            {nameHint: 'ReactErrorProd'}
          );

          // Outputs:
          //   throw ReactErrorProd(Error(ERR_CODE), adj, noun);
          const prodThrow = t.throwStatement(
            t.callExpression(reactErrorProdIdentfier, [
              t.callExpression(t.identifier('Error'), [
                t.numericLiteral(prodErrorId),
              ]),
              ...errorMsgExpressions,
            ])
          );

          // Outputs:
          //   if (!condition) {
          //     if (__DEV__) {
          //       throw ReactError(Error(`A ${adj} message that contains ${noun}`));
          //     } else {
          //       throw ReactErrorProd(Error(ERR_CODE), adj, noun);
          //     }
          //   }
          path.replaceWith(
            t.ifStatement(
              t.unaryExpression('!', condition),
              t.blockStatement([
                t.ifStatement(
                  DEV_EXPRESSION,
                  t.blockStatement([devThrow]),
                  t.blockStatement([prodThrow])
                ),
              ])
            )
          );
        }
      },
    },
  };
};
