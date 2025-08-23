/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {SourceLocation as BabelSourceLocation} from '@babel/types';
import {
  CompilerDiagnosticOptions,
  CompilerErrorDetailOptions,
  CompilerSuggestionOperation,
} from 'babel-plugin-react-compiler/src';
import type {Rule} from 'eslint';
import runReactCompiler, {RunCacheEntry} from '../shared/RunReactCompiler';
import {
  LintRules,
  type LintRule,
} from 'babel-plugin-react-compiler/src/CompilerError';

function assertExhaustive(_: never, errorMsg: string): never {
  throw new Error(errorMsg);
}

function makeSuggestions(
  detail: CompilerErrorDetailOptions | CompilerDiagnosticOptions,
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

function getReactCompilerResult(context: Rule.RuleContext): RunCacheEntry {
  // Compat with older versions of eslint
  const sourceCode = context.sourceCode ?? context.getSourceCode();
  const filename = context.filename ?? context.getFilename();
  const userOpts = context.options[0] ?? {};

  const results = runReactCompiler({
    sourceCode,
    filename,
    userOpts,
  });

  return results;
}

function hasFlowSuppression(
  program: RunCacheEntry,
  nodeLoc: BabelSourceLocation,
  suppressions: Array<string>,
): boolean {
  for (const commentNode of program.flowSuppressions) {
    if (
      suppressions.includes(commentNode.code) &&
      commentNode.line === nodeLoc.start.line - 1
    ) {
      return true;
    }
  }
  return false;
}

function makeRule(rule: LintRule): Rule.RuleModule {
  const create = (context: Rule.RuleContext): Rule.RuleListener => {
    const result = getReactCompilerResult(context);

    for (const event of result.events) {
      if (event.kind === 'CompileError') {
        const detail = event.detail;
        if (detail.category === rule.category) {
          const loc = detail.primaryLocation();
          if (loc == null || typeof loc === 'symbol') {
            continue;
          }
          if (
            hasFlowSuppression(result, loc, [
              'react-rule-hook',
              'react-rule-unsafe-ref',
            ])
          ) {
            // If Flow already caught this error, we don't need to report it again.
            continue;
          }
          /*
           * TODO: if multiple rules report the same linter category,
           * we should deduplicate them with a "reported" set
           */
          context.report({
            message: detail.printErrorMessage(result.sourceCode, {
              eslint: true,
            }),
            loc,
            suggest: makeSuggestions(detail.options),
          });
        }
      }
    }
    return {};
  };

  return {
    meta: {
      type: 'problem',
      docs: {
        description: rule.description,
        recommended: rule.recommended,
      },
      fixable: 'code',
      hasSuggestions: true,
      // validation is done at runtime with zod
      schema: [{type: 'object', additionalProperties: true}],
    },
    create,
  };
}

export const NoUnusedDirectivesRule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      recommended: true,
    },
    fixable: 'code',
    hasSuggestions: true,
    // validation is done at runtime with zod
    schema: [{type: 'object', additionalProperties: true}],
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    const results = getReactCompilerResult(context);

    for (const directive of results.unusedOptOutDirectives) {
      context.report({
        message: `Unused '${directive.directive}' directive`,
        loc: directive.loc,
        suggest: [
          {
            desc: 'Remove the directive',
            fix(fixer): Rule.Fix {
              return fixer.removeRange(directive.range);
            },
          },
        ],
      });
    }
    return {};
  },
};

type RulesObject = {[name: string]: Rule.RuleModule};

export const allRules: RulesObject = LintRules.reduce(
  (acc, rule) => {
    acc[rule.name] = makeRule(rule);
    return acc;
  },
  {
    'no-unused-directives': NoUnusedDirectivesRule,
  } as RulesObject,
);

export const recommendedRules: RulesObject = LintRules.filter(
  rule => rule.recommended,
).reduce(
  (acc, rule) => {
    acc[rule.name] = makeRule(rule);
    return acc;
  },
  {
    'no-unused-directives': NoUnusedDirectivesRule,
  } as RulesObject,
);
