/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  ErrorCategory,
  getRuleForCategory,
} from 'babel-plugin-react-compiler/src/CompilerError';
import {
  normalizeIndent,
  testRule,
  makeTestCaseError,
  TestRecommendedRules,
} from './shared-utils';
import {allRules} from '../src/rules/ReactCompilerRule';

testRule('plugin-recommended', TestRecommendedRules, {
  valid: [
    {
      name: 'Basic example with component syntax',
      code: normalizeIndent`
        export default component HelloWorld(
          text: string = 'Hello!',
          onClick: () => void,
        ) {
          return <div onClick={onClick}>{text}</div>;
        }
      `,
    },

    {
      // OK because invariants are only meant for the compiler team's consumption
      name: '[Invariant] Defined after use',
      code: normalizeIndent`
            function Component(props) {
              let y = function () {
                m(x);
              };
    
              let x = { a };
              m(x);
              return y;
            }
          `,
    },
    {
      name: "Classes don't throw",
      code: normalizeIndent`
            class Foo {
              #bar() {}
            }
          `,
    },
  ],
  invalid: [
    {
      // TODO: actually return multiple diagnostics in this case
      name: 'Multiple diagnostic kinds from the same function are surfaced',
      code: normalizeIndent`
        import Child from './Child';
        function Component() {
          const result = cond ?? useConditionalHook();
          return <>
            {Child(result)}
          </>;
        }
      `,
      errors: [
        makeTestCaseError('Hooks must always be called in a consistent order'),
      ],
    },
    {
      name: 'Multiple diagnostics within the same file are surfaced',
      code: normalizeIndent`
        function useConditional1() {
          'use memo';
          return cond ?? useConditionalHook();
        }
        function useConditional2(props) {
          'use memo';
          return props.cond && useConditionalHook();
        }`,
      errors: [
        makeTestCaseError('Hooks must always be called in a consistent order'),
        makeTestCaseError('Hooks must always be called in a consistent order'),
      ],
    },
    {
      name: "'use no forget' does not disable eslint rule",
      code: normalizeIndent`
        let count = 0;
        function Component() {
          'use no forget';
          return cond ?? useConditionalHook();

        }
      `,
      errors: [
        makeTestCaseError('Hooks must always be called in a consistent order'),
      ],
    },
    {
      name: 'Multiple non-fatal useMemo diagnostics are surfaced',
      code: normalizeIndent`
      import {useMemo, useState} from 'react';
      
      function Component({item, cond}) {
        const [prevItem, setPrevItem] = useState(item);
        const [state, setState] = useState(0);
        
        useMemo(() => {
          if (cond) {
            setPrevItem(item);
            setState(0);
          }
        }, [cond, item, init]);
            
        return <Child x={state} />;
        }`,
      errors: [makeTestCaseError('Unused useMemo()')],
    },
    {
      name: 'Pipeline errors are reported',
      code: normalizeIndent`
            import useMyEffect from 'useMyEffect';
            import {AUTODEPS} from 'react';
            function Component({a}) {
              'use no memo';
              useMyEffect(() => console.log(a.b), AUTODEPS);
              return <div>Hello world</div>;
            }
          `,
      options: [
        {
          environment: {
            inferEffectDependencies: [
              {
                function: {
                  source: 'useMyEffect',
                  importSpecifierName: 'default',
                },
                autodepsIndex: 1,
              },
            ],
          },
        },
      ],
      errors: [
        {
          message: /Cannot infer dependencies of this effect/,
        },
      ],
    },
  ],
});
