/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {jsx} from '@babel/plugin-syntax-jsx';
import babelJest from 'babel-jest';
import {compile} from 'babel-plugin-react-compiler';
import {execSync} from 'child_process';

import type {NodePath, Visitor} from '@babel/traverse';
import type {CallExpression, FunctionDeclaration} from '@babel/types';
import * as t from '@babel/types';
import {
  EnvironmentConfig,
  validateEnvironmentConfig,
} from 'babel-plugin-react-compiler';
import {basename} from 'path';

/**
 * -- IMPORTANT --
 * When making changes to any babel plugins defined this file
 * (e.g. `ReactForgetFunctionTransform`), make sure to bump e2eTransformerCacheKey
 * as our script files are currently not used for babel cache breaking!!
 */
const e2eTransformerCacheKey = 1;
const forgetOptions: EnvironmentConfig = validateEnvironmentConfig({
  enableAssumeHooksFollowRulesOfReact: true,
  enableFunctionOutlining: false,
});
const debugMode = process.env['DEBUG_FORGET_COMPILER'] != null;

module.exports = (useForget: boolean) => {
  function createTransformer() {
    return babelJest.createTransformer({
      passPerPreset: true,
      presets: [
        '@babel/preset-typescript',
        {
          plugins: [
            useForget
              ? [
                  ReactForgetFunctionTransform,
                  {
                    /*
                     * Jest hashes the babel config as a cache breaker.
                     * (see https://github.com/jestjs/jest/blob/v29.6.2/packages/babel-jest/src/index.ts#L84)
                     */
                    compilerCacheKey: execSync(
                      'yarn --silent --cwd ../.. hash packages/babel-plugin-react-compiler/dist',
                    ).toString(),
                    transformOptionsCacheKey: forgetOptions,
                    e2eTransformerCacheKey,
                  },
                ]
              : '@babel/plugin-syntax-jsx',
          ],
        },
        '@babel/preset-react',
        {
          plugins: [
            [
              function BabelPluginRewriteRequirePath(): {visitor: Visitor} {
                return {
                  visitor: {
                    CallExpression(path: NodePath<CallExpression>): void {
                      const {callee} = path.node;
                      if (
                        callee.type === 'Identifier' &&
                        callee.name === 'require'
                      ) {
                        const arg = path.node.arguments[0];
                        if (arg.type === 'StringLiteral') {
                          /*
                           * The compiler adds requires of "React", which is expected to be a wrapper
                           * around the "react" package. For tests, we just rewrite the require.
                           */
                          if (arg.value === 'React') {
                            arg.value = 'react';
                          }
                        }
                      }
                    },
                  },
                };
              },
            ],
            '@babel/plugin-transform-modules-commonjs',
          ],
        },
      ],
      targets: {
        esmodules: true,
      },
    } as any);
    /*
     * typecast needed as DefinitelyTyped does not have updated Babel configs types yet
     * (missing passPerPreset and targets).
     */
  }

  return {
    createTransformer,
  };
};

// Mostly copied from react/scripts/babel/transform-forget.js
function isReactComponentLike(fn: NodePath<FunctionDeclaration>): boolean {
  let isReactComponent = false;
  let hasNoUseForgetDirective = false;

  /*
   * React components start with an upper case letter,
   * React hooks start with `use`
   */
  if (
    fn.node.id == null ||
    (fn.node.id.name[0].toUpperCase() !== fn.node.id.name[0] &&
      !/^use[A-Z0-9]/.test(fn.node.id.name))
  ) {
    return false;
  }

  fn.traverse({
    DirectiveLiteral(path) {
      if (path.node.value === 'use no forget') {
        hasNoUseForgetDirective = true;
      }
    },

    JSX(path) {
      // Is there is a JSX node created in the current function context?
      if (path.scope.getFunctionParent()?.path.node === fn.node) {
        isReactComponent = true;
      }
    },

    CallExpression(path) {
      // Is there hook usage?
      if (
        path.node.callee.type === 'Identifier' &&
        !/^use[A-Z0-9]/.test(path.node.callee.name)
      ) {
        isReactComponent = true;
      }
    },
  });

  if (hasNoUseForgetDirective) {
    return false;
  }

  return isReactComponent;
}

function ReactForgetFunctionTransform() {
  const compiledFns = new Set();
  const visitor = {
    FunctionDeclaration(fn: NodePath<FunctionDeclaration>, state: any): void {
      if (compiledFns.has(fn.node)) {
        return;
      }

      if (!isReactComponentLike(fn)) {
        return;
      }
      if (debugMode) {
        const filename = basename(state.file.opts.filename);
        if (fn.node.loc && fn.node.id) {
          console.log(
            ` Compiling ${filename}:${fn.node.loc.start.line}:${fn.node.loc.start.column}  ${fn.node.id.name}`,
          );
        } else {
          console.log(` Compiling ${filename} ${fn.node.id?.name}`);
        }
      }

      const compiled = compile(
        fn,
        forgetOptions,
        'Other',
        '_c',
        null,
        null,
        null,
      );
      compiledFns.add(compiled);

      const fun = t.functionDeclaration(
        compiled.id,
        compiled.params,
        compiled.body,
        compiled.generator,
        compiled.async,
      );
      fn.replaceWith(fun);
      fn.skip();
    },
  };
  return {
    name: 'react-forget-e2e',
    inherits: jsx,
    visitor,
  };
}
