/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const ESLintTester = require('eslint').RuleTester;
const ReactHooksESLintPlugin = require('eslint-plugin-react-hooks');
const PureRenderESLintRule = ReactHooksESLintPlugin.rules['pure-render'];

ESLintTester.setDefaultConfig({
  parser: require.resolve('babel-eslint'),
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
});

const writeError = {
  message:
    'Writing to refs during rendering is not allowed. Move this into a useEffect or useLayoutEffect. See https://beta.reactjs.org/apis/useref',
};
const readError = {
  message:
    'Reading from refs during rendering is not allowed. See https://beta.reactjs.org/apis/useref',
};

const tests = {
  valid: [
    {
      code: `
        function MyComponent() {
          let ref = useRef(false);
          useLayoutEffect(() => {
            ref.current = true;
          });
        }
      `,
    },
    {
      code: `
        let MyComponent = () => {
          let ref = useRef(false);
          useLayoutEffect(() => {
            ref.current = true;
          });
        };
      `,
    },
    {
      code: `
        let MyComponent = function () {
          let ref = useRef(false);
          useLayoutEffect(() => {
            ref.current = true;
          });
        };
      `,
    },
    {
      code: `
        function MyComponent() {
          let ref = useRef(false);
          let onChange = () => {
            ref.current = true;
          };
        }
      `,
    },
    {
      code: `
        function MyComponent() {
          let ref = useRef(null);
          if (ref.current == null) {
            ref.current = somethingExpensive();
          }
        }
      `,
    },
    {
      code: `
        function MyComponent() {
          let ref = useRef(false);
          if (ref.current === false) {
            ref.current = somethingExpensive();
          }
        }
      `,
    },
    {
      code: `
        function MyComponent() {
          let ref = useRef(undefined);
          if (ref.current === undefined) {
            ref.current = somethingExpensive();
          }
        }
      `,
    },
    {
      code: `
        function MyComponent() {
          let ref = useRef(undefined);
          if (ref.current == null) {
            ref.current = somethingExpensive();
          }
        }
      `,
    },
    {
      code: `
        function MyComponent() {
          let ref = useRef();
          if (ref.current == null) {
            ref.current = somethingExpensive();
          }
        }
      `,
    },
    {
      code: `
        function MyComponent() {
          let ref = useRef();
          if (ref.current == null) {
            ref.current = somethingExpensive();
          }
        }
      `,
    },
  ],
  invalid: [
    {
      code: `
        function MyComponent() {
          let ref = useRef(false);
          ref.current = true;
        }
      `,
      errors: [writeError],
    },
    {
      code: `
        function MyComponent() {
          let ref = useRef(false);
          return <h1>{ref.current}</h1>;
        }
      `,
      errors: [readError],
    },
    {
      code: `
        function MyComponent() {
          let ref = useRef(false);
          if (ref.current === 'test') {
            ref.current = somethingExpensive();
          }
        }
      `,
      errors: [readError, writeError],
    },
    {
      code: `
        function MyComponent() {
          let ref = useRef(null);
          if (ref.current === undefined) {
            ref.current = somethingExpensive();
          }
        }
      `,
      errors: [readError, writeError],
    },
    {
      code: `
        function MyComponent() {
          let ref = useRef(undefined);
          if (ref.current === null) {
            ref.current = somethingExpensive();
          }
        }
      `,
      errors: [readError, writeError],
    },
    {
      code: `
        function MyComponent() {
          let ref = useRef(null);
          let someOtherRef = useRef(null);
          if (someOtherRef.current === null) {
            ref.current = somethingExpensive();
          }
        }
      `,
      errors: [writeError],
    },
  ],
};

const eslintTester = new ESLintTester();
eslintTester.run('react-hooks', PureRenderESLintRule, tests);
