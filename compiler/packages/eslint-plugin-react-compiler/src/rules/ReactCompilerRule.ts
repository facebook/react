/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { transformFromAstSync } from "@babel/core";
// @ts-expect-error: no types available
import PluginProposalPrivateMethods from "@babel/plugin-proposal-private-methods";
import type { SourceLocation as BabelSourceLocation } from "@babel/types";
import BabelPluginReactCompiler, {
  CompilerErrorDetailOptions,
  CompilerSuggestionOperation,
  ErrorSeverity,
  parsePluginOptions,
  validateEnvironmentConfig,
  type PluginOptions,
} from "babel-plugin-react-compiler/src";
import { Logger } from "babel-plugin-react-compiler/src/Entrypoint";
import type { Rule } from "eslint";
import * as HermesParser from "hermes-parser";

type CompilerErrorDetailWithLoc = Omit<CompilerErrorDetailOptions, "loc"> & {
  loc: BabelSourceLocation;
};

function assertExhaustive(_: never, errorMsg: string): never {
  throw new Error(errorMsg);
}

const DEFAULT_REPORTABLE_LEVELS = new Set([
  ErrorSeverity.InvalidReact,
  ErrorSeverity.InvalidJS,
]);
let reportableLevels = DEFAULT_REPORTABLE_LEVELS;

function isReportableDiagnostic(
  detail: CompilerErrorDetailOptions
): detail is CompilerErrorDetailWithLoc {
  return (
    reportableLevels.has(detail.severity) &&
    detail.loc != null &&
    typeof detail.loc !== "symbol"
  );
}

function makeSuggestions(
  detail: CompilerErrorDetailOptions
): Array<Rule.SuggestionReportDescriptor> {
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
              return fixer.replaceTextRange(suggestion.range, suggestion.text);
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
          assertExhaustive(suggestion, "Unhandled suggestion operation");
      }
    }
  }
  return suggest;
}

const COMPILER_OPTIONS: Partial<PluginOptions> = {
  noEmit: true,
  compilationMode: "infer",
  panicThreshold: "none",
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
    const userLogger: Logger | null = options.logger;
    options.logger = {
      logEvent: (filename, event): void => {
        userLogger?.logEvent(filename, event);
        if (event.kind === "CompileError") {
          const detail = event.detail;
          if (!isReportableDiagnostic(detail)) {
            return;
          }
          if (hasFlowSuppression(detail.loc, "react-rule-hook")) {
            // If Flow already caught this error, we don't need to report it again.
            return;
          }
          const loc =
            detail.loc == null || typeof detail.loc == "symbol"
              ? event.fnLoc
              : detail.loc;
          if (loc != null) {
            context.report({
              message: detail.reason,
              loc,
              suggest: makeSuggestions(detail),
            });
          }
        }
      },
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
    ): boolean {
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
      } catch {
        /* empty */
      }
    } else {
      try {
        babelAST = HermesParser.parse(sourceCode, {
          babel: true,
          enableExperimentalComponentSyntax: true,
          sourceFilename: filename,
          sourceType: "module",
        });
      } catch {
        /* empty */
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
            [BabelPluginReactCompiler, options],
          ],
          sourceType: "module",
          configFile: false,
          babelrc: false,
        });
      } catch (err) {
        /* errors handled by injected logger */
      }
    }
    return {};
  },
};

export default rule;
