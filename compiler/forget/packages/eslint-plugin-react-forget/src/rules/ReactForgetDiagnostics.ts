/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { transformFromAstSync } from "@babel/core";
import * as parser from "@babel/parser";
import ReactForgetBabelPlugin, {
  CompilerError,
  type PluginOptions,
} from "babel-plugin-react-forget";
import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Surfaces diagnostics from React Forget",
      recommended: true,
    },
  },
  create(context: Rule.RuleContext) {
    // Compat with older versions of eslint
    const sourceCode = context.sourceCode?.text ?? context.getSourceCode().text;
    const filename = context.filename ?? context.getFilename();

    const opts: Partial<PluginOptions> = {
      panicOnBailout: false,
      environment: {
        validateHooksUsage: true,
        validateFrozenLambdas: true,
        validateRefAccessDuringRender: true,
      },
    };
    const babelAST = parser.parse(sourceCode, {
      sourceFilename: filename,
      plugins: ["jsx", "flow"],
      sourceType: "module",
    });
    if (babelAST != null) {
      try {
        transformFromAstSync(babelAST, sourceCode, {
          filename,
          highlightCode: false,
          retainLines: true,
          plugins: [
            [ReactForgetBabelPlugin, opts],
            "babel-plugin-fbt",
            "babel-plugin-fbt-runtime",
          ],
          sourceType: "module",
        });
      } catch (err) {
        if (err instanceof CompilerError) {
          for (const detail of err.details) {
            if (detail.loc != null) {
              context.report({
                message: detail.toString(),
                loc: detail.loc,
              });
            }
          }
        } else {
          throw new Error(err);
        }
      }
    }
    return {};
  },
};

export default rule;
