/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { transformFromAstSync } from "@babel/core";
// @ts-expect-error
import PluginProposalPrivateMethods from "@babel/plugin-proposal-private-methods";
import type { SourceLocation as BabelSourceLocation } from "@babel/types";
import BabelPluginReactCompiler, {
  CompilerSuggestionOperation,
  ErrorSeverity,
  parsePluginOptions,
  validateEnvironmentConfig,
  type CompilerError,
  type CompilerErrorDetail,
  type PluginOptions,
} from "babel-plugin-react-compiler/src";
import type { Rule } from "eslint";
import * as HermesParser from "hermes-parser";

type CompilerErrorDetailWithLoc = Omit<CompilerErrorDetail, "loc"> & {
  loc: BabelSourceLocation;
};

function assertExhaustive(_: never, errorMsg: string): never {
  throw new Error(errorMsg);
}

function isReactCompilerError(err: Error): err is CompilerError {
  return err.name === "ReactCompilerError";
}

const DEFAULT_REPORTABLE_LEVELS = new Set([
  ErrorSeverity.InvalidReact,
  ErrorSeverity.InvalidJS,
]);
let reportableLevels = DEFAULT_REPORTABLE_LEVELS;

function isReportableDiagnostic(
  detail: CompilerErrorDetail
): detail is CompilerErrorDetailWithLoc {
  return (
    reportableLevels.has(detail.severity) &&
    detail.loc != null &&
    typeof detail.loc !== "symbol"
  );
}

const COMPILER_OPTIONS: Partial<PluginOptions> = {
  noEmit: true,
  compilationMode: "infer",
  panicThreshold: "all_errors",
};

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Surfaces diagnostics from React Forget",
      recommended: true,
    },
    fixable: "code",
    hasSuggestions: true,
    // validation is done at runtime with zod
    schema: [{ type: "object", additionalProperties: true }],
  },
  create(context: Rule.RuleContext) {
    // Compat with older versions of eslint
    const sourceCode = context.sourceCode?.text ?? context.getSourceCode().text;
    const filename = context.filename ?? context.getFilename();
    const userOpts = context.options[0] ?? {};
    if (
      userOpts["reportableLevels"] != null &&
      userOpts["reportableLevels"] instanceof Set
    ) {
      reportableLevels = userOpts["reportableLevels"];
    } else {
      reportableLevels = DEFAULT_REPORTABLE_LEVELS;
    }
    const options: PluginOptions = {
      ...parsePluginOptions(userOpts),
      ...COMPILER_OPTIONS,
    };

    try {
      options.environment = validateEnvironmentConfig(
        options.environment ?? {}
      );
    } catch (err) {
      options.logger?.logEvent("", err);
    }

    function hasFlowSuppression(
      nodeLoc: BabelSourceLocation,
      suppression: string
    ) {
      const sourceCode = context.getSourceCode();
      const comments = sourceCode.getAllComments();
      const flowSuppressionRegex = new RegExp(
        "\\$FlowFixMe\\[" + suppression + "\\]"
      );
      for (const commentNode of comments) {
        if (
          flowSuppressionRegex.test(commentNode.value) &&
          commentNode.loc!.end.line === nodeLoc.start.line - 1
        ) {
          return true;
        }
      }
      return false;
    }

    let babelAST;
    if (filename.endsWith(".tsx") || filename.endsWith(".ts")) {
      try {
        const { parse: babelParse } = require("@babel/parser");
        babelAST = babelParse(sourceCode, {
          filename,
          sourceType: "unambiguous",
          plugins: ["typescript", "jsx"],
        });
      } catch {}
    } else {
      try {
        babelAST = HermesParser.parse(sourceCode, {
          babel: true,
          enableExperimentalComponentSyntax: true,
          sourceFilename: filename,
          sourceType: "module",
        });
      } catch {}
    }

    if (babelAST != null) {
      try {
        transformFromAstSync(babelAST, sourceCode, {
          filename,
          highlightCode: false,
          retainLines: true,
          plugins: [
            [PluginProposalPrivateMethods, { loose: true }],
            [BabelPluginReactCompiler, options],
          ],
          sourceType: "module",
          configFile: false,
          babelrc: false,
        });
      } catch (err) {
        if (isReactCompilerError(err) && Array.isArray(err.details)) {
          for (const detail of err.details) {
            if (!isReportableDiagnostic(detail)) {
              continue;
            }
            if (hasFlowSuppression(detail.loc, "react-rule-hook")) {
              // If Flow already caught this error, we don't need to report it again.
              continue;
            }
            let suggest: Array<Rule.SuggestionReportDescriptor> = [];
            if (Array.isArray(detail.suggestions)) {
              for (const suggestion of detail.suggestions) {
                switch (suggestion.op) {
                  case CompilerSuggestionOperation.InsertBefore:
                    suggest.push({
                      desc: suggestion.description,
                      fix(fixer) {
                        return fixer.insertTextBeforeRange(
                          suggestion.range,
                          suggestion.text
                        );
                      },
                    });
                    break;
                  case CompilerSuggestionOperation.InsertAfter:
                    suggest.push({
                      desc: suggestion.description,
                      fix(fixer) {
                        return fixer.insertTextAfterRange(
                          suggestion.range,
                          suggestion.text
                        );
                      },
                    });
                    break;
                  case CompilerSuggestionOperation.Replace:
                    suggest.push({
                      desc: suggestion.description,
                      fix(fixer) {
                        return fixer.replaceTextRange(
                          suggestion.range,
                          suggestion.text
                        );
                      },
                    });
                    break;
                  case CompilerSuggestionOperation.Remove:
                    suggest.push({
                      desc: suggestion.description,
                      fix(fixer) {
                        return fixer.removeRange(suggestion.range);
                      },
                    });
                    break;
                  default:
                    assertExhaustive(
                      suggestion,
                      "Unhandled suggestion operation"
                    );
                }
              }
            }
            context.report({
              message: detail.reason,
              loc: detail.loc,
              suggest,
            });
          }
        } else {
          options.logger?.logEvent("", err);
        }
      }
    }
    return {};
  },
};

export default rule;
