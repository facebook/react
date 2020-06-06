/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const ESLintTester = require('eslint').RuleTester;
const ReactHooksESLintPlugin = require('eslint-plugin-react-hooks');
const ReactHooksESLintRule = ReactHooksESLintPlugin.rules['safe-ref-mutations'];

ESLintTester.setDefaultConfig({
  parser: require.resolve('babel-eslint'),
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
});

function normalizeIndent(strings) {
  const codeLines = strings[0].split('\n');
  const leftPadding = codeLines[1].match(/\s+/)[0];
  return codeLines.map(line => line.substr(leftPadding.length)).join('\n');
}

const errorMessage =
  'Ref mutations should either be in useEffect or useLayoutEffect calls or inside callbacks.';

const tests = {
  valid: [
    // Simple safe ref assignments
    normalizeIndent`
      function ComponentWithRef() {
        const someRef = useRef();

        useEffect(() => {
          someRef.current = 'some value';
        }, []);
      }
    `,
    normalizeIndent`
      function ComponentWithRef() {
        const someRef = useRef();

        useLayoutEffect(() => {
          someRef.current = 'some value';
        }, []);
      }
    `,
    normalizeIndent`
      function ComponentWithRef() {
        const someRef = useRef();

        React.useEffect(() => {
          someRef.current = 'some value';
        }, []);
      }
    `,
    normalizeIndent`
      function ComponentWithRef() {
        const someRef = useRef();

        React.useLayoutEffect(() => {
          someRef.current = 'some value';
        }, []);
      }
    `,
    normalizeIndent`
      const ComponentWithRef = () => {
        const someRef = useRef();

        useEffect(() => {
          someRef.current = 'some value';
        }, []);
      };
    `,
    normalizeIndent`
      const ComponentWithRef = () => {
        const someRef = useRef();

        useLayoutEffect(() => {
          someRef.current = 'some value';
        }, []);
      };
    `,
    normalizeIndent`
      const ComponentWithRef = () => {
        const someRef = useRef();

        React.useEffect(() => {
          someRef.current = 'some value';
        }, []);
      };
    `,
    normalizeIndent`
      const ComponentWithRef = () => {
        const someRef = useRef();

        React.useLayoutEffect(() => {
          someRef.current = 'some value';
        }, []);
      };
    `,
    normalizeIndent`
      const ComponentWithRef = React.memo(() => {
        const someRef = useRef();

        useEffect(() => {
          someRef.current = 'some value';
        }, []);
      });
    `,
    normalizeIndent`
      const ComponentWithRef = React.memo(() => {
        const someRef = useRef();

        useLayoutEffect(() => {
          someRef.current = 'some value';
        }, []);
      });
    `,
    normalizeIndent`
      const ComponentWithRef = React.memo(() => {
        const someRef = useRef();

        React.useEffect(() => {
          someRef.current = 'some value';
        }, []);
      });
    `,
    normalizeIndent`
      const ComponentWithRef = React.memo(() => {
        const someRef = useRef();

        React.useLayoutEffect(() => {
          someRef.current = 'some value';
        }, []);
      });
    `,
    normalizeIndent`
      const ComponentWithRef = React.forwardRef(() => {
        const someRef = useRef();

        useEffect(() => {
          someRef.current = 'some value';
        }, []);
      });
    `,
    normalizeIndent`
      const ComponentWithRef = React.forwardRef(() => {
        const someRef = useRef();

        useLayoutEffect(() => {
          someRef.current = 'some value';
        }, []);
      });
    `,
    normalizeIndent`
      const ComponentWithRef = React.forwardRef(() => {
        const someRef = useRef();

        React.useEffect(() => {
          someRef.current = 'some value';
        }, []);
      });
    `,
    normalizeIndent`
      const ComponentWithRef = React.forwardRef(() => {
        const someRef = useRef();

        React.useLayoutEffect(() => {
          someRef.current = 'some value';
        }, []);
      });
    `,
    // Scenarios where the ref mutation is in an effect, but not top-level
    normalizeIndent`
      function ComponentWithRef() {
        const someRef = useRef();

        useEffect(() => {
          const someFunction = () => {
            someRef.current = 'some value';
          }
        }, []);
      }
    `,
    normalizeIndent`
      function ComponentWithRef() {
        const someRef = useRef();

        useLayoutEffect(() => {
          const someFunction = () => {
            someRef.current = 'some value';
          }
        }, []);
      }
    `,
    normalizeIndent`
    function ComponentWithRef() {
      const someRef = useRef();

      useEffect(() => {
        const someFunction = () => {
          const yetAnotherFunction = () => {
            const andYetAnotherFunction = () => {
              const andOneMoreFunctionForGoodMeasure = () => {
                someRef.current = 'some value';
              }
            }
          }
        }
      }, []);
    }
  `,
    normalizeIndent`
      function ComponentWithRef() {
        const someRef = useRef();

        useLayoutEffect(() => {
          const someFunction = () => {
            const yetAnotherFunction = () => {
              const andYetAnotherFunction = () => {
                const andOneMoreFunctionForGoodMeasure = () => {
                  someRef.current = 'some value';
                }
              }
            }
          }
        }, []);
      }
    `,
    // When ref mutations occur in callbacks
    {
      code: normalizeIndent`
      const ComponentWithRef = () => {
        const someRef = useRef();

        const someCallback = () => {
          someRef.current = 'some value';
        };

        return <div onClick={someCallback}>some child</div>;
      };
    `,
    },
    // TODO: Scenarios where React is no in play at all
    normalizeIndent`
      myObject.current = 'some value';
    `,
  ],
  invalid: [
    {
      code: normalizeIndent`
        function ComponentWithRef() {
          const someRef = useRef();

          someRef.current = 'some value';
        }
      `,
      errors: [
        {
          message: errorMessage,
          suggestions: [
            {
              desc: 'Place the ref mutation in a useEffect',
              output: normalizeIndent`
                function ComponentWithRef() {
                  const someRef = useRef();

                  useEffect(() => { someRef.current = 'some value'; }, []);
                }
              `,
            },
            {
              desc: 'Place the ref mutation in a useLayoutEffect',
              output: normalizeIndent`
                function ComponentWithRef() {
                  const someRef = useRef();

                  useLayoutEffect(() => { someRef.current = 'some value'; }, []);
                }
              `,
            },
          ],
        },
      ],
    },
    {
      code: normalizeIndent`
        function ComponentWithRef() {
          const someRef = useRef();

          someRef.current = 'some value';
          someRef.current = 'some other value';
        }
      `,
      errors: [
        {
          message: errorMessage,
          suggestions: [
            {
              desc: 'Place the ref mutation in a useEffect',
              output: normalizeIndent`
                function ComponentWithRef() {
                  const someRef = useRef();

                  useEffect(() => { someRef.current = 'some value'; }, []);
                  someRef.current = 'some other value';
                }
              `,
            },
            {
              desc: 'Place the ref mutation in a useLayoutEffect',
              output: normalizeIndent`
                function ComponentWithRef() {
                  const someRef = useRef();

                  useLayoutEffect(() => { someRef.current = 'some value'; }, []);
                  someRef.current = 'some other value';
                }
              `,
            },
          ],
        },
        {
          message: errorMessage,
          suggestions: [
            {
              desc: 'Place the ref mutation in a useEffect',
              output: normalizeIndent`
                function ComponentWithRef() {
                  const someRef = useRef();

                  someRef.current = 'some value';
                  useEffect(() => { someRef.current = 'some other value'; }, []);
                }
              `,
            },
            {
              desc: 'Place the ref mutation in a useLayoutEffect',
              output: normalizeIndent`
                function ComponentWithRef() {
                  const someRef = useRef();

                  someRef.current = 'some value';
                  useLayoutEffect(() => { someRef.current = 'some other value'; }, []);
                }
              `,
            },
          ],
        },
      ],
    },
  ],
};

// For easier local testing
if (!process.env.CI) {
  let only = [];
  let skipped = [];
  [...tests.valid, ...tests.invalid].forEach(t => {
    if (t.skip) {
      delete t.skip;
      skipped.push(t);
    }
    if (t.only) {
      delete t.only;
      only.push(t);
    }
  });
  const predicate = t => {
    if (only.length > 0) {
      return only.indexOf(t) !== -1;
    }
    if (skipped.length > 0) {
      return skipped.indexOf(t) === -1;
    }
    return true;
  };
  tests.valid = tests.valid.filter(predicate);
  tests.invalid = tests.invalid.filter(predicate);
}

const eslintTester = new ESLintTester();
eslintTester.run('safe-ref-mutations', ReactHooksESLintRule, tests);
