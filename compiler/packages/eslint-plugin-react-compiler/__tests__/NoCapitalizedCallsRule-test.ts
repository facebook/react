/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {NoCapitalizedCallsRule} from '../src/rules/ReactCompilerRule';
import {
  normalizeIndent,
  invalidCapitalizedCallsRuleErrorMessage,
  testRule,
} from './shared-utils';

testRule('no-capitalized-calls', NoCapitalizedCallsRule, {
  valid: [],
  invalid: [
    {
      name: 'Simple violation',
      code: normalizeIndent`
        import Child from './Child';
        function Component() {
          return <>
            {Child()}
          </>;
        }
      `,
      errors: [invalidCapitalizedCallsRuleErrorMessage],
    },
    {
      name: 'Method call violation',
      code: normalizeIndent`
        import myModule from './MyModule';
        function Component() {
          return <>
            {myModule.Child()}
          </>;
        }
      `,
      errors: [invalidCapitalizedCallsRuleErrorMessage],
    },
    {
      name: 'Multiple diagnostics within the same function are surfaced',
      code: normalizeIndent`
        import Child1 from './Child1';
        import MyModule from './MyModule';
        function Component() {
          return <>
            {Child1()}
            {MyModule.Child2()}
          </>;
        }`,
      errors: [
        invalidCapitalizedCallsRuleErrorMessage,
        invalidCapitalizedCallsRuleErrorMessage,
      ],
    },
  ],
});
