/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/// <reference path="./plugin-syntax-jsx.d.ts" />

import type * as BabelCore from "@babel/core";
import type { PluginObj } from "@babel/core";
import jsx from "@babel/plugin-syntax-jsx";
import { compile } from "../CompilerPipeline";

/**
 * The React Forget Babel Plugin
 * @param {*} babel
 * @returns
 */
export default function (babel: typeof BabelCore): PluginObj {
  return {
    name: "react-forget",
    inherits: jsx,
    visitor: {
      FunctionDeclaration: {
        enter(fn, pass) {
          const ast = compile(fn);
          fn.replaceWith(ast);
        },
      },
    },
  };
}
