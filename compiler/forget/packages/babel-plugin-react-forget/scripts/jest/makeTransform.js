/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const babelJest = require("babel-jest");
const { compile } = require("babel-plugin-react-forget");
const { jsx } = require("@babel/plugin-syntax-jsx");
const { execSync } = require("child_process");

module.exports = (useForget) => {
  function createTransformer() {
    return babelJest.createTransformer({
      passPerPreset: true,
      presets: [
        "@babel/preset-typescript",
        {
          plugins: [
            useForget
              ? [
                  ReactForgetFunctionTransform,
                  {
                    // Jest hashes the babel config as a cache breaker.
                    // (see https://github.com/jestjs/jest/blob/v29.6.2/packages/babel-jest/src/index.ts#L84)
                    cacheKey: execSync(
                      "yarn --silent --cwd ../.. hash packages/babel-plugin-react-forget/dist"
                    ).toString(),
                  },
                ]
              : "@babel/plugin-syntax-jsx",
          ],
        },
        "@babel/preset-react",
        {
          plugins: [
            [
              function BabelPluginRewriteRequirePath(babel) {
                return {
                  visitor: {
                    CallExpression(path) {
                      if (path.node.callee.name === "require") {
                        const arg = path.node.arguments[0];
                        if (arg.type === "StringLiteral") {
                          // The compiler adds requires of "React", which is expected to be a wrapper
                          // around the "react" package. For tests, we just rewrite the require.
                          if (arg.value === "React") {
                            arg.value = "react";
                          }
                        }
                      }
                    },
                  },
                };
              },
            ],
            "@babel/plugin-transform-modules-commonjs",
          ],
        },
      ],
      targets: {
        esmodules: true,
      },
    });
  }

  return {
    createTransformer,
  };
};

// Copied from react/scripts/babel/transform-forget.js
function isReactComponentLike(fn) {
  let isReactComponent = false;
  let hasNoUseForgetDirective = false;

  // React components start with an upper case letter
  if (fn.node.id.name[0].toUpperCase() !== fn.node.id.name[0]) {
    return false;
  }

  fn.traverse({
    DirectiveLiteral(path) {
      if (path.node.value === "use no forget") {
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
        path.node.callee.type === "Identifier" &&
        path.node.callee.name.startsWith("use")
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
  return {
    name: "react-forget-e2e",
    inherits: jsx,
    visitor: {
      FunctionDeclaration(fn) {
        if (compiledFns.has(fn.node)) {
          return;
        }

        if (!isReactComponentLike(fn)) {
          return;
        }

        const compiled = compile(fn);
        compiledFns.add(compiled);
        fn.replaceWith(compiled);
      },
    },
  };
}
