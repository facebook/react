/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

export default function(babel, opts = {}) {
  if (typeof babel.getEnv === 'function') {
    // Only available in Babel 7.
    const env = babel.getEnv();
    if (env !== 'development' && !opts.skipEnvCheck) {
      throw new Error(
        'React Named Hooks Babel transform should only be enabled in development environment. ' +
          'Instead, the environment is: "' +
          env +
          '". If you want to override this check, pass {skipEnvCheck: true} as plugin options.',
      );
    }
  }

  const {types: t} = babel;

  return {
    visitor: {
      VariableDeclarator(path) {
        const {node} = path;
        const hookName = node.init.callee.name.slice(3).toLowerCase();

        let debugName;
        switch (hookName) {
          case 'state':
          case 'reducer':
            debugName = node.id.elements[0].name;
            break;
          case 'ref':
          case 'callback':
          case 'memo':
            debugName = node.id.name;
            break;
          case 'context':
            debugName = node.init.arguments[0].name;
            break;
          default:
            return;
        }

        if (hookName === debugName.toLowerCase()) return;

        if (debugName) {
          path.parentPath.insertAfter(
            t.expressionStatement(
              t.callExpression(t.identifier('useDebugName'), [
                t.stringLiteral(debugName),
              ]),
            ),
          );
        }
      },
    },
  };
}
