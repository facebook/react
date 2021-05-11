/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/// <reference path="./plugin-syntax-jsx.d.ts" />

import jsx from "@babel/plugin-syntax-jsx";
import type { PluginObj } from "@babel/core";
import type * as BabelCore from "@babel/core";
import { createCompilerDriver } from "./CompilerDriver";
import { CompilerOptions, parseCompilerOptions } from "./CompilerOptions";

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
      Program: {
        enter(program, pass) {
          let compilerOptions: CompilerOptions;
          try {
            compilerOptions = parseCompilerOptions(pass.opts);
          } catch (err) {
            throw new Error(
              `PluginOptions is required to be valid CompilerOptions: ${err}.`
            );
          }
          let compiler = createCompilerDriver(compilerOptions, program);
          compiler.compile();
        },
      },
    },
  };
}
