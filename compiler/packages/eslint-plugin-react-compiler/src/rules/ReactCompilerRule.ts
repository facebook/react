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
import ReactForgetBabelPlugin, {
  CompilerSuggestionOperation,
  ErrorSeverity,
  parsePluginOptions,
  validateEnvironmentConfig,
  type CompilerError,
  type CompilerErrorDetail,
  type PluginOptions,
} from "babel-plugin-react-forget/src";
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

function isReportableDiagnostic(
  detail: CompilerErrorDetail
): detail is CompilerErrorDetailWithLoc {
  let isReportable = false;
  switch (detail.severity) {
    case ErrorSeverity.InvalidReact:
    case ErrorSeverity.InvalidJS:
      isReportable = true;
      break;
    case ErrorSeverity.InvalidConfig:
    case ErrorSeverity.Invariant:
    case ErrorSeverity.CannotPreserveMemoization:
    case ErrorSeverity.Todo:
      break;
    default:
      assertExhaustive(detail.severity, "Unhandled error severity");
  }

  return (
    isReportable === true &&
    detail.loc != null &&
    typeof detail.loc !== "symbol"
  );
}

const COMPILER_OPTIONS: Partial<PluginOptions> = {
  noEmit: true,
  compilationMode: "infer",
  panicThreshold: "CRITICAL_ERRORS",
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
    const options: PluginOptions = {
      ...parsePluginOptions(context.options[0] ?? {}),
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
    try {
      // first try parsing with the faster Hermes that also supports JS, Flow
      // and most TS syntax
      babelAST = HermesParser.parse(sourceCode, {
        babel: true,
        enableExperimentalComponentSyntax: true,
        sourceFilename: filename,
        sourceType: "module",
      });
    } catch {
      // If Hermes fails, try Babel for advanced TS syntax.
      if (
        context.filename.endsWith(".tsx") ||
        context.filename.endsWith(".ts")
      ) {
        try {
          const { parse: babelParse } = require("@babel/parser");
          babelAST = babelParse(sourceCode, {
            sourceType: "unambiguous",
            plugins: ["typescript", "jsx"],
          });
        } catch {}
      }
    }

    if (babelAST != null) {
      try {
        transformFromAstSync(babelAST, sourceCode, {
          filename,
          highlightCode: false,
          retainLines: true,
          plugins: [
            [PluginProposalPrivateMethods, { loose: true }],
            [ReactForgetBabelPlugin, options],
          ],
          sourceType: "module",
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
