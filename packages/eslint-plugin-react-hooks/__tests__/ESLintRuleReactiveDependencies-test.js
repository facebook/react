/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const ESLintTester = require('eslint').RuleTester;
const ReactHooksESLintPlugin = require('eslint-plugin-react-hooks');
const ReactHooksESLintRule =
  ReactHooksESLintPlugin.rules['reactive-dependencies'];

ESLintTester.setDefaultConfig({
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
});

const eslintTester = new ESLintTester();
eslintTester.run('react-hooks', ReactHooksESLintRule, {
  valid: [
    `
      const local = 42;
      useEffect(() => {
        console.log(local);
      }, []);
    `,
    `
      function MyComponent() {
        const local = 42;
        useEffect(() => {
          console.log(local);
        });
      }
    `,
    `
      function MyComponent() {
        useEffect(() => {
          const local = 42;
          console.log(local);
        }, []);
      }
    `,
    `
      function MyComponent() {
        const local = 42;
        useEffect(() => {
          console.log(local);
        }, [local]);
      }
    `,
    `
      const local1 = 42;
      {
        const local2 = 42;
        useEffect(() => {
          console.log(local1);
          console.log(local2);
        }, []);
      }
    `,
    `
      function MyComponent() {
        const local1 = 42;
        {
          const local2 = 42;
          useEffect(() => {
            console.log(local1);
            console.log(local2);
          });
        }
      }
    `,
    `
      function MyComponent() {
        const local1 = 42;
        {
          const local2 = 42;
          useEffect(() => {
            console.log(local1);
            console.log(local2);
          }, [local1, local2]);
        }
      }
    `,
    `
      function MyComponent() {
        const local1 = 42;
        function MyNestedComponent() {
          const local2 = 42;
          useEffect(() => {
            console.log(local1);
            console.log(local2);
          }, [local2]);
        }
      }
    `,
    `
      function MyComponent() {
        const local = 42;
        useEffect(() => {
          console.log(local);
          console.log(local);
        }, [local]);
      }
    `,
    `
      function MyComponent() {
        useEffect(() => {
          console.log(unresolved);
        }, []);
      }
    `,
    `
      function MyComponent() {
        const local = 42;
        useEffect(() => {
          console.log(local);
        }, [,,,local,,,]);
      }
    `,
    `
      function MyComponent(props) {
        useEffect(() => {
          console.log(props.foo);
        }, [props.foo]);
      }
    `,
    `
      function MyComponent(props) {
        useEffect(() => {
          console.log(props.foo);
          console.log(props.bar);
        }, [props.foo, props.bar]);
      }
    `,
    `
      function MyComponent(props) {
        const local = 42;
        useEffect(() => {
          console.log(props.foo);
          console.log(props.bar);
          console.log(local);
        }, [props.foo, props.bar, local]);
      }
    `,
    {
      code: `
        function MyComponent(props) {
          useCustomEffect(() => {
            console.log(props.foo);
          });
        }
      `,
      options: [{additionalHooks: 'useCustomEffect'}],
    },
    {
      code: `
        function MyComponent(props) {
          useCustomEffect(() => {
            console.log(props.foo);
          }, [props.foo]);
        }
      `,
      options: [{additionalHooks: 'useCustomEffect'}],
    },
  ],
  invalid: [
    {
      code: `
        function MyComponent() {
          const local = 42;
          useEffect(() => {
            console.log(local);
          }, []);
        }
      `,
      errors: [missingError('local')],
    },
    {
      code: `
        function MyComponent() {
          const local1 = 42;
          {
            const local2 = 42;
            useEffect(() => {
              console.log(local1);
              console.log(local2);
            }, []);
          }
        }
      `,
      errors: [missingError('local1'), missingError('local2')],
    },
    {
      code: `
        function MyComponent() {
          const local1 = 42;
          const local2 = 42;
          useEffect(() => {
            console.log(local1);
            console.log(local2);
          }, [local1]);
        }
      `,
      errors: [missingError('local2')],
    },
    {
      code: `
        function MyComponent() {
          const local1 = 42;
          const local2 = 42;
          useEffect(() => {
            console.log(local1);
          }, [local1, local2]);
        }
      `,
      errors: [extraError('local2')],
    },
    {
      code: `
        function MyComponent() {
          const local1 = 42;
          function MyNestedComponent() {
            const local2 = 42;
            useEffect(() => {
              console.log(local1);
              console.log(local2);
            }, [local1]);
          }
        }
      `,
      errors: [missingError('local2'), extraError('local1')],
    },
    {
      code: `
        function MyComponent() {
          const local = 42;
          useEffect(() => {
            console.log(local);
            console.log(local);
          }, []);
        }
      `,
      errors: [missingError('local'), missingError('local')],
    },
    {
      code: `
        function MyComponent() {
          const local = 42;
          useEffect(() => {
            console.log(local);
            console.log(local);
          }, [local, local]);
        }
      `,
      errors: [duplicateError('local')],
    },
    {
      code: `
        function MyComponent() {
          useEffect(() => {}, [local]);
        }
      `,
      errors: [extraError('local')],
    },
    {
      code: `
        function MyComponent() {
          const dependencies = [];
          useEffect(() => {}, dependencies);
        }
      `,
      errors: [
        'React Hook useEffect has a second argument which is not an array ' +
          "literal. This means we can't statically verify whether you've " +
          'passed the correct dependencies.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const local = 42;
          const dependencies = [local];
          useEffect(() => {
            console.log(local);
          }, dependencies);
        }
      `,
      errors: [
        missingError('local'),
        'React Hook useEffect has a second argument which is not an array ' +
          "literal. This means we can't statically verify whether you've " +
          'passed the correct dependencies.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const local = 42;
          const dependencies = [local];
          useEffect(() => {
            console.log(local);
          }, [...dependencies]);
        }
      `,
      errors: [
        missingError('local'),
        'React Hook useEffect has a spread element in its dependency list. ' +
          "This means we can't statically verify whether you've passed the " +
          'correct dependencies.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const local = 42;
          useEffect(() => {
            console.log(local);
          }, [local, ...dependencies]);
        }
      `,
      errors: [
        'React Hook useEffect has a spread element in its dependency list. ' +
          "This means we can't statically verify whether you've passed the " +
          'correct dependencies.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const local = 42;
          useEffect(() => {
            console.log(local);
          }, [computeCacheKey(local)]);
        }
      `,
      errors: [
        missingError('local'),
        "Unsupported expression in React Hook useEffect's dependency list. " +
          'Currently only simple variables are supported.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const local = {id: 42};
          useEffect(() => {
            console.log(local);
          }, [local.id]);
        }
      `,
      errors: [missingError('local'), extraError('local.id')],
    },
    {
      code: `
        function MyComponent() {
          const local = 42;
          useEffect(() => {
            console.log(local);
          }, [local, local]);
        }
      `,
      errors: [duplicateError('local')],
    },
    {
      code: `
        function MyComponent() {
          const local1 = 42;
          useEffect(() => {
            const local1 = 42;
            console.log(local1);
          }, [local1]);
        }
      `,
      errors: [extraError('local1')],
    },
    {
      code: `
        function MyComponent() {
          const local1 = 42;
          useEffect(() => {}, [local1]);
        }
      `,
      errors: [extraError('local1')],
    },
    {
      code: `
        function MyComponent(props) {
          useEffect(() => {
            console.log(props.foo);
          }, []);
        }
      `,
      errors: [missingError('props.foo')],
    },
    {
      code: `
        function MyComponent(props) {
          useEffect(() => {
            console.log(props.foo);
            console.log(props.bar);
          }, []);
        }
      `,
      errors: [missingError('props.foo'), missingError('props.bar')],
    },
    {
      code: `
        function MyComponent(props) {
          const local = 42;
          useEffect(() => {
            console.log(props.foo);
            console.log(props.bar);
            console.log(local);
          }, []);
        }
      `,
      errors: [
        missingError('props.foo'),
        missingError('props.bar'),
        missingError('local'),
      ],
    },
    {
      code: `
        function MyComponent(props) {
          useEffect(() => {
            console.log(props.foo);
          }, []);
          useCallback(() => {
            console.log(props.foo);
          }, []);
          useMemo(() => {
            console.log(props.foo);
          }, []);
          React.useEffect(() => {
            console.log(props.foo);
          }, []);
          React.useCallback(() => {
            console.log(props.foo);
          }, []);
          React.useMemo(() => {
            console.log(props.foo);
          }, []);
          React.notReactiveHook(() => {
            console.log(props.foo);
          }, []);
        }
      `,
      errors: [
        missingError('props.foo', 'useEffect'),
        missingError('props.foo', 'useCallback'),
        missingError('props.foo', 'useMemo'),
        missingError('props.foo', 'React.useEffect'),
        missingError('props.foo', 'React.useCallback'),
        missingError('props.foo', 'React.useMemo'),
      ],
    },
    {
      code: `
        function MyComponent(props) {
          useCustomEffect(() => {
            console.log(props.foo);
          }, []);
          useEffect(() => {
            console.log(props.foo);
          }, []);
          React.useEffect(() => {
            console.log(props.foo);
          }, []);
          React.useCustomEffect(() => {
            console.log(props.foo);
          }, []);
        }
      `,
      options: [{additionalHooks: 'useCustomEffect'}],
      errors: [
        missingError('props.foo', 'useCustomEffect'),
        missingError('props.foo', 'useEffect'),
        missingError('props.foo', 'React.useEffect'),
      ],
    },
    {
      code: `
        function MyComponent() {
          const local = 42;
          useEffect(() => {
            console.log(local);
          }, [a ? local : b]);
        }
      `,
      errors: [
        missingError('local'),
        "Unsupported expression in React Hook useEffect's dependency list. " +
          'Currently only simple variables are supported.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const local = 42;
          useEffect(() => {
            console.log(local);
          }, [a && local]);
        }
      `,
      errors: [
        missingError('local'),
        "Unsupported expression in React Hook useEffect's dependency list. " +
          'Currently only simple variables are supported.',
      ],
    },
  ],
});

function missingError(dependency, hook = 'useEffect') {
  return (
    `React Hook ${hook} references "${dependency}", but it was not listed in ` +
    `the hook dependencies argument. This means if "${dependency}" changes ` +
    `then ${hook} won't be able to update.`
  );
}

function extraError(dependency) {
  return (
    `React Hook useEffect has an extra dependency "${dependency}" which is ` +
    `not used in its callback. Removing this dependency may mean the hook ` +
    `needs to execute fewer times.`
  );
}

function duplicateError(dependency) {
  return `Duplicate value in React Hook useEffect's dependency list for "${dependency}".`;
}
