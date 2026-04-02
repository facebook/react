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
import {normalizeIndent, testRule, makeTestCaseError} from './shared-utils';
import {allRules} from '../src/rules/ReactCompilerRule';

testRule(
  'no ref access in render rule',
  allRules[getRuleForCategory(ErrorCategory.Refs).name].rule,
  {
    valid: [
      {
        name: 'allow ref access in callback functions (IntersectionObserver case)',
        code: normalizeIndent`
      function useIntersectionObserver(options) {
        const callbacks = useRef(new Map());
        const onIntersect = useCallback((entries) => {
          entries.forEach(entry => callbacks.current.get(entry.target.id)?.(entry.isIntersecting));
        }, []);
        const observer = useMemo(() => new IntersectionObserver(onIntersect, options), [onIntersect, options]);
        return observer;
      }
    `,
      },
      {
        name: 'allow ref access in user exact code example',
        code: normalizeIndent`
      function useIntersectionObserver(options) {
        const callbacks = useRef(new Map());
        const onIntersect = useCallback((entries) => {
          entries.forEach(entry =>
            callbacks.current.get(entry.target.id)?.(entry.isIntersecting)
          );
        }, []);
        const observer = useMemo(() =>
          new IntersectionObserver(onIntersect, options),
          [onIntersect, options]
        );
      }
    `,
      },
    ],
    invalid: [
      {
        name: 'validate against simple ref access in render',
        code: normalizeIndent`
      function Component(props) {
        const ref = useRef(null);
        const value = ref.current;
        return value;
      }
    `,
        errors: [makeTestCaseError('Cannot access refs during render')],
      },
    ],
  },
);
