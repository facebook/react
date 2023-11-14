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
  type CompilerError,
  type CompilerErrorDetail,
  type PluginOptions,
} from "babel-plugin-react-forget/src";
import type { Rule } from "eslint";
import * as HermesParser from "hermes-parser";

type CompilerErrorDetailWithLoc = Omit<CompilerErrorDetail, "loc"> & {
  loc: BabelSourceLocation;
};

type UserProvidedLogger = (...args: unknown[]) => void;

function assertExhaustive(_: never, errorMsg: string): never {
  throw new Error(errorMsg);
}

function isReactForgetCompilerError(err: Error): err is CompilerError {
  return err.name === "ReactForgetCompilerError";
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
  environment: {
    validateHooksUsage: false,
  },
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
  },
  create(context: Rule.RuleContext) {
    let logger: UserProvidedLogger | null = null;
    if (
      context.options[0] != null &&
      typeof context.options[0] === "function"
    ) {
      logger = context.options[0];
    }
    // Compat with older versions of eslint
    const sourceCode = context.sourceCode?.text ?? context.getSourceCode().text;
    const filename = context.filename ?? context.getFilename();

    const babelAST = HermesParser.parse(sourceCode, {
      babel: true,
      enableExperimentalComponentSyntax: true,
      sourceFilename: filename,
      sourceType: "module",
    });
    if (babelAST != null) {
      try {
        transformFromAstSync(babelAST, sourceCode, {
          filename,
          highlightCode: false,
          retainLines: true,
          plugins: [
            [PluginProposalPrivateMethods, { loose: true }],
            [ReactForgetBabelPlugin, COMPILER_OPTIONS],
          ],
          sourceType: "module",
        });
      } catch (err) {
        if (isReactForgetCompilerError(err) && Array.isArray(err.details)) {
          for (const detail of err.details) {
            if (!isReportableDiagnostic(detail)) {
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
              message: `[ReactForget] ${detail.reason}`,
              loc: detail.loc,
              suggest,
            });
          }
        } else if (logger != null) {
          logger(err);
        }
      }
    }
    return {};
  },
};

export default rule;
