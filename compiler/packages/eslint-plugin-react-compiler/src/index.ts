/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as rules from './rules/ReactCompilerRule';

const meta = {
  name: 'eslint-plugin-react-compiler',
};

/**
 * Validates React components and hooks follow rules of React
 * and follow best practices
 */
const validationRules = {
  'rules-of-hooks': rules.RulesOfHooksRule,
  'no-capitalized-calls': rules.NoCapitalizedCallsRule,
  'no-unstable-components': rules.StaticComponentsRule,
  'validate-use-memo-callbacks': rules.UseMemoRule,
  'validate-writes': rules.InvalidWritesRule,
  'no-unsafe-refs': rules.UnsafeRefsRule,
  'validate-set-state-in-render': rules.ValidateSetStateInRenderRule,
  'no-set-state-in-effects': rules.NoSetStateInEffectsRule,
  'no-ref-access-in-render': rules.NoRefAccessInRenderRule,
  'no-impure-function-calls': rules.NoImpureFunctionCallsRule,
  'unnecessary-effects': rules.UnnecessaryEffectsRule,
  'no-ambiguous-jsx': rules.NoAmbiguousJsxRule,
};

const recommendedRules = {
  ...validationRules,
  'no-unsupported-syntax': rules.NoUnsupportedSyntaxRule,

  /** Validation for React Compiler inline configuration */
  'no-unused-directives': rules.NoUnusedDirectivesRule,
  'validate-compiler-config': rules.ValidateCompilerConfigRule,
};

const allRules = {
  ...recommendedRules,
  /** Warn on syntax that React Compiler cannot transform */
  'no-todo-syntax': rules.WarnOnTodoSyntaxRule,
  'warn-on-compilation-failures': rules.WarnOnUnactionableFailuresRule,
};

const configs = {
  recommended: {
    plugins: {
      'react-compiler': {
        rules: recommendedRules,
      },
    },
    rules: Object.fromEntries(
      Object.keys(recommendedRules).map(ruleName => [
        'react-compiler/' + ruleName,
        'error',
      ]),
    ) as Record<string, 'error' | 'warn'>,
  },
};

export {configs, allRules as rules, meta};
