/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/// <reference path="./plugin-syntax-jsx.d.ts" />

import type * as BabelCore from "@babel/core";
import jsx from "@babel/plugin-syntax-jsx";
import { compile } from "../CompilerPipeline";

/**
 * The React Forget Babel Plugin
 * @param {*} _babel
 * @returns
 */
export default function ReactForgetBabelPlugin(
  _babel: typeof BabelCore
): BabelCore.PluginObj {
  return {
    name: "react-forget",
    inherits: jsx,
    visitor: {
      FunctionDeclaration: {
        enter(fn, _pass) {
          if (fn.scope.getProgramParent() !== fn.scope.parent) {
            return;
          }
          const ast = compile(fn);

          // We are generating a new FunctionDeclaration node, so we must skip over it or this
          // traversal will loop infinitely.
          fn.replaceWith(ast);
          fn.skip();
        },
      },
    },
  };
}
