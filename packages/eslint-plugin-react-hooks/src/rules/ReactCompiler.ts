/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable no-for-of-loops/no-for-of-loops */

import {transformFromAstSync} from '@babel/core';
// @ts-expect-error: no types available
import PluginProposalPrivateMethods from '@babel/plugin-transform-private-methods';
import type {SourceLocation as BabelSourceLocation} from '@babel/types';
import BabelPluginReactCompiler, {
  type CompilerErrorDetailOptions,
  CompilerSuggestionOperation,
  ErrorSeverity,
  parsePluginOptions,
  validateEnvironmentConfig,
  OPT_OUT_DIRECTIVES,
  type Logger,
  type LoggerEvent,
  type PluginOptions,
} from 'babel-plugin-react-compiler';
import type {Rule} from 'eslint';
import {Statement} from 'estree';
import * as HermesParser from 'hermes-parser';

type CompilerErrorDetailWithLoc = Omit<CompilerErrorDetailOptions, 'loc'> & {
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
  detail: CompilerErrorDetailOptions,
): detail is CompilerErrorDetailWithLoc {
  return (
    reportableLevels.has(detail.severity) &&
    detail.loc != null &&
    typeof detail.loc !== 'symbol'
  );
}

function makeSuggestions(
  detail: CompilerErrorDetailOptions,
): Array<Rule.SuggestionReportDescriptor> {
  const suggest: Array<Rule.SuggestionReportDescriptor> = [];
  if (Array.isArray(detail.suggestions)) {
    for (const suggestion of detail.suggestions) {
      switch (suggestion.op) {
        case CompilerSuggestionOperation.InsertBefore:
          suggest.push({
            desc: suggestion.description,
            fix(fixer) {
              return fixer.insertTextBeforeRange(
                suggestion.range,
                suggestion.text,
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
                suggestion.text,
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
          assertExhaustive(suggestion, 'Unhandled suggestion operation');
      }
    }
  }
  return suggest;
}

const COMPILER_OPTIONS: Partial<PluginOptions> = {
  noEmit: true,
  panicThreshold: 'none',
  // Don't emit errors on Flow suppressions--Flow already gave a signal
  flowSuppressions: false,
  environment: validateEnvironmentConfig({
    validateRefAccessDuringRender: false,
  }),
};

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Surfaces diagnostics from React Forget',
      recommended: true,
    },
    fixable: 'code',
    hasSuggestions: true,
    // validation is done at runtime with zod
    schema: [{type: 'object', additionalProperties: true}],
  },
  create(context: Rule.RuleContext) {
    // Compat with older versions of eslint
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const filename = context.filename ?? context.getFilename();
    const userOpts = context.options[0] ?? {};
    if (
      userOpts.reportableLevels != null &&
      userOpts.reportableLevels instanceof Set
    ) {
      reportableLevels = userOpts.reportableLevels;
    } else {
      reportableLevels = DEFAULT_REPORTABLE_LEVELS;
    }
    /**
     * Experimental setting to report all compilation bailouts on the compilation
     * unit (e.g. function or hook) instead of the offensive line.
     * Intended to be used when a codebase is 100% reliant on the compiler for
     * memoization (i.e. deleted all manual memo) and needs compilation success
     * signals for perf debugging.
     */
    let __unstable_donotuse_reportAllBailouts: boolean = false;
    if (
      userOpts.__unstable_donotuse_reportAllBailouts != null &&
      typeof userOpts.__unstable_donotuse_reportAllBailouts === 'boolean'
    ) {
      __unstable_donotuse_reportAllBailouts =
        userOpts.__unstable_donotuse_reportAllBailouts;
    }

    let shouldReportUnusedOptOutDirective = true;
    const options: PluginOptions = parsePluginOptions({
      ...COMPILER_OPTIONS,
      ...userOpts,
      environment: {
        ...COMPILER_OPTIONS.environment,
        ...userOpts.environment,
      },
    });
    const userLogger: Logger | null = options.logger;
    options.logger = {
      logEvent: (eventFilename, event): void => {
        userLogger?.logEvent(eventFilename, event);
        if (event.kind === 'CompileError') {
          shouldReportUnusedOptOutDirective = false;
          const detail = event.detail;
          const suggest = makeSuggestions(detail);
          if (__unstable_donotuse_reportAllBailouts && event.fnLoc != null) {
            const locStr =
              detail.loc != null && typeof detail.loc !== 'symbol'
                ? ` (@:${detail.loc.start.line}:${detail.loc.start.column})`
                : '';
            /**
             * Report bailouts with a smaller span (just the first line).
             * Compiler bailout lints only serve to flag that a react function
             * has not been optimized by the compiler for codebases which depend
             * on compiler memo heavily for perf. These lints are also often not
             * actionable.
             */
            let endLoc;
            if (event.fnLoc.end.line === event.fnLoc.start.line) {
              endLoc = event.fnLoc.end;
            } else {
              endLoc = {
                line: event.fnLoc.start.line,
                // Babel loc line numbers are 1-indexed
                column:
                  sourceCode.text.split(/\r?\n|\r|\n/g)[
                    event.fnLoc.start.line - 1
                  ]?.length ?? 0,
              };
            }
            const firstLineLoc = {
              start: event.fnLoc.start,
              end: endLoc,
            };
            context.report({
              message: `[ReactCompilerBailout] ${detail.reason}${locStr}`,
              loc: firstLineLoc,
              suggest,
            });
          }

          if (!isReportableDiagnostic(detail)) {
            return;
          }
          if (
            hasFlowSuppression(detail.loc, 'react-rule-hook') ||
            hasFlowSuppression(detail.loc, 'react-rule-unsafe-ref')
          ) {
            // If Flow already caught this error, we don't need to report it again.
            return;
          }
          const loc =
            detail.loc == null || typeof detail.loc === 'symbol'
              ? event.fnLoc
              : detail.loc;
          if (loc != null) {
            context.report({
              message: detail.reason,
              loc,
              suggest,
            });
          }
        }
      },
    };

    try {
      options.environment = validateEnvironmentConfig(
        options.environment ?? {},
      );
    } catch (err: unknown) {
      options.logger?.logEvent('', err as LoggerEvent);
    }

    function hasFlowSuppression(
      nodeLoc: BabelSourceLocation,
      suppression: string,
    ): boolean {
      const comments = sourceCode.getAllComments();
      const flowSuppressionRegex = new RegExp(
        '\\$FlowFixMe\\[' + suppression + '\\]',
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
    if (filename.endsWith('.tsx') || filename.endsWith('.ts')) {
      try {
        const {parse: babelParse} = require('@babel/parser');
        babelAST = babelParse(sourceCode.text, {
          filename,
          sourceType: 'unambiguous',
          plugins: ['typescript', 'jsx'],
        });
      } catch {
        /* empty */
      }
    } else {
      try {
        babelAST = HermesParser.parse(sourceCode.text, {
          babel: true,
          enableExperimentalComponentSyntax: true,
          sourceFilename: filename,
          sourceType: 'module',
        });
      } catch {
        /* empty */
      }
    }

    if (babelAST != null) {
      try {
        transformFromAstSync(babelAST, sourceCode.text, {
          filename,
          highlightCode: false,
          retainLines: true,
          plugins: [
            [PluginProposalPrivateMethods, {loose: true}],
            [BabelPluginReactCompiler, options],
          ],
          sourceType: 'module',
          configFile: false,
          babelrc: false,
        });
      } catch (err) {
        /* errors handled by injected logger */
      }
    }

    function reportUnusedOptOutDirective(stmt: Statement) {
      if (
        stmt.type === 'ExpressionStatement' &&
        stmt.expression.type === 'Literal' &&
        typeof stmt.expression.value === 'string' &&
        OPT_OUT_DIRECTIVES.has(stmt.expression.value) &&
        stmt.loc != null
      ) {
        context.report({
          message: `Unused '${stmt.expression.value}' directive`,
          loc: stmt.loc,
          suggest: [
            {
              desc: 'Remove the directive',
              fix(fixer) {
                return fixer.remove(stmt);
              },
            },
          ],
        });
      }
    }
    if (shouldReportUnusedOptOutDirective) {
      return {
        FunctionDeclaration(fnDecl) {
          for (const stmt of fnDecl.body.body) {
            reportUnusedOptOutDirective(stmt);
          }
        },
        ArrowFunctionExpression(fnExpr) {
          if (fnExpr.body.type === 'BlockStatement') {
            for (const stmt of fnExpr.body.body) {
              reportUnusedOptOutDirective(stmt);
            }
          }
        },
        FunctionExpression(fnExpr) {
          for (const stmt of fnExpr.body.body) {
            reportUnusedOptOutDirective(stmt);
          }
        },
      };
    } else {
      return {};
    }
  },
};

export default rule;
