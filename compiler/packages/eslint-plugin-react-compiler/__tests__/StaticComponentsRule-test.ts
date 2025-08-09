/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {StaticComponentsRule} from '../src/rules/ReactCompilerRule';
import {
  normalizeIndent,
  invalidStaticComponentsRuleErrorMessage,
  testRule,
} from './shared-utils';

testRule('static-components', StaticComponentsRule, {
  valid: [],
  invalid: [
    {
      name: 'Simple violation',
      code: normalizeIndent`
        function Example(props) {
          const Component = new ComponentFactory();
          return <Component />;
        }
      `,
      errors: [invalidStaticComponentsRuleErrorMessage],
    },
    {
      name: 'Multiple diagnostics within the same function are surfaced',
      code: normalizeIndent`
        function Example(props) {
          const Component1 = new ComponentFactory();
          const Component2 = new ComponentFactory();
          return <>
            <Component1 />
            <Component2 />
          </>;
        }`,
      errors: [
        invalidStaticComponentsRuleErrorMessage,
        invalidStaticComponentsRuleErrorMessage,
      ],
    },
  ],
});
