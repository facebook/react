/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const ESLintTester = require('eslint').RuleTester;
const ReactHooksESLintPlugin = require('eslint-plugin-react-hooks');
const ReactHooksESLintRule = ReactHooksESLintPlugin.rules['exhaustive-deps'];

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
        const local = {};
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
          const local = {};
          console.log(local);
        }, []);
      }
    `,
    },
    {
      code: `
      function MyComponent() {
        const local = {};
        useEffect(() => {
          console.log(local);
        }, [local]);
      }
    `,
    },
    {
      // OK because `props` wasn't defined.
      // We don't technically know if `props` is supposed
      // to be an import that hasn't been added yet, or
      // a component-level variable. Ignore it until it
      //  gets defined (a different rule would flag it anyway).
      code: `
      function MyComponent() {
        useEffect(() => {
          console.log(props.foo);
        }, []);
      }
    `,
    },
    {
      code: `
      function MyComponent() {
        const local1 = {};
        {
          const local2 = {};
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
        const local1 = {};
        {
          const local2 = {};
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
        const local1 = {};
        function MyNestedComponent() {
          const local2 = {};
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
        const local = {};
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
        const local = {};
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
        }, [props.bar, props.foo]);
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
        const local = {};
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
          const local = {};
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
      const local = {};
      useEffect(() => {
        console.log(local);
      }, []);
    `,
    },
    {
      code: `
      // Valid because we don't care about hooks outside of components.
      const local1 = {};
      {
        const local2 = {};
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
    {
      code: `
      function MyComponent() {
        const ref = useRef();
        useEffect(() => {
          console.log(ref.current);
        }, []);
      }
    `,
    },
    {
      code: `
        function MyComponent({ maybeRef2 }) {
          const definitelyRef1 = useRef();
          const definitelyRef2 = useRef();
          const maybeRef1 = useSomeOtherRefyThing();
          const [state1, setState1] = useState();
          const [state2, setState2] = React.useState();
          const [state3, dispatch1] = useReducer();
          const [state4, dispatch2] = React.useReducer();
          const [state5, maybeSetState] = useFunnyState();
          const [state6, maybeDispatch] = useFunnyReducer();
          function mySetState() {}
          function myDispatch() {}

          useEffect(() => {
            // Known to be static
            console.log(definitelyRef1.current);
            console.log(definitelyRef2.current);
            console.log(maybeRef1.current);
            console.log(maybeRef2.current);
            setState1();
            setState2();
            dispatch1();
            dispatch2();

            // Dynamic
            console.log(state1);
            console.log(state2);
            console.log(state3);
            console.log(state4);
            console.log(state5);
            console.log(state6);
            mySetState();
            myDispatch();

            // Not sure; assume dynamic
            maybeSetState();
            maybeDispatch();
          }, [
            // Dynamic
            state1, state2, state3, state4, state5, state6,
            maybeRef1, maybeRef2,

            // Not sure; assume dynamic
            mySetState, myDispatch,
            maybeSetState, maybeDispatch

            // In this test, we don't specify static deps.
            // That should be okay.
          ]);
        }
      `,
    },
    {
      code: `
        function MyComponent({ maybeRef2 }) {
          const definitelyRef1 = useRef();
          const definitelyRef2 = useRef();
          const maybeRef1 = useSomeOtherRefyThing();

          const [state1, setState1] = useState();
          const [state2, setState2] = React.useState();
          const [state3, dispatch1] = useReducer();
          const [state4, dispatch2] = React.useReducer();

          const [state5, maybeSetState] = useFunnyState();
          const [state6, maybeDispatch] = useFunnyReducer();

          function mySetState() {}
          function myDispatch() {}

          useEffect(() => {
            // Known to be static
            console.log(definitelyRef1.current);
            console.log(definitelyRef2.current);
            console.log(maybeRef1.current);
            console.log(maybeRef2.current);
            setState1();
            setState2();
            dispatch1();
            dispatch2();

            // Dynamic
            console.log(state1);
            console.log(state2);
            console.log(state3);
            console.log(state4);
            console.log(state5);
            console.log(state6);
            mySetState();
            myDispatch();

            // Not sure; assume dynamic
            maybeSetState();
            maybeDispatch();
          }, [
            // Dynamic
            state1, state2, state3, state4, state5, state6,
            maybeRef1, maybeRef2,

            // Not sure; assume dynamic
            mySetState, myDispatch,
            maybeSetState, maybeDispatch,

            // In this test, we specify static deps.
            // That should be okay too!
            definitelyRef1, definitelyRef2, setState1, setState2, dispatch1, dispatch2
          ]);
        }
      `,
    },
    {
      code: `
        const MyComponent = forwardRef((props, ref) => {
          useImperativeHandle(ref, () => ({
            focus() {
              alert(props.hello);
            }
          }))
        });
      `,
    },
    {
      code: `
        const MyComponent = forwardRef((props, ref) => {
          useImperativeHandle(ref, () => ({
            focus() {
              alert(props.hello);
            }
          }), [props.hello])
        });
      `,
    },
    {
      // This is not ideal but warning would likely create
      // too many false positives. We do, however, prevent
      // direct assignments.
      code: `
        function MyComponent(props) {
          let obj = {};
          useEffect(() => {
            obj.foo = true;
          }, [obj]);
        }
      `,
    },
    {
      // Valid because we assign ref.current
      // ourselves. Therefore it's likely not
      // a ref managed by React.
      code: `
        function MyComponent() {
          const myRef = useRef();
          useEffect(() => {
            const handleMove = () => {};
            myRef.current = {};
            return () => {
              console.log(myRef.current.toString())
            };
          }, []);
          return <div />;
        }
      `,
    },
    {
      // Valid because we assign ref.current
      // ourselves. Therefore it's likely not
      // a ref managed by React.
      code: `
        function useMyThing(myRef) {
          useEffect(() => {
            const handleMove = () => {};
            myRef.current = {};
            return () => {
              console.log(myRef.current.toString())
            };
          }, [myRef]);
        }
      `,
    },
    {
      // Valid because the ref is captured.
      code: `
        function MyComponent() {
          const myRef = useRef();
          useEffect(() => {
            const handleMove = () => {};
            const node = myRef.current;
            node.addEventListener('mousemove', handleMove);
            return () => node.removeEventListener('mousemove', handleMove);
          }, []);
          return <div ref={myRef} />;
        }
      `,
    },
    {
      // Valid because the ref is captured.
      code: `
        function useMyThing(myRef) {
          const myRef = useRef();
          useEffect(() => {
            const handleMove = () => {};
            const node = myRef.current;
            node.addEventListener('mousemove', handleMove);
            return () => node.removeEventListener('mousemove', handleMove);
          }, [myRef]);
          return <div ref={myRef} />;
        }
      `,
    },
    {
      // Valid because it's not an effect.
      code: `
        function useMyThing(myRef) {
          useCallback(() => {
            const handleMouse = () => {};
            myRef.current.addEventListener('mousemove', handleMouse);
            myRef.current.addEventListener('mousein', handleMouse);
            return function() {
              setTimeout(() => {
                myRef.current.removeEventListener('mousemove', handleMouse);
                myRef.current.removeEventListener('mousein', handleMouse);
              });
            }
          }, [myRef]);
        }
      `,
    },
    {
      // Valid because we read ref.current in a function that isn't cleanup.
      code: `
        function useMyThing() {
          const myRef = useRef();
          useEffect(() => {
            const handleMove = () => {
              console.log(myRef.current)
            };
            window.addEventListener('mousemove', handleMove);
            return () => window.removeEventListener('mousemove', handleMove);
          }, []);
          return <div ref={myRef} />;
        }
      `,
    },
    {
      // Valid because we read ref.current in a function that isn't cleanup.
      code: `
        function useMyThing() {
          const myRef = useRef();
          useEffect(() => {
            const handleMove = () => {
              return () => window.removeEventListener('mousemove', handleMove);
            };
            window.addEventListener('mousemove', handleMove);
            return () => {};
          }, []);
          return <div ref={myRef} />;
        }
      `,
    },
    {
      // Valid because it's a primitive constant
      code: `
      function MyComponent() {
        const local1 = 42;
        const local2 = '42';
        const local3 = null;
        useEffect(() => {
          console.log(local1);
          console.log(local2);
          console.log(local3);
        }, []);
      }
    `,
    },
    {
      // It's not a mistake to specify constant values though.
      code: `
      function MyComponent() {
        const local1 = 42;
        const local2 = '42';
        const local3 = null;
        useEffect(() => {
          console.log(local1);
          console.log(local2);
          console.log(local3);
        }, [local1, local2, local3]);
      }
    `,
    },
  ],
  invalid: [
    {
      code: `
        function MyComponent() {
          const local = {};
          useEffect(() => {
            console.log(local);
          }, []);
        }
      `,
      output: `
        function MyComponent() {
          const local = {};
          useEffect(() => {
            console.log(local);
          }, [local]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'local'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      // Note: we *could* detect it's a primitive and never assigned
      // even though it's not a constant -- but we currently don't.
      // So this is an error.
      code: `
        function MyComponent() {
          let local = 42;
          useEffect(() => {
            console.log(local);
          }, []);
        }
      `,
      output: `
        function MyComponent() {
          let local = 42;
          useEffect(() => {
            console.log(local);
          }, [local]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'local'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      // Regexes are literals but potentially stateful.
      code: `
        function MyComponent() {
          const local = /foo/;
          useEffect(() => {
            console.log(local);
          }, []);
        }
      `,
      output: `
        function MyComponent() {
          const local = /foo/;
          useEffect(() => {
            console.log(local);
          }, [local]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'local'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      code: `
        // Regression test
        function MyComponent() {
          const local = {};
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
          const local = {};
          useEffect(() => {
            if (true) {
              console.log(local);
            }
          }, [local]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'local'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      code: `
        // Regression test
        function MyComponent() {
          const local = {};
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
          const local = {};
          useEffect(() => {
            try {
              console.log(local);
            } finally {}
          }, [local]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'local'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      code: `
        // Regression test
        function MyComponent() {
          const local = {};
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
          const local = {};
          useEffect(() => {
            function inner() {
              console.log(local);
            }
            inner();
          }, [local]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'local'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const local1 = {};
          {
            const local2 = {};
            useEffect(() => {
              console.log(local1);
              console.log(local2);
            }, []);
          }
        }
      `,
      output: `
        function MyComponent() {
          const local1 = {};
          {
            const local2 = {};
            useEffect(() => {
              console.log(local1);
              console.log(local2);
            }, [local1, local2]);
          }
        }
      `,
      errors: [
        "React Hook useEffect has missing dependencies: 'local1' and 'local2'. " +
          'Either include them or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const local1 = {};
          const local2 = {};
          useEffect(() => {
            console.log(local1);
            console.log(local2);
          }, [local1]);
        }
      `,
      output: `
        function MyComponent() {
          const local1 = {};
          const local2 = {};
          useEffect(() => {
            console.log(local1);
            console.log(local2);
          }, [local1, local2]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'local2'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const local1 = {};
          const local2 = {};
          useEffect(() => {
            console.log(local1);
          }, [local1, local2]);
        }
      `,
      output: `
        function MyComponent() {
          const local1 = {};
          const local2 = {};
          useEffect(() => {
            console.log(local1);
          }, [local1]);
        }
      `,
      errors: [
        "React Hook useEffect has an unnecessary dependency: 'local2'. " +
          'Either exclude it or remove the dependency array.',
      ],
    },
    {
      // TODO: this case is weird.
      // Maybe it should not consider local1 unused despite component nesting?
      code: `
        function MyComponent() {
          const local1 = {};
          function MyNestedComponent() {
            const local2 = {};
            useEffect(() => {
              console.log(local1);
              console.log(local2);
            }, [local1]);
          }
        }
      `,
      output: `
        function MyComponent() {
          const local1 = {};
          function MyNestedComponent() {
            const local2 = {};
            useEffect(() => {
              console.log(local1);
              console.log(local2);
            }, [local2]);
          }
        }
      `,
      errors: [
        // Focus on the more important part first (missing dep)
        "React Hook useEffect has a missing dependency: 'local2'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const local = {};
          useEffect(() => {
            console.log(local);
            console.log(local);
          }, []);
        }
      `,
      output: `
        function MyComponent() {
          const local = {};
          useEffect(() => {
            console.log(local);
            console.log(local);
          }, [local]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'local'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const local = {};
          useEffect(() => {
            console.log(local);
            console.log(local);
          }, [local, local]);
        }
      `,
      output: `
        function MyComponent() {
          const local = {};
          useEffect(() => {
            console.log(local);
            console.log(local);
          }, [local]);
        }
      `,
      errors: [
        "React Hook useEffect has a duplicate dependency: 'local'. " +
          'Either omit it or remove the dependency array.',
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
        "React Hook useEffect has an unnecessary dependency: 'local'. " +
          'Either exclude it or remove the dependency array.',
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
        "React Hook useEffect has a missing dependency: 'history'. " +
          'Either include it or remove the dependency array.',
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
        "React Hook useEffect has a missing dependency: 'history.foo'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent({ foo, bar, baz }) {
          useEffect(() => {
            console.log(foo, bar, baz);
          }, ['foo', 'bar']);
        }
      `,
      output: `
        function MyComponent({ foo, bar, baz }) {
          useEffect(() => {
            console.log(foo, bar, baz);
          }, [bar, baz, foo]);
        }
      `,
      errors: [
        "React Hook useEffect has missing dependencies: 'bar', 'baz', and 'foo'. " +
          'Either include them or remove the dependency array.',
        "The 'foo' string literal is not a valid dependency because it never changes. " +
          'Did you mean to include foo in the array instead?',
        "The 'bar' string literal is not a valid dependency because it never changes. " +
          'Did you mean to include bar in the array instead?',
      ],
    },
    {
      code: `
        function MyComponent({ foo, bar, baz }) {
          useEffect(() => {
            console.log(foo, bar, baz);
          }, [42, false, null]);
        }
      `,
      output: `
        function MyComponent({ foo, bar, baz }) {
          useEffect(() => {
            console.log(foo, bar, baz);
          }, [bar, baz, foo]);
        }
      `,
      errors: [
        "React Hook useEffect has missing dependencies: 'bar', 'baz', and 'foo'. " +
          'Either include them or remove the dependency array.',
        "The '42' literal is not a valid dependency because it never changes. You can safely remove it.",
        "The 'false' literal is not a valid dependency because it never changes. You can safely remove it.",
        "The 'null' literal is not a valid dependency because it never changes. You can safely remove it.",
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
          const local = {};
          const dependencies = [local];
          useEffect(() => {
            console.log(local);
          }, dependencies);
        }
      `,
      // TODO: should this autofix or bail out?
      output: `
        function MyComponent() {
          const local = {};
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
        "React Hook useEffect has a missing dependency: 'local'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const local = {};
          const dependencies = [local];
          useEffect(() => {
            console.log(local);
          }, [...dependencies]);
        }
      `,
      // TODO: should this autofix or bail out?
      output: `
        function MyComponent() {
          const local = {};
          const dependencies = [local];
          useEffect(() => {
            console.log(local);
          }, [local]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'local'. " +
          'Either include it or remove the dependency array.',
        'React Hook useEffect has a spread element in its dependency array. ' +
          "This means we can't statically verify whether you've passed the " +
          'correct dependencies.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const local = {};
          useEffect(() => {
            console.log(local);
          }, [local, ...dependencies]);
        }
      `,
      output: `
        function MyComponent() {
          const local = {};
          useEffect(() => {
            console.log(local);
          }, [local, ...dependencies]);
        }
      `,
      errors: [
        'React Hook useEffect has a spread element in its dependency array. ' +
          "This means we can't statically verify whether you've passed the " +
          'correct dependencies.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const local = {};
          useEffect(() => {
            console.log(local);
          }, [computeCacheKey(local)]);
        }
      `,
      // TODO: I'm not sure this is a good idea.
      // Maybe bail out?
      output: `
        function MyComponent() {
          const local = {};
          useEffect(() => {
            console.log(local);
          }, [local]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'local'. " +
          'Either include it or remove the dependency array.',
        'React Hook useEffect has a complex expression in the dependency array. ' +
          'Extract it to a separate variable so it can be statically checked.',
      ],
    },
    {
      code: `
        function MyComponent(props) {
          useEffect(() => {
            console.log(props.items[0]);
          }, [props.items[0]]);
        }
      `,
      output: `
        function MyComponent(props) {
          useEffect(() => {
            console.log(props.items[0]);
          }, [props.items]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'props.items'. " +
          'Either include it or remove the dependency array.',
        'React Hook useEffect has a complex expression in the dependency array. ' +
          'Extract it to a separate variable so it can be statically checked.',
      ],
    },
    {
      code: `
        function MyComponent(props) {
          useEffect(() => {
            console.log(props.items[0]);
          }, [props.items, props.items[0]]);
        }
      `,
      // TODO: ideally autofix would remove the bad expression?
      output: `
        function MyComponent(props) {
          useEffect(() => {
            console.log(props.items[0]);
          }, [props.items, props.items[0]]);
        }
      `,
      errors: [
        'React Hook useEffect has a complex expression in the dependency array. ' +
          'Extract it to a separate variable so it can be statically checked.',
      ],
    },
    {
      code: `
        function MyComponent({ items }) {
          useEffect(() => {
            console.log(items[0]);
          }, [items[0]]);
        }
      `,
      output: `
        function MyComponent({ items }) {
          useEffect(() => {
            console.log(items[0]);
          }, [items]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'items'. " +
          'Either include it or remove the dependency array.',
        'React Hook useEffect has a complex expression in the dependency array. ' +
          'Extract it to a separate variable so it can be statically checked.',
      ],
    },
    {
      code: `
        function MyComponent({ items }) {
          useEffect(() => {
            console.log(items[0]);
          }, [items, items[0]]);
        }
      `,
      // TODO: ideally autofix would remove the bad expression?
      output: `
        function MyComponent({ items }) {
          useEffect(() => {
            console.log(items[0]);
          }, [items, items[0]]);
        }
      `,
      errors: [
        'React Hook useEffect has a complex expression in the dependency array. ' +
          'Extract it to a separate variable so it can be statically checked.',
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
        "React Hook useEffect has a missing dependency: 'local'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const local = {};
          useEffect(() => {
            console.log(local);
          }, [local, local]);
        }
      `,
      output: `
        function MyComponent() {
          const local = {};
          useEffect(() => {
            console.log(local);
          }, [local]);
        }
      `,
      errors: [
        "React Hook useEffect has a duplicate dependency: 'local'. " +
          'Either omit it or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const local1 = {};
          useEffect(() => {
            const local1 = {};
            console.log(local1);
          }, [local1]);
        }
      `,
      output: `
        function MyComponent() {
          const local1 = {};
          useEffect(() => {
            const local1 = {};
            console.log(local1);
          }, []);
        }
      `,
      errors: [
        "React Hook useEffect has an unnecessary dependency: 'local1'. " +
          'Either exclude it or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const local1 = {};
          useEffect(() => {}, [local1]);
        }
      `,
      output: `
        function MyComponent() {
          const local1 = {};
          useEffect(() => {}, []);
        }
      `,
      errors: [
        "React Hook useEffect has an unnecessary dependency: 'local1'. " +
          'Either exclude it or remove the dependency array.',
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
        "React Hook useEffect has a missing dependency: 'props.foo'. " +
          'Either include it or remove the dependency array.',
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
          }, [props.bar, props.foo]);
        }
      `,
      errors: [
        "React Hook useEffect has missing dependencies: 'props.bar' and 'props.foo'. " +
          'Either include them or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent(props) {
          let a, b, c, d, e, f, g;
          useEffect(() => {
            console.log(b, e, d, c, a, g, f);
          }, [c, a, g]);
        }
      `,
      // Don't alphabetize if it wasn't alphabetized in the first place.
      output: `
        function MyComponent(props) {
          let a, b, c, d, e, f, g;
          useEffect(() => {
            console.log(b, e, d, c, a, g, f);
          }, [c, a, g, b, e, d, f]);
        }
      `,
      errors: [
        "React Hook useEffect has missing dependencies: 'b', 'd', 'e', and 'f'. " +
          'Either include them or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent(props) {
          let a, b, c, d, e, f, g;
          useEffect(() => {
            console.log(b, e, d, c, a, g, f);
          }, [a, c, g]);
        }
      `,
      // Alphabetize if it was alphabetized.
      output: `
        function MyComponent(props) {
          let a, b, c, d, e, f, g;
          useEffect(() => {
            console.log(b, e, d, c, a, g, f);
          }, [a, b, c, d, e, f, g]);
        }
      `,
      errors: [
        "React Hook useEffect has missing dependencies: 'b', 'd', 'e', and 'f'. " +
          'Either include them or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent(props) {
          let a, b, c, d, e, f, g;
          useEffect(() => {
            console.log(b, e, d, c, a, g, f);
          }, []);
        }
      `,
      // Alphabetize if it was empty.
      output: `
        function MyComponent(props) {
          let a, b, c, d, e, f, g;
          useEffect(() => {
            console.log(b, e, d, c, a, g, f);
          }, [a, b, c, d, e, f, g]);
        }
      `,
      errors: [
        "React Hook useEffect has missing dependencies: 'a', 'b', 'c', 'd', 'e', 'f', and 'g'. " +
          'Either include them or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent(props) {
          const local = {};
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
          const local = {};
          useEffect(() => {
            console.log(props.foo);
            console.log(props.bar);
            console.log(local);
          }, [local, props.bar, props.foo]);
        }
      `,
      errors: [
        "React Hook useEffect has missing dependencies: 'local', 'props.bar', and 'props.foo'. " +
          'Either include them or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent(props) {
          const local = {};
          useEffect(() => {
            console.log(props.foo);
            console.log(props.bar);
            console.log(local);
          }, [props]);
        }
      `,
      output: `
        function MyComponent(props) {
          const local = {};
          useEffect(() => {
            console.log(props.foo);
            console.log(props.bar);
            console.log(local);
          }, [local, props]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'local'. " +
          'Either include it or remove the dependency array.',
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
        "React Hook useEffect has a missing dependency: 'props.foo'. " +
          'Either include it or remove the dependency array.',
        "React Hook useCallback has a missing dependency: 'props.foo'. " +
          'Either include it or remove the dependency array.',
        "React Hook useMemo has a missing dependency: 'props.foo'. " +
          'Either include it or remove the dependency array.',
        "React Hook React.useEffect has a missing dependency: 'props.foo'. " +
          'Either include it or remove the dependency array.',
        "React Hook React.useCallback has a missing dependency: 'props.foo'. " +
          'Either include it or remove the dependency array.',
        "React Hook React.useMemo has a missing dependency: 'props.foo'. " +
          'Either include it or remove the dependency array.',
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
        "React Hook useCustomEffect has a missing dependency: 'props.foo'. " +
          'Either include it or remove the dependency array.',
        "React Hook useEffect has a missing dependency: 'props.foo'. " +
          'Either include it or remove the dependency array.',
        "React Hook React.useEffect has a missing dependency: 'props.foo'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const local = {};
          useEffect(() => {
            console.log(local);
          }, [a ? local : b]);
        }
      `,
      // TODO: should we bail out instead?
      output: `
        function MyComponent() {
          const local = {};
          useEffect(() => {
            console.log(local);
          }, [local]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'local'. " +
          'Either include it or remove the dependency array.',
        'React Hook useEffect has a complex expression in the dependency array. ' +
          'Extract it to a separate variable so it can be statically checked.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const local = {};
          useEffect(() => {
            console.log(local);
          }, [a && local]);
        }
      `,
      // TODO: should we bail out instead?
      output: `
        function MyComponent() {
          const local = {};
          useEffect(() => {
            console.log(local);
          }, [local]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'local'. " +
          'Either include it or remove the dependency array.',
        'React Hook useEffect has a complex expression in the dependency array. ' +
          'Extract it to a separate variable so it can be statically checked.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const ref = useRef();
          const [state, setState] = useState();
          useEffect(() => {
            ref.current = {};
            setState(state + 1);
          }, []);
        }
      `,
      output: `
        function MyComponent() {
          const ref = useRef();
          const [state, setState] = useState();
          useEffect(() => {
            ref.current = {};
            setState(state + 1);
          }, [state]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'state'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const ref = useRef();
          const [state, setState] = useState();
          useEffect(() => {
            ref.current = {};
            setState(state + 1);
          }, [ref]);
        }
      `,
      // We don't ask to remove static deps but don't add them either.
      // Don't suggest removing "ref" (it's fine either way)
      // but *do* add "state". *Don't* add "setState" ourselves.
      output: `
        function MyComponent() {
          const ref = useRef();
          const [state, setState] = useState();
          useEffect(() => {
            ref.current = {};
            setState(state + 1);
          }, [ref, state]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'state'. " +
          'Either include it or remove the dependency array.',
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
          }, [props.color, props.someOtherRefs]);
        }
      `,
      errors: [
        "React Hook useEffect has missing dependencies: 'props.color' and 'props.someOtherRefs'. " +
          'Either include them or remove the dependency array.',
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
          }, [ref1.current, ref2.current, props.someOtherRefs, props.color]);
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
          }, [props.someOtherRefs, props.color]);
        }
      `,
      errors: [
        "React Hook useEffect has unnecessary dependencies: 'ref1.current' and 'ref2.current'. " +
          'Either exclude them or remove the dependency array. ' +
          "Mutable values like 'ref1.current' aren't valid dependencies " +
          "because their mutation doesn't re-render the component.",
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
      output: `
        function MyComponent() {
          const ref = useRef();
          useEffect(() => {
            console.log(ref.current);
          }, []);
        }
      `,
      errors: [
        "React Hook useEffect has an unnecessary dependency: 'ref.current'. " +
          'Either exclude it or remove the dependency array. ' +
          "Mutable values like 'ref.current' aren't valid dependencies " +
          "because their mutation doesn't re-render the component.",
      ],
    },
    {
      code: `
        function MyComponent() {
          const ref = useRef();
          useEffect(() => {
            console.log(ref.current);
          }, [ref.current, ref]);
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
      errors: [
        "React Hook useEffect has an unnecessary dependency: 'ref.current'. " +
          'Either exclude it or remove the dependency array. ' +
          "Mutable values like 'ref.current' aren't valid dependencies " +
          "because their mutation doesn't re-render the component.",
      ],
    },
    {
      code: `
        const MyComponent = forwardRef((props, ref) => {
          useImperativeHandle(ref, () => ({
            focus() {
              alert(props.hello);
            }
          }), [])
        });
      `,
      output: `
        const MyComponent = forwardRef((props, ref) => {
          useImperativeHandle(ref, () => ({
            focus() {
              alert(props.hello);
            }
          }), [props.hello])
        });
      `,
      errors: [
        "React Hook useImperativeHandle has a missing dependency: 'props.hello'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent(props) {
          useEffect(() => {
            if (props.onChange) {
              props.onChange();
            }
          }, []);
        }
      `,
      // TODO: [props.onChange] is superfluous. Fix to just [props.onChange].
      output: `
        function MyComponent(props) {
          useEffect(() => {
            if (props.onChange) {
              props.onChange();
            }
          }, [props, props.onChange]);
        }
      `,
      errors: [
        // TODO: reporting props separately is superfluous. Fix to just props.onChange.
        "React Hook useEffect has missing dependencies: 'props' and 'props.onChange'. " +
          'Either include them or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent(props) {
          let value;
          let value2;
          let value3;
          let asyncValue;
          useEffect(() => {
            value = {};
            value2 = 100;
            value = 43;
            console.log(value2);
            console.log(value3);
            setTimeout(() => {
              asyncValue = 100;
            });
          }, []);
        }
      `,
      // This is a separate warning unrelated to others.
      // We could've made a separate rule for it but it's rare enough to name it.
      // No autofix suggestion because the intent isn't clear.
      output: `
        function MyComponent(props) {
          let value;
          let value2;
          let value3;
          let asyncValue;
          useEffect(() => {
            value = {};
            value2 = 100;
            value = 43;
            console.log(value2);
            console.log(value3);
            setTimeout(() => {
              asyncValue = 100;
            });
          }, []);
        }
      `,
      errors: [
        // value
        `Assignments to the 'value' variable from inside a React useEffect Hook ` +
          `will not persist between re-renders. ` +
          `If it's only needed by this Hook, move the variable inside it. ` +
          `Alternatively, declare a ref with the useRef Hook, ` +
          `and keep the mutable value in its 'current' property.`,
        // value2
        `Assignments to the 'value2' variable from inside a React useEffect Hook ` +
          `will not persist between re-renders. ` +
          `If it's only needed by this Hook, move the variable inside it. ` +
          `Alternatively, declare a ref with the useRef Hook, ` +
          `and keep the mutable value in its 'current' property.`,
        // asyncValue
        `Assignments to the 'asyncValue' variable from inside a React useEffect Hook ` +
          `will not persist between re-renders. ` +
          `If it's only needed by this Hook, move the variable inside it. ` +
          `Alternatively, declare a ref with the useRef Hook, ` +
          `and keep the mutable value in its 'current' property.`,
      ],
    },
    {
      code: `
        function MyComponent(props) {
          let value;
          let value2;
          let value3;
          let asyncValue;
          useEffect(() => {
            value = {};
            value2 = 100;
            value = 43;
            console.log(value2);
            console.log(value3);
            setTimeout(() => {
              asyncValue = 100;
            });
          }, [value, value2, value3]);
        }
      `,
      // This is a separate warning unrelated to others.
      // We could've made a separate rule for it but it's rare enough to name it.
      // No autofix suggestion because the intent isn't clear.
      output: `
        function MyComponent(props) {
          let value;
          let value2;
          let value3;
          let asyncValue;
          useEffect(() => {
            value = {};
            value2 = 100;
            value = 43;
            console.log(value2);
            console.log(value3);
            setTimeout(() => {
              asyncValue = 100;
            });
          }, [value, value2, value3]);
        }
      `,
      errors: [
        // value
        `Assignments to the 'value' variable from inside a React useEffect Hook ` +
          `will not persist between re-renders. ` +
          `If it's only needed by this Hook, move the variable inside it. ` +
          `Alternatively, declare a ref with the useRef Hook, ` +
          `and keep the mutable value in its 'current' property.`,
        // value2
        `Assignments to the 'value2' variable from inside a React useEffect Hook ` +
          `will not persist between re-renders. ` +
          `If it's only needed by this Hook, move the variable inside it. ` +
          `Alternatively, declare a ref with the useRef Hook, ` +
          `and keep the mutable value in its 'current' property.`,
        // asyncValue
        `Assignments to the 'asyncValue' variable from inside a React useEffect Hook ` +
          `will not persist between re-renders. ` +
          `If it's only needed by this Hook, move the variable inside it. ` +
          `Alternatively, declare a ref with the useRef Hook, ` +
          `and keep the mutable value in its 'current' property.`,
      ],
    },
    {
      code: `
        function MyComponent() {
          const myRef = useRef();
          useEffect(() => {
            const handleMove = () => {};
            myRef.current.addEventListener('mousemove', handleMove);
            return () => myRef.current.removeEventListener('mousemove', handleMove);
          }, []);
          return <div ref={myRef} />;
        }
      `,
      output: `
        function MyComponent() {
          const myRef = useRef();
          useEffect(() => {
            const handleMove = () => {};
            myRef.current.addEventListener('mousemove', handleMove);
            return () => myRef.current.removeEventListener('mousemove', handleMove);
          }, []);
          return <div ref={myRef} />;
        }
      `,
      errors: [
        `Accessing 'myRef.current' during the effect cleanup ` +
          `will likely read a different ref value because by this time React ` +
          `has already updated the ref. If this ref is managed by React, store ` +
          `'myRef.current' in a variable inside ` +
          `the effect itself and refer to that variable from the cleanup function.`,
      ],
    },
    {
      code: `
        function useMyThing(myRef) {
          useEffect(() => {
            const handleMove = () => {};
            myRef.current.addEventListener('mousemove', handleMove);
            return () => myRef.current.removeEventListener('mousemove', handleMove);
          }, [myRef]);
        }
      `,
      output: `
        function useMyThing(myRef) {
          useEffect(() => {
            const handleMove = () => {};
            myRef.current.addEventListener('mousemove', handleMove);
            return () => myRef.current.removeEventListener('mousemove', handleMove);
          }, [myRef]);
        }
      `,
      errors: [
        `Accessing 'myRef.current' during the effect cleanup ` +
          `will likely read a different ref value because by this time React ` +
          `has already updated the ref. If this ref is managed by React, store ` +
          `'myRef.current' in a variable inside ` +
          `the effect itself and refer to that variable from the cleanup function.`,
      ],
    },
    {
      code: `
        function useMyThing(myRef) {
          useEffect(() => {
            const handleMouse = () => {};
            myRef.current.addEventListener('mousemove', handleMouse);
            myRef.current.addEventListener('mousein', handleMouse);
            return function() {
              setTimeout(() => {
                myRef.current.removeEventListener('mousemove', handleMouse);
                myRef.current.removeEventListener('mousein', handleMouse);
              });
            }
          }, [myRef]);
        }
      `,
      output: `
        function useMyThing(myRef) {
          useEffect(() => {
            const handleMouse = () => {};
            myRef.current.addEventListener('mousemove', handleMouse);
            myRef.current.addEventListener('mousein', handleMouse);
            return function() {
              setTimeout(() => {
                myRef.current.removeEventListener('mousemove', handleMouse);
                myRef.current.removeEventListener('mousein', handleMouse);
              });
            }
          }, [myRef]);
        }
      `,
      errors: [
        `Accessing 'myRef.current' during the effect cleanup ` +
          `will likely read a different ref value because by this time React ` +
          `has already updated the ref. If this ref is managed by React, store ` +
          `'myRef.current' in a variable inside ` +
          `the effect itself and refer to that variable from the cleanup function.`,
      ],
    },
    {
      code: `
        function useMyThing(myRef, active) {
          useEffect(() => {
            const handleMove = () => {};
            if (active) {
              myRef.current.addEventListener('mousemove', handleMove);
              return function() {
                setTimeout(() => {
                  myRef.current.removeEventListener('mousemove', handleMove);
                });
              }
            }
          }, [myRef, active]);
        }
      `,
      output: `
        function useMyThing(myRef, active) {
          useEffect(() => {
            const handleMove = () => {};
            if (active) {
              myRef.current.addEventListener('mousemove', handleMove);
              return function() {
                setTimeout(() => {
                  myRef.current.removeEventListener('mousemove', handleMove);
                });
              }
            }
          }, [myRef, active]);
        }
      `,
      errors: [
        `Accessing 'myRef.current' during the effect cleanup ` +
          `will likely read a different ref value because by this time React ` +
          `has already updated the ref. If this ref is managed by React, store ` +
          `'myRef.current' in a variable inside ` +
          `the effect itself and refer to that variable from the cleanup function.`,
      ],
    },
    {
      // Autofix ignores constant primitives (leaving the ones that are there).
      code: `
      function MyComponent() {
        const local1 = 42;
        const local2 = '42';
        const local3 = null;
        const local4 = {};
        useEffect(() => {
          console.log(local1);
          console.log(local2);
          console.log(local3);
          console.log(local4);
        }, [local1, local3]);
      }
    `,
      output: `
      function MyComponent() {
        const local1 = 42;
        const local2 = '42';
        const local3 = null;
        const local4 = {};
        useEffect(() => {
          console.log(local1);
          console.log(local2);
          console.log(local3);
          console.log(local4);
        }, [local1, local3, local4]);
      }
    `,
      errors: [
        "React Hook useEffect has a missing dependency: 'local4'. " +
          'Either include it or remove the dependency array.',
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
