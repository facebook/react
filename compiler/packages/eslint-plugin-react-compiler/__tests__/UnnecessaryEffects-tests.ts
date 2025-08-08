/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {ErrorCode} from 'babel-plugin-react-compiler/src/CompilerError';
import {UnnecessaryEffectsRule} from '../src/rules/ReactCompilerRule';
import {normalizeIndent, testRule, makeTestCaseError} from './shared-utils';

testRule('unnecessary effects rule', UnnecessaryEffectsRule, {
  valid: [],
  invalid: [
    {
      name: 'test case from React docs',
      code: normalizeIndent`
      import {useEffect, useState} from 'react';
      // https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state
      function Form() {
        const [firstName, setFirstName] = useState('Taylor');
        const [lastName, setLastName] = useState('Swift');

        // 🔴 Avoid: redundant state and unnecessary Effect
        const [fullName, setFullName] = useState('');
        useEffect(() => {
          setFullName(capitalize(firstName + ' ' + lastName));
        }, [firstName, lastName]);

        return <Child fullName={fullName} cb={setFullName} />;
      }
    `,
      errors: [makeTestCaseError(ErrorCode.NO_DERIVED_COMPUTATIONS_IN_EFFECTS)],
    },
  ],
});
