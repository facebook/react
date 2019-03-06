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
            useCallback(() => {
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
            useCallback(() => {
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
      // Regression test
      code: `
        function MyComponent({ foo }) {
          useEffect(() => {
            console.log(foo.length);
          }, [foo]);
        }
      `,
    },
    {
      // Regression test
      code: `
        function MyComponent({ foo }) {
          useEffect(() => {
            console.log(foo.length);
            console.log(foo.slice(0));
          }, [foo]);
        }
      `,
    },
    {
      // Regression test
      code: `
        function MyComponent({ history }) {
          useEffect(() => {
            return history.listen();
          }, [history]);
        }
      `,
    },
    {
      code: `
        function MyComponent(props) {
          useEffect(() => {
            console.log(props.foo);
          }, [props.foo]);
        }
      `,
    },
    {
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
      // [props, props.foo] is technically unnecessary ('props' covers 'props.foo').
      // However, it's valid for effects to over-specify their deps.
      // So we don't warn about this. We *would* warn about useMemo/useCallback.
      code: `
        function MyComponent(props) {
          const local = {};
          useEffect(() => {
            console.log(props.foo);
            console.log(props.bar);
          }, [props, props.foo]);

          let color = {}
          useEffect(() => {
            console.log(props.foo.bar.baz);
            console.log(color);
          }, [props.foo, props.foo.bar.baz, color]);
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
      // Valid because we don't care about hooks outside of components.
      code: `
        const local = {};
        useEffect(() => {
          console.log(local);
        }, []);
      `,
    },
    {
      // Valid because we don't care about hooks outside of components.
      code: `
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
      // Valid because it's a primitive constant.
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
    {
      // It is valid for effects to over-specify their deps.
      code: `
        function MyComponent(props) {
          const local = props.local;
          useEffect(() => {}, [local]);
        }
      `,
    },
    {
      // Valid even though activeTab is "unused".
      // We allow over-specifying deps for effects, but not callbacks or memo.
      code: `
        function Foo({ activeTab }) {
          useEffect(() => {
            window.scrollTo(0, 0);
          }, [activeTab]);
        }
      `,
    },
    {
      // It is valid to specify broader effect deps than strictly necessary.
      // Don't warn for this.
      code: `
        function MyComponent(props) {
          useEffect(() => {
            console.log(props.foo.bar.baz);
          }, [props]);
          useEffect(() => {
            console.log(props.foo.bar.baz);
          }, [props.foo]);
          useEffect(() => {
            console.log(props.foo.bar.baz);
          }, [props.foo.bar]);
          useEffect(() => {
            console.log(props.foo.bar.baz);
          }, [props.foo.bar.baz]);
        }
      `,
    },
    {
      // It is *also* valid to specify broader memo/callback deps than strictly necessary.
      // Don't warn for this either.
      code: `
        function MyComponent(props) {
          const fn = useCallback(() => {
            console.log(props.foo.bar.baz);
          }, [props]);
          const fn2 = useCallback(() => {
            console.log(props.foo.bar.baz);
          }, [props.foo]);
          const fn3 = useMemo(() => {
            console.log(props.foo.bar.baz);
          }, [props.foo.bar]);
          const fn4 = useMemo(() => {
            console.log(props.foo.bar.baz);
          }, [props.foo.bar.baz]);
        }
      `,
    },
    {
      code: `
        function MyComponent(props) {
          function handleNext1() {
            console.log('hello');
          }
          const handleNext2 = () => {
            console.log('hello');
          };
          let handleNext3 = function() {
            console.log('hello');
          };
          useEffect(() => {
            return Store.subscribe(handleNext1);
          }, [handleNext1]);
          useLayoutEffect(() => {
            return Store.subscribe(handleNext2);
          }, [handleNext2]);
          useMemo(() => {
            return Store.subscribe(handleNext3);
          }, [handleNext3]);
        }
      `,
    },
    {
      // Declaring handleNext is optional because
      // it doesn't use anything in the function scope.
      code: `
        function MyComponent(props) {
          function handleNext1() {
            console.log('hello');
          }
          const handleNext2 = () => {
            console.log('hello');
          };
          let handleNext3 = function() {
            console.log('hello');
          };
          useEffect(() => {
            return Store.subscribe(handleNext1);
          }, []);
          useLayoutEffect(() => {
            return Store.subscribe(handleNext2);
          }, []);
          useMemo(() => {
            return Store.subscribe(handleNext3);
          }, []);
        }
      `,
    },
    {
      // Declaring handleNext is optional because
      // it doesn't use anything in the function scope.
      code: `
        function MyComponent(props) {
          function handleNext() {
            console.log('hello');
          }
          useEffect(() => {
            return Store.subscribe(handleNext);
          }, []);
          useLayoutEffect(() => {
            return Store.subscribe(handleNext);
          }, []);
          useMemo(() => {
            return Store.subscribe(handleNext);
          }, []);
        }
      `,
    },
    {
      // Declaring handleNext is optional because
      // everything they use is fully static.
      code: `
        function MyComponent(props) {
          let [, setState] = useState();
          let [, dispatch] = React.useReducer();

          function handleNext1(value) {
            let value2 = value * 100;
            setState(value2);
            console.log('hello');
          }
          const handleNext2 = (value) => {
            setState(foo(value));
            console.log('hello');
          };
          let handleNext3 = function(value) {
            console.log(value);
            dispatch({ type: 'x', value });
          };
          useEffect(() => {
            return Store.subscribe(handleNext1);
          }, []);
          useLayoutEffect(() => {
            return Store.subscribe(handleNext2);
          }, []);
          useMemo(() => {
            return Store.subscribe(handleNext3);
          }, []);
        }
      `,
    },
    {
      code: `
        function useInterval(callback, delay) {
          const savedCallback = useRef();
          useEffect(() => {
            savedCallback.current = callback;
          });
          useEffect(() => {
            function tick() {
              savedCallback.current();
            }
            if (delay !== null) {
              let id = setInterval(tick, delay);
              return () => clearInterval(id);
            }
          }, [delay]);
        }
      `,
    },
    {
      code: `
        function Counter() {
          const [count, setCount] = useState(0);

          useEffect(() => {
            let id = setInterval(() => {
              setCount(c => c + 1);
            }, 1000);
            return () => clearInterval(id);
          }, []);

          return <h1>{count}</h1>;
        }
      `,
    },
    {
      code: `
        function Counter() {
          const [count, setCount] = useState(0);

          function tick() {
            setCount(c => c + 1);
          }

          useEffect(() => {
            let id = setInterval(() => {
              tick();
            }, 1000);
            return () => clearInterval(id);
          }, []);

          return <h1>{count}</h1>;
        }
      `,
    },
    {
      code: `
        function Counter() {
          const [count, dispatch] = useReducer((state, action) => {
            if (action === 'inc') {
              return state + 1;
            }
          }, 0);

          useEffect(() => {
            let id = setInterval(() => {
              dispatch('inc');
            }, 1000);
            return () => clearInterval(id);
          }, []);

          return <h1>{count}</h1>;
        }
      `,
    },
    {
      code: `
        function Counter() {
          const [count, dispatch] = useReducer((state, action) => {
            if (action === 'inc') {
              return state + 1;
            }
          }, 0);

          const tick = () => {
            dispatch('inc');
          };

          useEffect(() => {
            let id = setInterval(tick, 1000);
            return () => clearInterval(id);
          }, []);

          return <h1>{count}</h1>;
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
      // Regression test
      code: `
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
      // Regression test
      code: `
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
      // Regression test
      code: `
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
          useMemo(() => {
            console.log(local1);
          }, [local1, local2]);
        }
      `,
      output: `
        function MyComponent() {
          const local1 = {};
          const local2 = {};
          useMemo(() => {
            console.log(local1);
          }, [local1]);
        }
      `,
      errors: [
        "React Hook useMemo has an unnecessary dependency: 'local2'. " +
          'Either exclude it or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const local1 = {};
          function MyNestedComponent() {
            const local2 = {};
            useCallback(() => {
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
            useCallback(() => {
              console.log(local1);
              console.log(local2);
            }, [local2]);
          }
        }
      `,
      errors: [
        "React Hook useCallback has a missing dependency: 'local2'. " +
          'Either include it or remove the dependency array. ' +
          "Values like 'local1' aren't valid dependencies " +
          "because their mutation doesn't re-render the component.",
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
          useCallback(() => {}, [window]);
        }
      `,
      output: `
        function MyComponent() {
          useCallback(() => {}, []);
        }
      `,
      errors: [
        "React Hook useCallback has an unnecessary dependency: 'window'. " +
          'Either exclude it or remove the dependency array. ' +
          "Values like 'window' aren't valid dependencies " +
          "because their mutation doesn't re-render the component.",
      ],
    },
    {
      // It is not valid for useCallback to specify extraneous deps
      // because it doesn't serve as a side effect trigger unlike useEffect.
      code: `
        function MyComponent(props) {
          let local = props.foo;
          useCallback(() => {}, [local]);
        }
      `,
      output: `
        function MyComponent(props) {
          let local = props.foo;
          useCallback(() => {}, []);
        }
      `,
      errors: [
        "React Hook useCallback has an unnecessary dependency: 'local'. " +
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
      // It is not valid for useCallback to specify extraneous deps
      // because it doesn't serve as a side effect trigger unlike useEffect.
      // However, we generally allow specifying *broader* deps as escape hatch.
      // So while [props, props.foo] is unnecessary, 'props' wins here as the
      // broader one, and this is why 'props.foo' is reported as unnecessary.
      code: `
        function MyComponent(props) {
          const local = {};
          useCallback(() => {
            console.log(props.foo);
            console.log(props.bar);
          }, [props, props.foo]);
        }
      `,
      output: `
        function MyComponent(props) {
          const local = {};
          useCallback(() => {
            console.log(props.foo);
            console.log(props.bar);
          }, [props]);
        }
      `,
      errors: [
        "React Hook useCallback has an unnecessary dependency: 'props.foo'. " +
          'Either exclude it or remove the dependency array.',
      ],
    },
    {
      // Since we don't have 'props' in the list, we'll suggest narrow dependencies.
      code: `
        function MyComponent(props) {
          const local = {};
          useCallback(() => {
            console.log(props.foo);
            console.log(props.bar);
          }, []);
        }
      `,
      output: `
        function MyComponent(props) {
          const local = {};
          useCallback(() => {
            console.log(props.foo);
            console.log(props.bar);
          }, [props.bar, props.foo]);
        }
      `,
      errors: [
        "React Hook useCallback has missing dependencies: 'props.bar' and 'props.foo'. " +
          'Either include them or remove the dependency array.',
      ],
    },
    {
      // Effects are allowed to over-specify deps. We'll complain about missing
      // 'local', but we won't remove the already-specified 'local.id' from your list.
      code: `
        function MyComponent() {
          const local = {id: 42};
          useEffect(() => {
            console.log(local);
          }, [local.id]);
        }
      `,
      output: `
        function MyComponent() {
          const local = {id: 42};
          useEffect(() => {
            console.log(local);
          }, [local, local.id]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'local'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      // Callbacks are not allowed to over-specify deps. So we'll complain about missing
      // 'local' and we will also *remove* 'local.id' from your list.
      code: `
        function MyComponent() {
          const local = {id: 42};
          const fn = useCallback(() => {
            console.log(local);
          }, [local.id]);
        }
      `,
      output: `
        function MyComponent() {
          const local = {id: 42};
          const fn = useCallback(() => {
            console.log(local);
          }, [local]);
        }
      `,
      errors: [
        "React Hook useCallback has a missing dependency: 'local'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      // Callbacks are not allowed to over-specify deps. So we'll complain about
      // the unnecessary 'local.id'.
      code: `
        function MyComponent() {
          const local = {id: 42};
          const fn = useCallback(() => {
            console.log(local);
          }, [local.id, local]);
        }
      `,
      output: `
        function MyComponent() {
          const local = {id: 42};
          const fn = useCallback(() => {
            console.log(local);
          }, [local]);
        }
      `,
      errors: [
        "React Hook useCallback has an unnecessary dependency: 'local.id'. " +
          'Either exclude it or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent(props) {
          const fn = useCallback(() => {
            console.log(props.foo.bar.baz);
          }, []);
        }
      `,
      output: `
        function MyComponent(props) {
          const fn = useCallback(() => {
            console.log(props.foo.bar.baz);
          }, [props.foo.bar.baz]);
        }
      `,
      errors: [
        "React Hook useCallback has a missing dependency: 'props.foo.bar.baz'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent(props) {
          let color = {}
          const fn = useCallback(() => {
            console.log(props.foo.bar.baz);
            console.log(color);
          }, [props.foo, props.foo.bar.baz]);
        }
      `,
      output: `
        function MyComponent(props) {
          let color = {}
          const fn = useCallback(() => {
            console.log(props.foo.bar.baz);
            console.log(color);
          }, [color, props.foo.bar.baz]);
        }
      `,
      errors: [
        "React Hook useCallback has a missing dependency: 'color'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      // Callbacks are not allowed to over-specify deps. So one of these is extra.
      // However, it *is* allowed to specify broader deps then strictly necessary.
      // So in this case we ask you to remove 'props.foo.bar.baz' because 'props.foo'
      // already covers it, and having both is unnecessary.
      // TODO: maybe consider suggesting a narrower one by default in these cases.
      code: `
        function MyComponent(props) {
          const fn = useCallback(() => {
            console.log(props.foo.bar.baz);
          }, [props.foo.bar.baz, props.foo]);
        }
      `,
      output: `
        function MyComponent(props) {
          const fn = useCallback(() => {
            console.log(props.foo.bar.baz);
          }, [props.foo]);
        }
      `,
      errors: [
        "React Hook useCallback has an unnecessary dependency: 'props.foo.bar.baz'. " +
          'Either exclude it or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent(props) {
          const fn = useCallback(() => {
            console.log(props.foo.bar.baz);
            console.log(props.foo.fizz.bizz);
          }, []);
        }
      `,
      output: `
        function MyComponent(props) {
          const fn = useCallback(() => {
            console.log(props.foo.bar.baz);
            console.log(props.foo.fizz.bizz);
          }, [props.foo.bar.baz, props.foo.fizz.bizz]);
        }
      `,
      errors: [
        "React Hook useCallback has missing dependencies: 'props.foo.bar.baz' and 'props.foo.fizz.bizz'. " +
          'Either include them or remove the dependency array.',
      ],
    },
    {
      // Normally we allow specifying deps too broadly.
      // So we'd be okay if 'props.foo.bar' was there rather than 'props.foo.bar.baz'.
      // However, 'props.foo.bar.baz' is missing. So we know there is a mistake.
      // When we're sure there is a mistake, for callbacks we will rebuild the list
      // from scratch. This will set the user on a better path by default.
      // This is why we end up with just 'props.foo.bar', and not them both.
      code: `
        function MyComponent(props) {
          const fn = useCallback(() => {
            console.log(props.foo.bar);
          }, [props.foo.bar.baz]);
        }
      `,
      output: `
        function MyComponent(props) {
          const fn = useCallback(() => {
            console.log(props.foo.bar);
          }, [props.foo.bar]);
        }
      `,
      errors: [
        "React Hook useCallback has a missing dependency: 'props.foo.bar'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent(props) {
          const fn = useCallback(() => {
            console.log(props);
            console.log(props.hello);
          }, [props.foo.bar.baz]);
        }
      `,
      output: `
        function MyComponent(props) {
          const fn = useCallback(() => {
            console.log(props);
            console.log(props.hello);
          }, [props]);
        }
      `,
      errors: [
        "React Hook useCallback has a missing dependency: 'props'. " +
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
          useCallback(() => {
            const local1 = {};
            console.log(local1);
          }, [local1]);
        }
      `,
      output: `
        function MyComponent() {
          const local1 = {};
          useCallback(() => {
            const local1 = {};
            console.log(local1);
          }, []);
        }
      `,
      errors: [
        "React Hook useCallback has an unnecessary dependency: 'local1'. " +
          'Either exclude it or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent() {
          const local1 = {};
          useCallback(() => {}, [local1]);
        }
      `,
      output: `
        function MyComponent() {
          const local1 = {};
          useCallback(() => {}, []);
        }
      `,
      errors: [
        "React Hook useCallback has an unnecessary dependency: 'local1'. " +
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
        function MyComponent({ activeTab }) {
          const ref1 = useRef();
          const ref2 = useRef();
          useEffect(() => {
            ref1.current.scrollTop = 0;
            ref2.current.scrollTop = 0;
          }, [ref1.current, ref2.current, activeTab]);
        }
      `,
      output: `
        function MyComponent({ activeTab }) {
          const ref1 = useRef();
          const ref2 = useRef();
          useEffect(() => {
            ref1.current.scrollTop = 0;
            ref2.current.scrollTop = 0;
          }, [activeTab]);
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
        function MyComponent({ activeTab, initY }) {
          const ref1 = useRef();
          const ref2 = useRef();
          const fn = useCallback(() => {
            ref1.current.scrollTop = initY;
            ref2.current.scrollTop = initY;
          }, [ref1.current, ref2.current, activeTab, initY]);
        }
      `,
      output: `
        function MyComponent({ activeTab, initY }) {
          const ref1 = useRef();
          const ref2 = useRef();
          const fn = useCallback(() => {
            ref1.current.scrollTop = initY;
            ref2.current.scrollTop = initY;
          }, [initY]);
        }
      `,
      errors: [
        "React Hook useCallback has unnecessary dependencies: 'activeTab', 'ref1.current', and 'ref2.current'. " +
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
      output: `
        function MyComponent(props) {
          useEffect(() => {
            if (props.onChange) {
              props.onChange();
            }
          }, [props]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'props'. " +
          'Either include it or remove the dependency array. ' +
          'Alternatively, destructure the necessary props outside the callback.',
      ],
    },
    {
      code: `
        function MyComponent(props) {
          useEffect(() => {
           function play() {
              props.onPlay();
            }
            function pause() {
              props.onPause();
            }
          }, []);
        }
      `,
      output: `
        function MyComponent(props) {
          useEffect(() => {
           function play() {
              props.onPlay();
            }
            function pause() {
              props.onPause();
            }
          }, [props]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'props'. " +
          'Either include it or remove the dependency array. ' +
          'Alternatively, destructure the necessary props outside the callback.',
      ],
    },
    {
      code: `
        function MyComponent(props) {
          useEffect(() => {
            if (props.foo.onChange) {
              props.foo.onChange();
            }
          }, []);
        }
      `,
      output: `
        function MyComponent(props) {
          useEffect(() => {
            if (props.foo.onChange) {
              props.foo.onChange();
            }
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
            props.onChange();
            if (props.foo.onChange) {
              props.foo.onChange();
            }
          }, []);
        }
      `,
      output: `
        function MyComponent(props) {
          useEffect(() => {
            props.onChange();
            if (props.foo.onChange) {
              props.foo.onChange();
            }
          }, [props]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'props'. " +
          'Either include it or remove the dependency array. ' +
          'Alternatively, destructure the necessary props outside the callback.',
      ],
    },
    {
      code: `
        function MyComponent(props) {
          const [skillsCount] = useState();
          useEffect(() => {
            if (skillsCount === 0 && !props.isEditMode) {
              props.toggleEditMode();
            }
          }, [skillsCount, props.isEditMode, props.toggleEditMode]);
        }
      `,
      output: `
        function MyComponent(props) {
          const [skillsCount] = useState();
          useEffect(() => {
            if (skillsCount === 0 && !props.isEditMode) {
              props.toggleEditMode();
            }
          }, [skillsCount, props.isEditMode, props.toggleEditMode, props]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'props'. " +
          'Either include it or remove the dependency array. ' +
          'Alternatively, destructure the necessary props outside the callback.',
      ],
    },
    {
      code: `
        function MyComponent(props) {
          const [skillsCount] = useState();
          useEffect(() => {
            if (skillsCount === 0 && !props.isEditMode) {
              props.toggleEditMode();
            }
          }, []);
        }
      `,
      output: `
        function MyComponent(props) {
          const [skillsCount] = useState();
          useEffect(() => {
            if (skillsCount === 0 && !props.isEditMode) {
              props.toggleEditMode();
            }
          }, [props, skillsCount]);
        }
      `,
      errors: [
        "React Hook useEffect has missing dependencies: 'props' and 'skillsCount'. " +
          'Either include them or remove the dependency array. ' +
          'Alternatively, destructure the necessary props outside the callback.',
      ],
    },
    {
      code: `
        function MyComponent(props) {
          useEffect(() => {
            externalCall(props);
            props.onChange();
          }, []);
        }
      `,
      output: `
        function MyComponent(props) {
          useEffect(() => {
            externalCall(props);
            props.onChange();
          }, [props]);
        }
      `,
      // Don't suggest to destructure props here since you can't.
      errors: [
        "React Hook useEffect has a missing dependency: 'props'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      code: `
        function MyComponent(props) {
          useEffect(() => {
            props.onChange();
            externalCall(props);
          }, []);
        }
      `,
      output: `
        function MyComponent(props) {
          useEffect(() => {
            props.onChange();
            externalCall(props);
          }, [props]);
        }
      `,
      // Don't suggest to destructure props here since you can't.
      errors: [
        "React Hook useEffect has a missing dependency: 'props'. " +
          'Either include it or remove the dependency array.',
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
    {
      code: `
        function MyComponent() {
          useEffect(() => {
            window.scrollTo(0, 0);
          }, [window]);
        }
      `,
      errors: [
        "React Hook useEffect has an unnecessary dependency: 'window'. " +
          'Either exclude it or remove the dependency array. ' +
          "Values like 'window' aren't valid dependencies " +
          "because their mutation doesn't re-render the component.",
      ],
    },
    {
      code: `
        import MutableStore from 'store';

        function MyComponent() {
          useEffect(() => {
            console.log(MutableStore.hello);
          }, [MutableStore.hello]);
        }
      `,
      output: `
        import MutableStore from 'store';

        function MyComponent() {
          useEffect(() => {
            console.log(MutableStore.hello);
          }, []);
        }
      `,
      errors: [
        "React Hook useEffect has an unnecessary dependency: 'MutableStore.hello'. " +
          'Either exclude it or remove the dependency array. ' +
          "Values like 'MutableStore.hello' aren't valid dependencies " +
          "because their mutation doesn't re-render the component.",
      ],
    },
    {
      code: `
        import MutableStore from 'store';
        let z = {};

        function MyComponent(props) {
          let x = props.foo;
          {
            let y = props.bar;
            useEffect(() => {
              console.log(MutableStore.hello.world, props.foo, x, y, z, global.stuff);
            }, [MutableStore.hello.world, props.foo, x, y, z, global.stuff]);
          }
        }
      `,
      output: `
        import MutableStore from 'store';
        let z = {};

        function MyComponent(props) {
          let x = props.foo;
          {
            let y = props.bar;
            useEffect(() => {
              console.log(MutableStore.hello.world, props.foo, x, y, z, global.stuff);
            }, [props.foo, x, y]);
          }
        }
      `,
      errors: [
        'React Hook useEffect has unnecessary dependencies: ' +
          "'MutableStore.hello.world', 'global.stuff', and 'z'. " +
          'Either exclude them or remove the dependency array. ' +
          "Values like 'MutableStore.hello.world' aren't valid dependencies " +
          "because their mutation doesn't re-render the component.",
      ],
    },
    {
      code: `
        import MutableStore from 'store';
        let z = {};

        function MyComponent(props) {
          let x = props.foo;
          {
            let y = props.bar;
            useEffect(() => {
              // nothing
            }, [MutableStore.hello.world, props.foo, x, y, z, global.stuff]);
          }
        }
      `,
      // The output should contain the ones that are inside a component
      // since there are legit reasons to over-specify them for effects.
      output: `
        import MutableStore from 'store';
        let z = {};

        function MyComponent(props) {
          let x = props.foo;
          {
            let y = props.bar;
            useEffect(() => {
              // nothing
            }, [props.foo, x, y]);
          }
        }
      `,
      errors: [
        'React Hook useEffect has unnecessary dependencies: ' +
          "'MutableStore.hello.world', 'global.stuff', and 'z'. " +
          'Either exclude them or remove the dependency array. ' +
          "Values like 'MutableStore.hello.world' aren't valid dependencies " +
          "because their mutation doesn't re-render the component.",
      ],
    },
    {
      code: `
        import MutableStore from 'store';
        let z = {};

        function MyComponent(props) {
          let x = props.foo;
          {
            let y = props.bar;
            const fn = useCallback(() => {
              // nothing
            }, [MutableStore.hello.world, props.foo, x, y, z, global.stuff]);
          }
        }
      `,
      output: `
        import MutableStore from 'store';
        let z = {};

        function MyComponent(props) {
          let x = props.foo;
          {
            let y = props.bar;
            const fn = useCallback(() => {
              // nothing
            }, []);
          }
        }
      `,
      errors: [
        'React Hook useCallback has unnecessary dependencies: ' +
          "'MutableStore.hello.world', 'global.stuff', 'props.foo', 'x', 'y', and 'z'. " +
          'Either exclude them or remove the dependency array. ' +
          "Values like 'MutableStore.hello.world' aren't valid dependencies " +
          "because their mutation doesn't re-render the component.",
      ],
    },
    {
      // Every almost-static function is tainted by a dynamic value.
      code: `
        function MyComponent(props) {
          let [, setState] = useState();
          let [, dispatch] = React.useReducer();
          let taint = props.foo;

          function handleNext1(value) {
            let value2 = value * taint;
            setState(value2);
            console.log('hello');
          }
          const handleNext2 = (value) => {
            setState(taint(value));
            console.log('hello');
          };
          let handleNext3 = function(value) {
            setTimeout(() => console.log(taint));
            dispatch({ type: 'x', value });
          };
          useEffect(() => {
            return Store.subscribe(handleNext1);
          }, []);
          useLayoutEffect(() => {
            return Store.subscribe(handleNext2);
          }, []);
          useMemo(() => {
            return Store.subscribe(handleNext3);
          }, []);
        }
      `,
      output: `
        function MyComponent(props) {
          let [, setState] = useState();
          let [, dispatch] = React.useReducer();
          let taint = props.foo;

          function handleNext1(value) {
            let value2 = value * taint;
            setState(value2);
            console.log('hello');
          }
          const handleNext2 = (value) => {
            setState(taint(value));
            console.log('hello');
          };
          let handleNext3 = function(value) {
            setTimeout(() => console.log(taint));
            dispatch({ type: 'x', value });
          };
          useEffect(() => {
            return Store.subscribe(handleNext1);
          }, [handleNext1]);
          useLayoutEffect(() => {
            return Store.subscribe(handleNext2);
          }, [handleNext2]);
          useMemo(() => {
            return Store.subscribe(handleNext3);
          }, [handleNext3]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'handleNext1'. " +
          'Either include it or remove the dependency array.',
        "React Hook useLayoutEffect has a missing dependency: 'handleNext2'. " +
          'Either include it or remove the dependency array.',
        "React Hook useMemo has a missing dependency: 'handleNext3'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      // Regression test
      code: `
        function MyComponent(props) {
          let [, setState] = useState();
          let [, dispatch] = React.useReducer();
          let taint = props.foo;

          // Shouldn't affect anything
          function handleChange() {}

          function handleNext1(value) {
            let value2 = value * taint;
            setState(value2);
            console.log('hello');
          }
          const handleNext2 = (value) => {
            setState(taint(value));
            console.log('hello');
          };
          let handleNext3 = function(value) {
            console.log(taint);
            dispatch({ type: 'x', value });
          };
          useEffect(() => {
            return Store.subscribe(handleNext1);
          }, []);
          useLayoutEffect(() => {
            return Store.subscribe(handleNext2);
          }, []);
          useMemo(() => {
            return Store.subscribe(handleNext3);
          }, []);
        }
      `,
      output: `
        function MyComponent(props) {
          let [, setState] = useState();
          let [, dispatch] = React.useReducer();
          let taint = props.foo;

          // Shouldn't affect anything
          function handleChange() {}

          function handleNext1(value) {
            let value2 = value * taint;
            setState(value2);
            console.log('hello');
          }
          const handleNext2 = (value) => {
            setState(taint(value));
            console.log('hello');
          };
          let handleNext3 = function(value) {
            console.log(taint);
            dispatch({ type: 'x', value });
          };
          useEffect(() => {
            return Store.subscribe(handleNext1);
          }, [handleNext1]);
          useLayoutEffect(() => {
            return Store.subscribe(handleNext2);
          }, [handleNext2]);
          useMemo(() => {
            return Store.subscribe(handleNext3);
          }, [handleNext3]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'handleNext1'. " +
          'Either include it or remove the dependency array.',
        "React Hook useLayoutEffect has a missing dependency: 'handleNext2'. " +
          'Either include it or remove the dependency array.',
        "React Hook useMemo has a missing dependency: 'handleNext3'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      // Regression test
      code: `
        function MyComponent(props) {
          let [, setState] = useState();
          let [, dispatch] = React.useReducer();
          let taint = props.foo;

          // Shouldn't affect anything
          const handleChange = () => {};

          function handleNext1(value) {
            let value2 = value * taint;
            setState(value2);
            console.log('hello');
          }
          const handleNext2 = (value) => {
            setState(taint(value));
            console.log('hello');
          };
          let handleNext3 = function(value) {
            console.log(taint);
            dispatch({ type: 'x', value });
          };
          useEffect(() => {
            return Store.subscribe(handleNext1);
          }, []);
          useLayoutEffect(() => {
            return Store.subscribe(handleNext2);
          }, []);
          useMemo(() => {
            return Store.subscribe(handleNext3);
          }, []);
        }
      `,
      output: `
        function MyComponent(props) {
          let [, setState] = useState();
          let [, dispatch] = React.useReducer();
          let taint = props.foo;

          // Shouldn't affect anything
          const handleChange = () => {};

          function handleNext1(value) {
            let value2 = value * taint;
            setState(value2);
            console.log('hello');
          }
          const handleNext2 = (value) => {
            setState(taint(value));
            console.log('hello');
          };
          let handleNext3 = function(value) {
            console.log(taint);
            dispatch({ type: 'x', value });
          };
          useEffect(() => {
            return Store.subscribe(handleNext1);
          }, [handleNext1]);
          useLayoutEffect(() => {
            return Store.subscribe(handleNext2);
          }, [handleNext2]);
          useMemo(() => {
            return Store.subscribe(handleNext3);
          }, [handleNext3]);
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'handleNext1'. " +
          'Either include it or remove the dependency array.',
        "React Hook useLayoutEffect has a missing dependency: 'handleNext2'. " +
          'Either include it or remove the dependency array.',
        "React Hook useMemo has a missing dependency: 'handleNext3'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      code: `
        function Counter() {
          let [count, setCount] = useState(0);

          useEffect(() => {
            let id = setInterval(() => {
              setCount(count + 1);
            }, 1000);
            return () => clearInterval(id);
          }, []);

          return <h1>{count}</h1>;
        }
      `,
      output: `
        function Counter() {
          let [count, setCount] = useState(0);

          useEffect(() => {
            let id = setInterval(() => {
              setCount(count + 1);
            }, 1000);
            return () => clearInterval(id);
          }, [count]);

          return <h1>{count}</h1>;
        }
      `,
      // TODO: ideally this should suggest useState updater form
      // since this code doesn't actually work.
      errors: [
        "React Hook useEffect has a missing dependency: 'count'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      code: `
        function Counter() {
          const [count, setCount] = useState(0);

          function tick() {
            setCount(count + 1);
          }

          useEffect(() => {
            let id = setInterval(() => {
              tick();
            }, 1000);
            return () => clearInterval(id);
          }, []);

          return <h1>{count}</h1>;
        }
      `,
      output: `
        function Counter() {
          const [count, setCount] = useState(0);

          function tick() {
            setCount(count + 1);
          }

          useEffect(() => {
            let id = setInterval(() => {
              tick();
            }, 1000);
            return () => clearInterval(id);
          }, [tick]);

          return <h1>{count}</h1>;
        }
      `,
      // TODO: ideally this should suggest useState updater form
      // since this code doesn't actually work. The autofix could
      // at least avoid suggesting 'tick' since it's obviously
      // always different, and thus useless.
      errors: [
        "React Hook useEffect has a missing dependency: 'tick'. " +
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
