/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable no-for-of-loops/no-for-of-loops */

import type {SourceLocation as BabelSourceLocation} from '@babel/types';
import {
  type CompilerDiagnosticOptions,
  type CompilerErrorDetailOptions,
  CompilerSuggestionOperation,
  LintRules,
  type LintRule,
  ErrorSeverity,
  LintRulePreset,
} from 'babel-plugin-react-compiler';
import {type Linter, type Rule} from 'eslint';
import runReactCompiler, {RunCacheEntry} from './RunReactCompiler';

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

function hasFunctionSuppression(
  context: Rule.RuleContext,
  node: any,
): boolean {
  const sourceCode = context.sourceCode ?? context.getSourceCode();
  const allComments = sourceCode.getAllComments?.() || [];
  
  // Get function start line
  const functionStart = node.loc?.start.line;
  if (!functionStart) return false;

  for (const comment of allComments) {
    const commentLine = comment.loc?.end.line;
    if (!commentLine) continue;

    // Check for eslint-disable-next-line before function
    if (
      commentLine === functionStart - 1 &&
      comment.value.includes('eslint-disable-next-line') &&
      comment.value.includes('react-hooks')
    ) {
      return true;
    }

    // Check for eslint-disable block encompassing function
    if (
      commentLine <= functionStart &&
      comment.value.includes('eslint-disable') &&
      !comment.value.includes('eslint-disable-next-line') &&
      comment.value.includes('react-hooks')
    ) {
      // Check if there's a corresponding eslint-enable after function start
      const enableComment = allComments.find(
        c =>
          c.loc &&
          c.loc.start.line > commentLine &&
          c.value.includes('eslint-enable'),
      );
      if (!enableComment || (enableComment.loc && enableComment.loc.start.line > functionStart)) {
        return true;
      }
    }
  }
  return false;
}

function containsIncompatibleAPI(
  context: Rule.RuleContext,
  node: any,
): {found: boolean; loc?: any} {
  const sourceCode = context.sourceCode ?? context.getSourceCode();
  const text = sourceCode.getText(node);

  // Known incompatible APIs from React Compiler
  const incompatibleAPIs = [
    'useVirtualizer',
    // Add more as needed
  ];

  for (const api of incompatibleAPIs) {
    const regex = new RegExp(`\\b${api}\\s*\\(`, 'g');
    const match = regex.exec(text);
    if (match) {
      // Try to find approximate location
      const lines = text.substring(0, match.index).split('\n');
      const line = (node.loc?.start.line || 0) + lines.length - 1;
      return {
        found: true,
        loc: {
          start: {line, column: 0},
          end: {line, column: 80},
        },
      };
    }
  }
  return {found: false};
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
          // Check if this line has eslint-disable for react-hooks
          const sourceCode = context.sourceCode ?? context.getSourceCode();
          const lineNum = loc.start.line;
          let hasESLintDisable = false;

          const allComments = sourceCode.getAllComments?.() || [];
          for (const comment of allComments) {
            const commentLine = comment.loc?.end.line;
            if (!commentLine) continue;

            // Check for eslint-disable-next-line or eslint-disable
            if (
              (commentLine === lineNum - 1 &&
                comment.value.includes('eslint-disable-next-line') &&
                comment.value.includes('react-hooks')) ||
              (commentLine <= lineNum &&
                comment.value.includes('eslint-disable') &&
                !comment.value.includes('eslint-disable-next-line') &&
                comment.value.includes('react-hooks'))
            ) {
              hasESLintDisable = true;
              break;
            }
          }

          // For incompatible-library warnings with eslint-disable, show critical warning
          let message = detail.printErrorMessage(result.sourceCode, {
            eslint: true,
          });

          if (rule.category === 'IncompatibleLibrary' && hasESLintDisable) {
            message =
              '🚨 This hook will NOT be memoized\n\n' +
              'You\'re using an incompatible API AND have eslint-disable in this function.\n' +
              'React Compiler will skip memoization of this hook.\n\n' +
              '**Critical: Impact on parent components**\n' +
              'If this hook is used in a MEMOIZED component, it will break the component\'s\n' +
              'memoization by returning new object references every render.\n\n' +
              '**Required action:**\n' +
              'Add "use no memo" to COMPONENTS that use this hook:\n\n' +
              'function MyComponent() {\n' +
              '  "use no memo";  // ← Add this!\n' +
              '  const { data } = useThisHook({...});\n' +
              '  return <div>...</div>;\n' +
              '}\n\n' +
              '**Alternative solutions:**\n' +
              '1. Remove eslint-disable from this hook and fix dependency issues\n' +
              '2. Use this API directly in components (not in custom hooks)';
          }

          /*
           * TODO: if multiple rules report the same linter category,
           * we should deduplicate them with a "reported" set
           */
          context.report({
            message,
            loc,
            suggest: makeSuggestions(detail.options),
          });
        }
      }
    }

    // For incompatible-library rule, also check functions with suppressions
    // that React Compiler skipped analyzing
    if (rule.category === 'IncompatibleLibrary') {
      return {
        'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression'(
          node: any,
        ) {
          // Only check if function has suppression
          if (!hasFunctionSuppression(context, node)) {
            return;
          }

          // Check if function contains incompatible API
          const result = containsIncompatibleAPI(context, node);
          if (!result.found) {
            return;
          }

          // Report critical warning
          context.report({
            node,
            loc: result.loc || node.loc,
            message:
              '🚨 This hook will NOT be memoized\n\n' +
              'You\'re using an incompatible API AND have eslint-disable in this function.\n' +
              'React Compiler will skip memoization of this hook.\n\n' +
              '**Critical: Impact on parent components**\n' +
              'If this hook is used in a MEMOIZED component, it will break the component\'s\n' +
              'memoization by returning new object references every render.\n\n' +
              '**Required action:**\n' +
              'Add "use no memo" to COMPONENTS that use this hook:\n\n' +
              'function MyComponent() {\n' +
              '  "use no memo";  // ← Add this!\n' +
              '  const { data } = useThisHook({...});\n' +
              '  return <div>...</div>;\n' +
              '}\n\n' +
              '**Alternative solutions:**\n' +
              '1. Remove eslint-disable from this hook and fix dependency issues\n' +
              '2. Use this API directly in components (not in custom hooks)',
          });
        },
      };
    }

    return {};
  };

  return {
    meta: {
      type: 'problem',
      docs: {
        description: rule.description,
        recommended: rule.preset === LintRulePreset.Recommended,
      },
      fixable: 'code',
      hasSuggestions: true,
      // validation is done at runtime with zod
      schema: [{type: 'object', additionalProperties: true}],
    },
    create,
  };
}

type RulesConfig = {
  [name: string]: {rule: Rule.RuleModule; severity: ErrorSeverity};
};

export const allRules: RulesConfig = LintRules.reduce((acc, rule) => {
  acc[rule.name] = {rule: makeRule(rule), severity: rule.severity};
  return acc;
}, {} as RulesConfig);

export const recommendedRules: RulesConfig = LintRules.filter(
  rule => rule.preset === LintRulePreset.Recommended,
).reduce((acc, rule) => {
  acc[rule.name] = {rule: makeRule(rule), severity: rule.severity};
  return acc;
}, {} as RulesConfig);

export const recommendedLatestRules: RulesConfig = LintRules.filter(
  rule =>
    rule.preset === LintRulePreset.Recommended ||
    rule.preset === LintRulePreset.RecommendedLatest,
).reduce((acc, rule) => {
  acc[rule.name] = {rule: makeRule(rule), severity: rule.severity};
  return acc;
}, {} as RulesConfig);

export function mapErrorSeverityToESlint(
  severity: ErrorSeverity,
): Linter.StringSeverity {
  switch (severity) {
    case ErrorSeverity.Error: {
      return 'error';
    }
    case ErrorSeverity.Warning: {
      return 'warn';
    }
    case ErrorSeverity.Hint:
    case ErrorSeverity.Off: {
      return 'off';
    }
    default: {
      assertExhaustive(severity, `Unhandled severity: ${severity}`);
    }
  }
}
