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
import {LinterCategory} from 'babel-plugin-react-compiler/src/CompilerError';

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

function makeRule(filter: Array<LinterCategory>): Rule.RuleModule['create'] {
  return (context: Rule.RuleContext): Rule.RuleListener => {
    const result = getReactCompilerResult(context);

    for (const event of result.events) {
      if (event.kind === 'CompileError') {
        const detail = event.detail;
        if (
          detail.linterCategory != null &&
          filter.includes(detail.linterCategory)
        ) {
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
          // TODO: if multiple rules report the same linter category,
          // we should deduplicate them with a "reported" set
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
}

const unactionableBailouts: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Surfaces unactionable compilation bailouts',
      recommended: true,
    },
    fixable: 'code',
    hasSuggestions: true,
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    return {};
  },
};

export const RulesOfHooksRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Surfaces compilation errors related to the rules of hooks',
      recommended: true,
    },
    fixable: 'code',
    hasSuggestions: true,
    // validation is done at runtime with zod
    schema: [{type: 'object', additionalProperties: true}],
  },
  create: makeRule([LinterCategory.RULES_OF_HOOKS]),
};

export const NoCapitalizedCallsRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Surfaces compilation errors related to capitalized calls',
      recommended: true,
    },
    fixable: 'code',
    hasSuggestions: true,
    // validation is done at runtime with zod
    schema: [{type: 'object', additionalProperties: true}],
  },
  create: makeRule([LinterCategory.CAPITALIZED_CALLS]),
};

export const StaticComponentsRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'todo',
      recommended: true,
    },
    fixable: 'code',
    hasSuggestions: true,
    // validation is done at runtime with zod
    schema: [{type: 'object', additionalProperties: true}],
  },
  create: makeRule([LinterCategory.STATIC_COMPONENTS]),
};

export const InvalidWritesRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      recommended: true,
    },
    fixable: 'code',
    hasSuggestions: true,
    // validation is done at runtime with zod
    schema: [{type: 'object', additionalProperties: true}],
  },
  create: makeRule([LinterCategory.INVALID_WRITE]),
};
export const UseMemoRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Surfaces compilation errors related to invalid useMemo usage',
      recommended: true,
    },
    fixable: 'code',
    hasSuggestions: true,
    // validation is done at runtime with zod
    schema: [{type: 'object', additionalProperties: true}],
  },
  create: makeRule([LinterCategory.VALIDATE_MANUAL_MEMO]),
};

// TODO: test cases
export const NoDynamicManualMemoRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      recommended: true,
    },
    fixable: 'code',
    hasSuggestions: true,
    // validation is done at runtime with zod
    schema: [{type: 'object', additionalProperties: true}],
  },
  create: makeRule([LinterCategory.DYNAMIC_MANUAL_MEMO]),
};

export const UnsafeRefsRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Surfaces compilation errors related to unsafe refs',
      recommended: true,
    },
    fixable: 'code',
    hasSuggestions: true,
    // validation is done at runtime with zod
    schema: [{type: 'object', additionalProperties: true}],
  },
  create: makeRule([LinterCategory.EXHAUSTIVE_DEPS]),
};

export const ValidateSetStateInRenderRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      recommended: true,
    },
    fixable: 'code',
    hasSuggestions: true,
    // validation is done at runtime with zod
    schema: [{type: 'object', additionalProperties: true}],
  },
  create: makeRule([LinterCategory.NO_SET_STATE_IN_RENDER]),
};

export const NoSetStateInEffectsRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Surfaces compilation errors related to setState in render',
      recommended: true,
    },
    fixable: 'code',
    hasSuggestions: true,
    // validation is done at runtime with zod
    schema: [{type: 'object', additionalProperties: true}],
  },
  create: makeRule([LinterCategory.NO_SET_STATE_IN_EFFECTS]),
};

export const NoRefAccessInRenderRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    // validation is done at runtime with zod
    schema: [{type: 'object', additionalProperties: true}],
  },
  create: makeRule([LinterCategory.NO_REF_ACCESS_IN_RENDER]),
};

export const NoImpureFunctionCallsRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    // validation is done at runtime with zod
    schema: [{type: 'object', additionalProperties: true}],
  },
  create: makeRule([LinterCategory.IMPURE_FUNCTIONS]),
};

export const UnnecessaryEffectsRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    // validation is done at runtime with zod
    schema: [{type: 'object', additionalProperties: true}],
  },
  create: makeRule([LinterCategory.UNNECESSARY_EFFECTS]),
};

export const NoAmbiguousJsxRule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Warns on JSX usage that is ambiguous.',
      recommended: true,
    },
    fixable: 'code',
    hasSuggestions: true,
    // validation is done at runtime with zod
    schema: [{type: 'object', additionalProperties: true}],
  },
  create: makeRule([LinterCategory.JSX_IN_TRY]),
};

// TODO: test cases
export const NoUnsupportedSyntaxRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Warns on JavaScript syntax that the compiler does not and will not support.',
      recommended: true,
    },
    fixable: 'code',
    hasSuggestions: true,
    // validation is done at runtime with zod
    schema: [{type: 'object', additionalProperties: true}],
  },
  create: makeRule([LinterCategory.UNSUPPORTED_SYNTAX]),
};

// TODO: test cases
export const WarnOnTodoSyntaxRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Warns on JavaScript syntax that the compiler currently does not support, but may in the future.',
      recommended: true,
    },
    fixable: 'code',
    hasSuggestions: true,
    // validation is done at runtime with zod
    schema: [{type: 'object', additionalProperties: true}],
  },
  create: makeRule([LinterCategory.TODO_SYNTAX]),
};

// TODO: test cases
export const ValidateCompilerConfigRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Validates the React Compiler configuration',
      recommended: true,
    },
    fixable: 'code',
    hasSuggestions: true,
    // validation is done at runtime with zod
    schema: [{type: 'object', additionalProperties: true}],
  },
  create: makeRule([LinterCategory.COMPILER_CONFIG]),
};

export const WarnOnUnactionableFailuresRule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Warns on compilation failures that are not actionable',
      recommended: true,
    },
    fixable: 'code',
    hasSuggestions: true,
    // validation is done at runtime with zod
    schema: [{type: 'object', additionalProperties: true}],
  },
  create(context: Rule.RuleContext): Rule.RuleListener {
    const results = getReactCompilerResult(context);

    for (const event of results.events) {
      if (event.kind === 'CompileError') {
        const detail = event.detail;
        if (detail.linterCategory == null) {
          const loc = detail.primaryLocation();
          if (loc == null || typeof loc === 'symbol') {
            continue;
          }
          context.report({
            message: detail.printErrorMessage(results.sourceCode, {
              eslint: true,
            }),
            loc,
            suggest: makeSuggestions(detail.options),
          });
        }
      }
    }
    return {};
  },
};

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
