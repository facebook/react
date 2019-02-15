/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const ESLintTester = require('eslint').RuleTester;
const ReactHooksESLintPlugin = require('eslint-plugin-react-hooks');
const ReactHooksESLintRule = ReactHooksESLintPlugin.rules['reactive-deps'];

ESLintTester.setDefaultConfig({
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
});

// ***************************************************
// For easier local testing, you can add to any case:
// {
//   skip: true,
//   --or--
//   only: true,
//   ...
// }
// ***************************************************

const tests = {
  valid: [
    {
      code: `
      function MyComponent() {
        const local = 42;
        useEffect(() => {
          console.log(local);
        });
      }
    `,
    },
    {
      code: `
      function MyComponent() {
        useEffect(() => {
          const local = 42;
          console.log(local);
        }, []);
      }
    `,
    },
    {
      code: `
      function MyComponent() {
        const local = 42;
        useEffect(() => {
          console.log(local);
        }, [local]);
      }
    `,
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
          });
        }
      }
    `,
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
          }, [local1, local2]);
        }
      }
    `,
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
          }, [local2]);
        }
      }
    `,
    },
    {
      code: `
      function MyComponent() {
        const local = 42;
        useEffect(() => {
          console.log(local);
          console.log(local);
        }, [local]);
      }
    `,
    },
    {
      code: `
      function MyComponent() {
        useEffect(() => {
          console.log(unresolved);
        }, []);
      }
    `,
    },
    {
      code: `
      function MyComponent() {
        const local = 42;
        useEffect(() => {
          console.log(local);
        }, [,,,local,,,]);
      }
    `,
    },
    {
      code: `
      // Regression test
      function MyComponent({ foo }) {
        useEffect(() => {
          console.log(foo.length);
        }, [foo]);
      }
    `,
    },
    {
      code: `
      // Regression test
      function MyComponent({ foo }) {
        useEffect(() => {
          console.log(foo.length);
          console.log(foo.slice(0));
        }, [foo]);
      }
    `,
    },
    {
      code: `
      // Regression test
      function MyComponent({ history }) {
        useEffect(() => {
          return history.listen();
        }, [history]);
      }
    `,
    },
    {
      // TODO: we might want to forbid dot-access in deps.
      code: `
      function MyComponent(props) {
        useEffect(() => {
          console.log(props.foo);
        }, [props.foo]);
      }
    `,
    },
    {
      // TODO: we might want to forbid dot-access in deps.
      code: `
      function MyComponent(props) {
        useEffect(() => {
          console.log(props.foo);
          console.log(props.bar);
        }, [props.foo, props.bar]);
      }
    `,
    },
    {
      // TODO: we might want to forbid dot-access in deps.
      code: `
      function MyComponent(props) {
        const local = 42;
        useEffect(() => {
          console.log(props.foo);
          console.log(props.bar);
          console.log(local);
        }, [props.foo, props.bar, local]);
      }
    `,
    },
    {
      // TODO: we might want to warn "props.foo"
      // is extraneous because we already have "props".
      code: `
        function MyComponent(props) {
          const local = 42;
          useEffect(() => {
            console.log(props.foo);
            console.log(props.bar);
          }, [props, props.foo]);
        }
      `,
    },
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
      // TODO: we might want to forbid dot-access in deps.
      code: `
        function MyComponent(props) {
          useCustomEffect(() => {
            console.log(props.foo);
          }, [props.foo]);
        }
      `,
      options: [{additionalHooks: 'useCustomEffect'}],
    },
    {
      code: `
      // Valid because we don't care about hooks outside of components.
      const local = 42;
      useEffect(() => {
        console.log(local);
      }, []);
    `,
    },
    {
      code: `
      // Valid because we don't care about hooks outside of components.
      const local1 = 42;
      {
        const local2 = 42;
        useEffect(() => {
          console.log(local1);
          console.log(local2);
        }, []);
      }
    `,
    },
    {
      code: `
      function MyComponent() {
        const ref = useRef();
        useEffect(() => {
          console.log(ref.current);
        }, [ref]);
      }
    `,
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
      output: `
        function MyComponent() {
          const local = 42;
          useEffect(() => {
            console.log(local);
          }, [local]);
        }
      `,
      errors: [
        'React Hook useEffect has missing [local] dependencies. ' +
          'Either fix or remove the dependency array.',
      ],
    },
    {
      code: `
        // Regression test
        function MyComponent() {
          const local = 42;
          useEffect(() => {
            if (true) {
              console.log(local);
            }
          }, []);
        }
      `,
      output: `
        // Regression test
        function MyComponent() {
          const local = 42;
          useEffect(() => {
            if (true) {
              console.log(local);
            }
          }, [local]);
        }
      `,
      errors: [
        'React Hook useEffect has missing [local] dependencies. ' +
          'Either fix or remove the dependency array.',
      ],
    },
    {
      code: `
        // Regression test
        function MyComponent() {
          const local = 42;
          useEffect(() => {
            try {
              console.log(local);
            } finally {}
          }, []);
        }
      `,
      output: `
        // Regression test
        function MyComponent() {
          const local = 42;
          useEffect(() => {
            try {
              console.log(local);
            } finally {}
          }, [local]);
        }
      `,
      errors: [
        'React Hook useEffect has missing [local] dependencies. ' +
          'Either fix or remove the dependency array.',
      ],
    },
    {
      code: `
        // Regression test
        function MyComponent() {
          const local = 42;
          useEffect(() => {
            function inner() {
              console.log(local);
            }
            inner();
          }, []);
        }
      `,
      output: `
        // Regression test
        function MyComponent() {
          const local = 42;
          useEffect(() => {
            function inner() {
              console.log(local);
            }
            inner();
          }, [local]);
        }
      `,
      errors: [
        'React Hook useEffect has missing [local] dependencies. ' +
          'Either fix or remove the dependency array.',
      ],
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
      output: `
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
      errors: [
        'React Hook useEffect has missing [local1, local2] dependencies. ' +
          'Either fix or remove the dependency array.',
      ],
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
      output: `
        function MyComponent() {
          const local1 = 42;
          const local2 = 42;
          useEffect(() => {
            console.log(local1);
            console.log(local2);
          }, [local1, local2]);
        }
      `,
      errors: [
        'React Hook useEffect has missing [local2] dependencies. ' +
          'Either fix or remove the dependency array.',
      ],
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
      output: `
        function MyComponent() {
          const local1 = 42;
          const local2 = 42;
          useEffect(() => {
            console.log(local1);
          }, [local1]);
        }
      `,
      errors: [
        'React Hook useEffect has unnecessary [local2] dependencies. ' +
          'Either fix or remove the dependency array.',
      ],
    },
    {
      // TODO: this case is weird.
      // Maybe it should not consider local1 unused despite component nesting?
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
      output: `
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
      errors: [
        'React Hook useEffect has missing [local2], unnecessary [local1] dependencies. ' +
          'Either fix or remove the dependency array.',
      ],
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
      output: `
        function MyComponent() {
          const local = 42;
          useEffect(() => {
            console.log(local);
            console.log(local);
          }, [local]);
        }
      `,
      errors: [
        'React Hook useEffect has missing [local] dependencies. ' +
          'Either fix or remove the dependency array.',
      ],
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
      output: `
        function MyComponent() {
          const local = 42;
          useEffect(() => {
            console.log(local);
            console.log(local);
          }, [local]);
        }
      `,
      errors: [
        'React Hook useEffect has duplicate [local] dependencies. ' +
          'Either fix or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent() {
          useEffect(() => {}, [local]);
        }
      `,
      output: `
        function MyComponent() {
          useEffect(() => {}, []);
        }
      `,
      errors: [
        'React Hook useEffect has unnecessary [local] dependencies. ' +
          'Either fix or remove the dependency array.',
      ],
    },
    {
      code: `
      function MyComponent({ history }) {
        useEffect(() => {
          return history.listen();
        }, []);
      }
      `,
      output: `
      function MyComponent({ history }) {
        useEffect(() => {
          return history.listen();
        }, [history]);
      }
      `,
      errors: [
        'React Hook useEffect has missing [history] dependencies. ' +
          'Either fix or remove the dependency array.',
      ],
    },
    {
      code: `
      function MyComponent({ history }) {
        useEffect(() => {
          return [
            history.foo.bar[2].dobedo.listen(),
            history.foo.bar().dobedo.listen[2]
          ];
        }, []);
      }
      `,
      output: `
      function MyComponent({ history }) {
        useEffect(() => {
          return [
            history.foo.bar[2].dobedo.listen(),
            history.foo.bar().dobedo.listen[2]
          ];
        }, [history.foo]);
      }
      `,
      errors: [
        'React Hook useEffect has missing [history.foo] dependencies. ' +
          'Either fix or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const dependencies = [];
          useEffect(() => {}, dependencies);
        }
      `,
      output: `
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
      // TODO: should this autofix or bail out?
      output: `
        function MyComponent() {
          const local = 42;
          const dependencies = [local];
          useEffect(() => {
            console.log(local);
          }, [local]);
        }
      `,
      errors: [
        'React Hook useEffect has a second argument which is not an array ' +
          "literal. This means we can't statically verify whether you've " +
          'passed the correct dependencies.',
        'React Hook useEffect has missing [local] dependencies. ' +
          'Either fix or remove the dependency array.',
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
      // TODO: should this autofix or bail out?
      output: `
        function MyComponent() {
          const local = 42;
          const dependencies = [local];
          useEffect(() => {
            console.log(local);
          }, [local]);
        }
      `,
      errors: [
        'React Hook useEffect has missing [local] dependencies. ' +
          'Either fix or remove the dependency array.',
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
      output: `
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
      // TODO: I'm not sure this is a good idea.
      // Maybe bail out?
      output: `
        function MyComponent() {
          const local = 42;
          useEffect(() => {
            console.log(local);
          }, [local]);
        }
      `,
      errors: [
        'React Hook useEffect has missing [local] dependencies. ' +
          'Either fix or remove the dependency array.',
        "Unsupported expression in React Hook useEffect's dependency list. " +
          'Currently only simple variables are supported.',
      ],
    },
    {
      // TODO: need to think more about this case.
      code: `
        function MyComponent() {
          const local = {id: 42};
          useEffect(() => {
            console.log(local);
          }, [local.id]);
        }
      `,
      // TODO: this may not be a good idea.
      output: `
        function MyComponent() {
          const local = {id: 42};
          useEffect(() => {
            console.log(local);
          }, [local]);
        }
      `,
      errors: [
        'React Hook useEffect has missing [local], unnecessary [local.id] dependencies. ' +
          'Either fix or remove the dependency array.',
      ],
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
      output: `
        function MyComponent() {
          const local = 42;
          useEffect(() => {
            console.log(local);
          }, [local]);
        }
      `,
      errors: [
        'React Hook useEffect has duplicate [local] dependencies. ' +
          'Either fix or remove the dependency array.',
      ],
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
      output: `
        function MyComponent() {
          const local1 = 42;
          useEffect(() => {
            const local1 = 42;
            console.log(local1);
          }, []);
        }
      `,
      errors: [
        'React Hook useEffect has unnecessary [local1] dependencies. ' +
          'Either fix or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const local1 = 42;
          useEffect(() => {}, [local1]);
        }
      `,
      output: `
        function MyComponent() {
          const local1 = 42;
          useEffect(() => {}, []);
        }
      `,
      errors: [
        'React Hook useEffect has unnecessary [local1] dependencies. ' +
          'Either fix or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent(props) {
          useEffect(() => {
            console.log(props.foo);
          }, []);
        }
      `,
      // TODO: we need to think about ideal output here.
      // Should it capture by default?
      output: `
        function MyComponent(props) {
          useEffect(() => {
            console.log(props.foo);
          }, [props.foo]);
        }
      `,
      errors: [
        'React Hook useEffect has missing [props.foo] dependencies. ' +
          'Either fix or remove the dependency array.',
      ],
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
      // TODO: we need to think about ideal output here.
      // Should it capture by default?
      output: `
        function MyComponent(props) {
          useEffect(() => {
            console.log(props.foo);
            console.log(props.bar);
          }, [props.foo, props.bar]);
        }
      `,
      errors: [
        'React Hook useEffect has missing [props.foo, props.bar] dependencies. ' +
          'Either fix or remove the dependency array.',
      ],
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
      // TODO: we need to think about ideal output here.
      // Should it capture by default?
      output: `
        function MyComponent(props) {
          const local = 42;
          useEffect(() => {
            console.log(props.foo);
            console.log(props.bar);
            console.log(local);
          }, [props.foo, props.bar, local]);
        }
      `,
      errors: [
        'React Hook useEffect has missing [props.foo, props.bar, local] dependencies. ' +
          'Either fix or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent(props) {
          const local = 42;
          useEffect(() => {
            console.log(props.foo);
            console.log(props.bar);
            console.log(local);
          }, [props]);
        }
      `,
      output: `
        function MyComponent(props) {
          const local = 42;
          useEffect(() => {
            console.log(props.foo);
            console.log(props.bar);
            console.log(local);
          }, [props, local]);
        }
      `,
      errors: [
        'React Hook useEffect has missing [local] dependencies. ' +
          'Either fix or remove the dependency array.',
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
      output: `
        function MyComponent(props) {
          useEffect(() => {
            console.log(props.foo);
          }, [props.foo]);
          useCallback(() => {
            console.log(props.foo);
          }, [props.foo]);
          useMemo(() => {
            console.log(props.foo);
          }, [props.foo]);
          React.useEffect(() => {
            console.log(props.foo);
          }, [props.foo]);
          React.useCallback(() => {
            console.log(props.foo);
          }, [props.foo]);
          React.useMemo(() => {
            console.log(props.foo);
          }, [props.foo]);
          React.notReactiveHook(() => {
            console.log(props.foo);
          }, []);
        }
      `,
      errors: [
        'React Hook useEffect has missing [props.foo] dependencies. ' +
          'Either fix or remove the dependency array.',
        'React Hook useCallback has missing [props.foo] dependencies. ' +
          'Either fix or remove the dependency array.',
        'React Hook useMemo has missing [props.foo] dependencies. ' +
          'Either fix or remove the dependency array.',
        'React Hook React.useEffect has missing [props.foo] dependencies. ' +
          'Either fix or remove the dependency array.',
        'React Hook React.useCallback has missing [props.foo] dependencies. ' +
          'Either fix or remove the dependency array.',
        'React Hook React.useMemo has missing [props.foo] dependencies. ' +
          'Either fix or remove the dependency array.',
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
      output: `
        function MyComponent(props) {
          useCustomEffect(() => {
            console.log(props.foo);
          }, [props.foo]);
          useEffect(() => {
            console.log(props.foo);
          }, [props.foo]);
          React.useEffect(() => {
            console.log(props.foo);
          }, [props.foo]);
          React.useCustomEffect(() => {
            console.log(props.foo);
          }, []);
        }
      `,
      options: [{additionalHooks: 'useCustomEffect'}],
      errors: [
        'React Hook useCustomEffect has missing [props.foo] dependencies. ' +
          'Either fix or remove the dependency array.',
        'React Hook useEffect has missing [props.foo] dependencies. ' +
          'Either fix or remove the dependency array.',
        'React Hook React.useEffect has missing [props.foo] dependencies. ' +
          'Either fix or remove the dependency array.',
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
      // TODO: should we bail out instead?
      output: `
        function MyComponent() {
          const local = 42;
          useEffect(() => {
            console.log(local);
          }, [local]);
        }
      `,
      errors: [
        'React Hook useEffect has missing [local] dependencies. ' +
          'Either fix or remove the dependency array.',
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
      // TODO: should we bail out instead?
      output: `
        function MyComponent() {
          const local = 42;
          useEffect(() => {
            console.log(local);
          }, [local]);
        }
      `,
      errors: [
        'React Hook useEffect has missing [local] dependencies. ' +
          'Either fix or remove the dependency array.',
        "Unsupported expression in React Hook useEffect's dependency list. " +
          'Currently only simple variables are supported.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const ref = useRef();
          useEffect(() => {
            console.log(ref.current);
          }, []);
        }
      `,
      output: `
        function MyComponent() {
          const ref = useRef();
          useEffect(() => {
            console.log(ref.current);
          }, [ref]);
        }
      `,
      // TODO: better message for the ref case.
      errors: [
        'React Hook useEffect has missing [ref] dependencies. ' +
          'Either fix or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent(props) {
          const ref1 = useRef();
          const ref2 = useRef();
          useEffect(() => {
            ref1.current.focus();
            console.log(ref2.current.textContent);
            alert(props.someOtherRefs.current.innerHTML);
            fetch(props.color);
          }, []);
        }
      `,
      output: `
        function MyComponent(props) {
          const ref1 = useRef();
          const ref2 = useRef();
          useEffect(() => {
            ref1.current.focus();
            console.log(ref2.current.textContent);
            alert(props.someOtherRefs.current.innerHTML);
            fetch(props.color);
          }, [ref1, ref2, props.someOtherRefs, props.color]);
        }
      `,
      // TODO: better message for the ref case.
      errors: [
        'React Hook useEffect has missing [ref1, ref2, props.someOtherRefs, props.color] dependencies. ' +
          'Either fix or remove the dependency array.',
      ],
    },
    {
      code: `
      function MyComponent() {
        const ref = useRef();
        useEffect(() => {
          console.log(ref.current);
        }, [ref.current]);
      }
    `,
      // TODO: better message for the ref case.
      errors: [
        'React Hook useEffect has missing [ref], unnecessary [ref.current] dependencies. ' +
          'Either fix or remove the dependency array.',
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
eslintTester.run('react-hooks', ReactHooksESLintRule, tests);
