/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/// <reference path="./plugin-syntax-jsx.d.ts" />

import jsx from "@babel/plugin-syntax-jsx";
import type * as BabelCore from "@babel/core";
import { compileProgram } from "../CompilerEntrypoint";
import { parsePluginOptions } from "../CompilerOptions";

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
      // Note: Babel does some "smart" merging of visitors across plugins, so even if A is inserted
      // prior to B, if A does not have a Program visitor and B does, B will run first. We always
      // want Forget to run true to source as possible.
      Program(prog, pass): void {
        compileProgram(prog, {
          opts: parsePluginOptions(pass.opts),
          filename: pass.filename ?? null,
          comments: pass.file.ast.comments ?? [],
        });
      },
    },
  };
}
