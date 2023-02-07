/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/// <reference path="./plugin-syntax-jsx.d.ts" />

import * as t from "@babel/types";
import type * as BabelCore from "@babel/core";
import generate from "@babel/generator";
import jsx from "@babel/plugin-syntax-jsx";
import { CompilerFlags, parseCompilerFlags } from "../CompilerFlags";
import prettier from "prettier";
import { compile } from "../CompilerPipeline";

type BabelPluginPass = {
  opts: CompilerFlags;
};

/**
 * The React Forget Babel Plugin
 * @param {*} _babel
 * @returns
 */
export default function ReactForgetBabelPlugin(
  _babel: typeof BabelCore
): BabelCore.PluginObj {
  const visitor = {
    FunctionDeclaration(
      fn: BabelCore.NodePath<t.FunctionDeclaration>,
      pass: BabelPluginPass
    ) {
      if (pass.opts.enableOnlyOnUseForgetDirective) {
        let hasUseForgetDirective = false;
        for (const directive of fn.node.body.directives) {
          if (directive.value.value === "use forget") {
            hasUseForgetDirective = true;
            break;
          }
        }
        if (!hasUseForgetDirective) {
          return;
        }
      }
      if (fn.scope.getProgramParent() !== fn.scope.parent) {
        return;
      }
      const ast = compile(fn);

      // We are generating a new FunctionDeclaration node, so we must skip over it or this
      // traversal will loop infinitely.
      try {
        fn.replaceWith(ast);
        fn.skip();
      } catch (err) {
        const result = generate(ast);
        err.message = `${err.message}\n\n${prettier.format(result.code, {
          semi: true,
          parser: "babel-ts",
        })}`;
        throw err;
      }
    },
  };

  return {
    name: "react-forget",
    inherits: jsx,
    visitor: {
      // Note: Babel does some "smart" merging of visitors across plugins, so even if A is inserted
      // prior to B, if A does not have a Program visitor and B does, B will run first. We always
      // want Forget to run true to source as possible.
      Program(path, pass) {
        const flags = parseCompilerFlags(pass.opts);
        path.traverse(visitor, {
          ...pass,
          opts: { ...pass.opts, ...flags },
        });
      },
    },
  };
}
