/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {normalizeIndent, TestRecommendedRules, testRule} from './shared-utils';

testRule('repro-35394', TestRecommendedRules, {
  valid: [],
  invalid: [
    {
      name: '#35394 repro - multiple violations with useState in nested component',
      code: normalizeIndent`
        import {useState, useEffect} from 'react';
        export default function App() {
          const [foo, setFoo] = useState(false);

          useEffect(() => {
            setFoo(!foo);
          }, []);

          const ViolateStaticComponents = () => {
            const [counter, setCounter] = useState(0);
            return <h1>Hello, World!</h1>;
          };

          return (
            <>
              <ViolateStaticComponents />
            </>
          );
        }
      `,
      errors: 3,
    },
    {
      name: 'Without nested useState - should show 2 errors',
      code: normalizeIndent`
        import {useState, useEffect} from 'react';
        export default function App() {
          const [foo, setFoo] = useState(false);

          useEffect(() => {
            setFoo(!foo);
          }, []);

          const ViolateStaticComponents = () => {
            return <h1>Hello, World!</h1>;
          };

          return (
            <>
              <ViolateStaticComponents />
            </>
          );
        }
      `,
      errors: 2,
    },
  ],
});
