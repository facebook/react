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
  parser: require.resolve('babel-eslint'),
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
      // Valid because they have meaning without deps.
      code: `
        function MyComponent(props) {
          useEffect(() => {});
          useLayoutEffect(() => {});
          useImperativeHandle(props.innerRef, () => {});
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
      code: `
        function MyComponent(props) {
          useCustomEffect(() => {
            console.log(props.foo);
          }, []);
        }
      `,
      options: [{additionalHooks: 'useAnotherEffect'}],
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
        function MyComponent({ maybeRef2, foo }) {
          const definitelyRef1 = useRef();
          const definitelyRef2 = useRef();
          const maybeRef1 = useSomeOtherRefyThing();
          const [state1, setState1] = useState();
          const [state2, setState2] = React.useState();
          const [state3, dispatch1] = useReducer();
          const [state4, dispatch2] = React.useReducer();
          const [state5, maybeSetState] = useFunnyState();
          const [state6, maybeDispatch] = useFunnyReducer();
          const mySetState = useCallback(() => {}, []);
          let myDispatch = useCallback(() => {}, []);

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

          const mySetState = useCallback(() => {}, []);
          let myDispatch = useCallback(() => {}, []);

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
    {
      // Regression test for a crash
      code: `
        function Podcasts() {
          useEffect(() => {
            setPodcasts([]);
          }, []);
          let [podcasts, setPodcasts] = useState(null);
        }
      `,
    },
    {
      code: `
        function withFetch(fetchPodcasts) {
          return function Podcasts({ id }) {
            let [podcasts, setPodcasts] = useState(null);
            useEffect(() => {
              fetchPodcasts(id).then(setPodcasts);
            }, [id]);
          }
        }
      `,
    },
    {
      code: `
        function Podcasts({ id }) {
          let [podcasts, setPodcasts] = useState(null);
          useEffect(() => {
            function doFetch({ fetchPodcasts }) {
              fetchPodcasts(id).then(setPodcasts);
            }
            doFetch({ fetchPodcasts: API.fetchPodcasts });
          }, [id]);
        }
      `,
    },
    {
      code: `
        function Counter() {
          let [count, setCount] = useState(0);

          function increment(x) {
            return x + 1;
          }

          useEffect(() => {
            let id = setInterval(() => {
              setCount(increment);
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
          let [count, setCount] = useState(0);

          function increment(x) {
            return x + 1;
          }

          useEffect(() => {
            let id = setInterval(() => {
              setCount(count => increment(count));
            }, 1000);
            return () => clearInterval(id);
          }, []);

          return <h1>{count}</h1>;
        }
      `,
    },
    {
      code: `
        import increment from './increment';
        function Counter() {
          let [count, setCount] = useState(0);

          useEffect(() => {
            let id = setInterval(() => {
              setCount(count => count + increment);
            }, 1000);
            return () => clearInterval(id);
          }, []);

          return <h1>{count}</h1>;
        }
      `,
    },
    {
      code: `
        function withStuff(increment) {
          return function Counter() {
            let [count, setCount] = useState(0);

            useEffect(() => {
              let id = setInterval(() => {
                setCount(count => count + increment);
              }, 1000);
              return () => clearInterval(id);
            }, []);

            return <h1>{count}</h1>;
          }
        }
      `,
    },
    {
      code: `
        function App() {
          const [query, setQuery] = useState('react');
          const [state, setState] = useState(null);
          useEffect(() => {
            let ignore = false;
            fetchSomething();
            async function fetchSomething() {
              const result = await (await fetch('http://hn.algolia.com/api/v1/search?query=' + query)).json();
              if (!ignore) setState(result);
            }
            return () => { ignore = true; };
          }, [query]);
          return (
            <>
              <input value={query} onChange={e => setQuery(e.target.value)} />
              {JSON.stringify(state)}
            </>
          );
        }
      `,
    },
    {
      code: `
        function Example() {
          const foo = useCallback(() => {
            foo();
          }, []);
        }
      `,
    },
    {
      code: `
        function Example({ prop }) {
          const foo = useCallback(() => {
            if (prop) {
              foo();
            }
          }, [prop]);
        }
      `,
    },
    {
      code: `
        function Hello() {
          const [state, setState] = useState(0);
          useEffect(() => {
            const handleResize = () => setState(window.innerWidth);
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
          });
        }
      `,
    },
    // Ignore Generic Type Variables for arrow functions
    {
      code: `
        function Example({ prop }) {
          const bar = useEffect(<T>(a: T): Hello => {
            prop();
          }, [prop]);
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
      // Invalid because they don't have a meaning without deps.
      code: `
        function MyComponent(props) {
          const value = useMemo(() => { return 2*2; });
          const fn = useCallback(() => { alert('foo'); });
        }
      `,
      // We don't know what you meant.
      output: `
        function MyComponent(props) {
          const value = useMemo(() => { return 2*2; });
          const fn = useCallback(() => { alert('foo'); });
        }
      `,
      errors: [
        'React Hook useMemo does nothing when called with only one argument. ' +
          'Did you forget to pass an array of dependencies?',
        'React Hook useCallback does nothing when called with only one argument. ' +
          'Did you forget to pass an array of dependencies?',
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
          "Outer scope values like 'local1' aren't valid dependencies " +
          "because mutating them doesn't re-render the component.",
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
          "Outer scope values like 'window' aren't valid dependencies " +
          "because mutating them doesn't re-render the component.",
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
        function MyComponent() {
          useEffect(() => {}, ['foo']);
        }
      `,
      // TODO: we could autofix this.
      output: `
        function MyComponent() {
          useEffect(() => {}, ['foo']);
        }
      `,
      errors: [
        // Don't assume user meant `foo` because it's not used in the effect.
        "The 'foo' literal is not a valid dependency because it never changes. " +
          'You can safely remove it.',
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
        "The 'foo' literal is not a valid dependency because it never changes. " +
          'Did you mean to include foo in the array instead?',
        "The 'bar' literal is not a valid dependency because it never changes. " +
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
        'The 42 literal is not a valid dependency because it never changes. You can safely remove it.',
        'The false literal is not a valid dependency because it never changes. You can safely remove it.',
        'The null literal is not a valid dependency because it never changes. You can safely remove it.',
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
        'React Hook useEffect was passed a dependency list that is not an ' +
          "array literal. This means we can't statically verify whether you've " +
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
        'React Hook useEffect was passed a dependency list that is not an ' +
          "array literal. This means we can't statically verify whether you've " +
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
          'Either include it or remove the dependency array. ' +
          `You can also do a functional update 'setState(s => ...)' ` +
          `if you only need 'state' in the 'setState' call.`,
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
          'Either include it or remove the dependency array. ' +
          `You can also do a functional update 'setState(s => ...)' ` +
          `if you only need 'state' in the 'setState' call.`,
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
          "because mutating them doesn't re-render the component.",
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
          "because mutating them doesn't re-render the component.",
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
          "because mutating them doesn't re-render the component.",
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
          "because mutating them doesn't re-render the component.",
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
          "because mutating them doesn't re-render the component.",
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
          `However, 'props' will change when *any* prop changes, so the ` +
          `preferred fix is to destructure the 'props' object outside ` +
          `of the useEffect call and refer to those specific ` +
          `props inside useEffect.`,
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
          `However, 'props' will change when *any* prop changes, so the ` +
          `preferred fix is to destructure the 'props' object outside ` +
          `of the useEffect call and refer to those specific ` +
          `props inside useEffect.`,
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
          `However, 'props' will change when *any* prop changes, so the ` +
          `preferred fix is to destructure the 'props' object outside ` +
          `of the useEffect call and refer to those specific ` +
          `props inside useEffect.`,
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
          `However, 'props' will change when *any* prop changes, so the ` +
          `preferred fix is to destructure the 'props' object outside ` +
          `of the useEffect call and refer to those specific ` +
          `props inside useEffect.`,
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
          `However, 'props' will change when *any* prop changes, so the ` +
          `preferred fix is to destructure the 'props' object outside ` +
          `of the useEffect call and refer to those specific ` +
          `props inside useEffect.`,
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
          let value4;
          let asyncValue;
          useEffect(() => {
            if (value4) {
              value = {};
            }
            value2 = 100;
            value = 43;
            value4 = true;
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
          let value4;
          let asyncValue;
          useEffect(() => {
            if (value4) {
              value = {};
            }
            value2 = 100;
            value = 43;
            value4 = true;
            console.log(value2);
            console.log(value3);
            setTimeout(() => {
              asyncValue = 100;
            });
          }, []);
        }
      `,
      errors: [
        // value2
        `Assignments to the 'value2' variable from inside React Hook useEffect ` +
          `will be lost after each render. To preserve the value over time, ` +
          `store it in a useRef Hook and keep the mutable value in the '.current' property. ` +
          `Otherwise, you can move this variable directly inside useEffect.`,
        // value
        `Assignments to the 'value' variable from inside React Hook useEffect ` +
          `will be lost after each render. To preserve the value over time, ` +
          `store it in a useRef Hook and keep the mutable value in the '.current' property. ` +
          `Otherwise, you can move this variable directly inside useEffect.`,
        // value4
        `Assignments to the 'value4' variable from inside React Hook useEffect ` +
          `will be lost after each render. To preserve the value over time, ` +
          `store it in a useRef Hook and keep the mutable value in the '.current' property. ` +
          `Otherwise, you can move this variable directly inside useEffect.`,
        // asyncValue
        `Assignments to the 'asyncValue' variable from inside React Hook useEffect ` +
          `will be lost after each render. To preserve the value over time, ` +
          `store it in a useRef Hook and keep the mutable value in the '.current' property. ` +
          `Otherwise, you can move this variable directly inside useEffect.`,
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
        `Assignments to the 'value' variable from inside React Hook useEffect ` +
          `will be lost after each render. To preserve the value over time, ` +
          `store it in a useRef Hook and keep the mutable value in the '.current' property. ` +
          `Otherwise, you can move this variable directly inside useEffect.`,
        // value2
        `Assignments to the 'value2' variable from inside React Hook useEffect ` +
          `will be lost after each render. To preserve the value over time, ` +
          `store it in a useRef Hook and keep the mutable value in the '.current' property. ` +
          `Otherwise, you can move this variable directly inside useEffect.`,
        // asyncValue
        `Assignments to the 'asyncValue' variable from inside React Hook useEffect ` +
          `will be lost after each render. To preserve the value over time, ` +
          `store it in a useRef Hook and keep the mutable value in the '.current' property. ` +
          `Otherwise, you can move this variable directly inside useEffect.`,
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
        `The ref value 'myRef.current' will likely have changed by the time ` +
          `this effect cleanup function runs. If this ref points to a node ` +
          `rendered by React, copy 'myRef.current' to a variable inside the effect, ` +
          `and use that variable in the cleanup function.`,
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
          });
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
          });
          return <div ref={myRef} />;
        }
      `,
      errors: [
        `The ref value 'myRef.current' will likely have changed by the time ` +
          `this effect cleanup function runs. If this ref points to a node ` +
          `rendered by React, copy 'myRef.current' to a variable inside the effect, ` +
          `and use that variable in the cleanup function.`,
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
        `The ref value 'myRef.current' will likely have changed by the time ` +
          `this effect cleanup function runs. If this ref points to a node ` +
          `rendered by React, copy 'myRef.current' to a variable inside the effect, ` +
          `and use that variable in the cleanup function.`,
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
        `The ref value 'myRef.current' will likely have changed by the time ` +
          `this effect cleanup function runs. If this ref points to a node ` +
          `rendered by React, copy 'myRef.current' to a variable inside the effect, ` +
          `and use that variable in the cleanup function.`,
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
        `The ref value 'myRef.current' will likely have changed by the time ` +
          `this effect cleanup function runs. If this ref points to a node ` +
          `rendered by React, copy 'myRef.current' to a variable inside the effect, ` +
          `and use that variable in the cleanup function.`,
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
          "Outer scope values like 'window' aren't valid dependencies " +
          "because mutating them doesn't re-render the component.",
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
          "Outer scope values like 'MutableStore.hello' aren't valid dependencies " +
          "because mutating them doesn't re-render the component.",
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
          "Outer scope values like 'MutableStore.hello.world' aren't valid dependencies " +
          "because mutating them doesn't re-render the component.",
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
          "Outer scope values like 'MutableStore.hello.world' aren't valid dependencies " +
          "because mutating them doesn't re-render the component.",
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
          "Outer scope values like 'MutableStore.hello.world' aren't valid dependencies " +
          "because mutating them doesn't re-render the component.",
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
      // Even if the function only references static values,
      // once you specify it in deps, it will invalidate them.
      code: `
        function MyComponent(props) {
          let [, setState] = useState();

          function handleNext(value) {
            setState(value);
          }

          useEffect(() => {
            return Store.subscribe(handleNext);
          }, [handleNext]);
        }
      `,
      // Not gonna autofix a function definition
      // because it's not always safe due to hoisting.
      output: `
        function MyComponent(props) {
          let [, setState] = useState();

          function handleNext(value) {
            setState(value);
          }

          useEffect(() => {
            return Store.subscribe(handleNext);
          }, [handleNext]);
        }
      `,
      errors: [
        `The 'handleNext' function makes the dependencies of ` +
          `useEffect Hook (at line 11) change on every render. ` +
          `Move it inside the useEffect callback. Alternatively, ` +
          `wrap the 'handleNext' definition into its own useCallback() Hook.`,
      ],
    },
    {
      // Even if the function only references static values,
      // once you specify it in deps, it will invalidate them.
      code: `
        function MyComponent(props) {
          let [, setState] = useState();

          const handleNext = (value) => {
            setState(value);
          };

          useEffect(() => {
            return Store.subscribe(handleNext);
          }, [handleNext]);
        }
      `,
      // We don't autofix moving (too invasive). But that's the suggested fix
      // when only effect uses this function. Otherwise, we'd useCallback.
      output: `
        function MyComponent(props) {
          let [, setState] = useState();

          const handleNext = (value) => {
            setState(value);
          };

          useEffect(() => {
            return Store.subscribe(handleNext);
          }, [handleNext]);
        }
      `,
      errors: [
        `The 'handleNext' function makes the dependencies of ` +
          `useEffect Hook (at line 11) change on every render. ` +
          `Move it inside the useEffect callback. Alternatively, ` +
          `wrap the 'handleNext' definition into its own useCallback() Hook.`,
      ],
    },
    {
      // Even if the function only references static values,
      // once you specify it in deps, it will invalidate them.
      // However, we can't suggest moving handleNext into the
      // effect because it is *also* used outside of it.
      // So our suggestion is useCallback().
      code: `
        function MyComponent(props) {
          let [, setState] = useState();

          const handleNext = (value) => {
            setState(value);
          };

          useEffect(() => {
            return Store.subscribe(handleNext);
          }, [handleNext]);

          return <div onClick={handleNext} />;
        }
      `,
      // We autofix this one with useCallback since it's
      // the easy fix and you can't just move it into effect.
      output: `
        function MyComponent(props) {
          let [, setState] = useState();

          const handleNext = useCallback((value) => {
            setState(value);
          });

          useEffect(() => {
            return Store.subscribe(handleNext);
          }, [handleNext]);

          return <div onClick={handleNext} />;
        }
      `,
      errors: [
        `The 'handleNext' function makes the dependencies of ` +
          `useEffect Hook (at line 11) change on every render. ` +
          `To fix this, wrap the 'handleNext' definition into its own useCallback() Hook.`,
      ],
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
      // Autofix doesn't wrap into useCallback here
      // because they are only referenced by effect itself.
      output: `
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
      errors: [
        "The 'handleNext1' function makes the dependencies of useEffect Hook " +
          '(at line 14) change on every render. Move it inside the useEffect callback. ' +
          "Alternatively, wrap the 'handleNext1' definition into its own useCallback() Hook.",
        "The 'handleNext2' function makes the dependencies of useLayoutEffect Hook " +
          '(at line 17) change on every render. Move it inside the useLayoutEffect callback. ' +
          "Alternatively, wrap the 'handleNext2' definition into its own useCallback() Hook.",
        "The 'handleNext3' function makes the dependencies of useMemo Hook " +
          '(at line 20) change on every render. Move it inside the useMemo callback. ' +
          "Alternatively, wrap the 'handleNext3' definition into its own useCallback() Hook.",
      ],
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
            handleNext1();
            return Store.subscribe(() => handleNext1());
          }, [handleNext1]);
          useLayoutEffect(() => {
            handleNext2();
            return Store.subscribe(() => handleNext2());
          }, [handleNext2]);
          useMemo(() => {
            handleNext3();
            return Store.subscribe(() => handleNext3());
          }, [handleNext3]);
        }
      `,
      // Autofix doesn't wrap into useCallback here
      // because they are only referenced by effect itself.
      output: `
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
            handleNext1();
            return Store.subscribe(() => handleNext1());
          }, [handleNext1]);
          useLayoutEffect(() => {
            handleNext2();
            return Store.subscribe(() => handleNext2());
          }, [handleNext2]);
          useMemo(() => {
            handleNext3();
            return Store.subscribe(() => handleNext3());
          }, [handleNext3]);
        }
      `,
      errors: [
        "The 'handleNext1' function makes the dependencies of useEffect Hook " +
          '(at line 15) change on every render. Move it inside the useEffect callback. ' +
          "Alternatively, wrap the 'handleNext1' definition into its own useCallback() Hook.",
        "The 'handleNext2' function makes the dependencies of useLayoutEffect Hook " +
          '(at line 19) change on every render. Move it inside the useLayoutEffect callback. ' +
          "Alternatively, wrap the 'handleNext2' definition into its own useCallback() Hook.",
        "The 'handleNext3' function makes the dependencies of useMemo Hook " +
          '(at line 23) change on every render. Move it inside the useMemo callback. ' +
          "Alternatively, wrap the 'handleNext3' definition into its own useCallback() Hook.",
      ],
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
            handleNext1();
            return Store.subscribe(() => handleNext1());
          }, [handleNext1]);
          useLayoutEffect(() => {
            handleNext2();
            return Store.subscribe(() => handleNext2());
          }, [handleNext2]);
          useMemo(() => {
            handleNext3();
            return Store.subscribe(() => handleNext3());
          }, [handleNext3]);
          return (
            <div
              onClick={() => {
                handleNext1();
                setTimeout(handleNext2);
                setTimeout(() => {
                  handleNext3();
                });
              }}
            />
          );
        }
      `,
      // Autofix wraps into useCallback where possible (variables only)
      // because they are only referenced outside the effect.
      output: `
        function MyComponent(props) {
          function handleNext1() {
            console.log('hello');
          }
          const handleNext2 = useCallback(() => {
            console.log('hello');
          });
          let handleNext3 = useCallback(function() {
            console.log('hello');
          });
          useEffect(() => {
            handleNext1();
            return Store.subscribe(() => handleNext1());
          }, [handleNext1]);
          useLayoutEffect(() => {
            handleNext2();
            return Store.subscribe(() => handleNext2());
          }, [handleNext2]);
          useMemo(() => {
            handleNext3();
            return Store.subscribe(() => handleNext3());
          }, [handleNext3]);
          return (
            <div
              onClick={() => {
                handleNext1();
                setTimeout(handleNext2);
                setTimeout(() => {
                  handleNext3();
                });
              }}
            />
          );
        }
      `,
      errors: [
        "The 'handleNext1' function makes the dependencies of useEffect Hook " +
          '(at line 15) change on every render. To fix this, wrap the ' +
          "'handleNext1' definition into its own useCallback() Hook.",
        "The 'handleNext2' function makes the dependencies of useLayoutEffect Hook " +
          '(at line 19) change on every render. To fix this, wrap the ' +
          "'handleNext2' definition into its own useCallback() Hook.",
        "The 'handleNext3' function makes the dependencies of useMemo Hook " +
          '(at line 23) change on every render. To fix this, wrap the ' +
          "'handleNext3' definition into its own useCallback() Hook.",
      ],
    },
    {
      code: `
        function MyComponent(props) {
          const handleNext1 = () => {
            console.log('hello');
          };
          function handleNext2() {
            console.log('hello');
          }
          useEffect(() => {
            return Store.subscribe(handleNext1);
            return Store.subscribe(handleNext2);
          }, [handleNext1, handleNext2]);
          useEffect(() => {
            return Store.subscribe(handleNext1);
            return Store.subscribe(handleNext2);
          }, [handleNext1, handleNext2]);
        }
      `,
      // Normally we'd suggest moving handleNext inside an
      // effect. But it's used by more than one. So we
      // suggest useCallback() and use it for the autofix
      // where possible (variable but not declaration).
      output: `
        function MyComponent(props) {
          const handleNext1 = useCallback(() => {
            console.log('hello');
          });
          function handleNext2() {
            console.log('hello');
          }
          useEffect(() => {
            return Store.subscribe(handleNext1);
            return Store.subscribe(handleNext2);
          }, [handleNext1, handleNext2]);
          useEffect(() => {
            return Store.subscribe(handleNext1);
            return Store.subscribe(handleNext2);
          }, [handleNext1, handleNext2]);
        }
      `,
      // TODO: we could coalesce messages for the same function if it affects multiple Hooks.
      errors: [
        "The 'handleNext1' function makes the dependencies of useEffect Hook " +
          '(at line 12) change on every render. To fix this, wrap the ' +
          "'handleNext1' definition into its own useCallback() Hook.",
        "The 'handleNext1' function makes the dependencies of useEffect Hook " +
          '(at line 16) change on every render. To fix this, wrap the ' +
          "'handleNext1' definition into its own useCallback() Hook.",
        "The 'handleNext2' function makes the dependencies of useEffect Hook " +
          '(at line 12) change on every render. To fix this, wrap the ' +
          "'handleNext2' definition into its own useCallback() Hook.",
        "The 'handleNext2' function makes the dependencies of useEffect Hook " +
          '(at line 16) change on every render. To fix this, wrap the ' +
          "'handleNext2' definition into its own useCallback() Hook.",
      ],
    },
    {
      code: `
        function MyComponent(props) {
          let handleNext = () => {
            console.log('hello');
          };
          if (props.foo) {
            handleNext = () => {
              console.log('hello');
            };
          }
          useEffect(() => {
            return Store.subscribe(handleNext);
          }, [handleNext]);
        }
      `,
      // Normally we'd suggest moving handleNext inside an
      // effect. But it's used more than once.
      // TODO: our autofix here isn't quite sufficient because
      // it only wraps the first definition. But seems ok.
      output: `
        function MyComponent(props) {
          let handleNext = useCallback(() => {
            console.log('hello');
          });
          if (props.foo) {
            handleNext = () => {
              console.log('hello');
            };
          }
          useEffect(() => {
            return Store.subscribe(handleNext);
          }, [handleNext]);
        }
      `,
      errors: [
        "The 'handleNext' function makes the dependencies of useEffect Hook " +
          '(at line 13) change on every render. To fix this, wrap the ' +
          "'handleNext' definition into its own useCallback() Hook.",
      ],
    },
    {
      code: `
        function MyComponent(props) {
          let [, setState] = useState();
          let taint = props.foo;

          function handleNext(value) {
            let value2 = value * taint;
            setState(value2);
            console.log('hello');
          }

          useEffect(() => {
            return Store.subscribe(handleNext);
          }, [handleNext]);
        }
      `,
      output: `
        function MyComponent(props) {
          let [, setState] = useState();
          let taint = props.foo;

          function handleNext(value) {
            let value2 = value * taint;
            setState(value2);
            console.log('hello');
          }

          useEffect(() => {
            return Store.subscribe(handleNext);
          }, [handleNext]);
        }
      `,
      errors: [
        `The 'handleNext' function makes the dependencies of ` +
          `useEffect Hook (at line 14) change on every render. ` +
          `Move it inside the useEffect callback. Alternatively, wrap the ` +
          `'handleNext' definition into its own useCallback() Hook.`,
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
      errors: [
        "React Hook useEffect has a missing dependency: 'count'. " +
          'Either include it or remove the dependency array. ' +
          `You can also do a functional update 'setCount(c => ...)' if you ` +
          `only need 'count' in the 'setCount' call.`,
      ],
    },
    {
      code: `
        function Counter() {
          let [count, setCount] = useState(0);
          let [increment, setIncrement] = useState(0);

          useEffect(() => {
            let id = setInterval(() => {
              setCount(count + increment);
            }, 1000);
            return () => clearInterval(id);
          }, []);

          return <h1>{count}</h1>;
        }
      `,
      output: `
        function Counter() {
          let [count, setCount] = useState(0);
          let [increment, setIncrement] = useState(0);

          useEffect(() => {
            let id = setInterval(() => {
              setCount(count + increment);
            }, 1000);
            return () => clearInterval(id);
          }, [count, increment]);

          return <h1>{count}</h1>;
        }
      `,
      errors: [
        "React Hook useEffect has missing dependencies: 'count' and 'increment'. " +
          'Either include them or remove the dependency array. ' +
          `You can also do a functional update 'setCount(c => ...)' if you ` +
          `only need 'count' in the 'setCount' call.`,
      ],
    },
    {
      code: `
        function Counter() {
          let [count, setCount] = useState(0);
          let [increment, setIncrement] = useState(0);

          useEffect(() => {
            let id = setInterval(() => {
              setCount(count => count + increment);
            }, 1000);
            return () => clearInterval(id);
          }, []);

          return <h1>{count}</h1>;
        }
      `,
      output: `
        function Counter() {
          let [count, setCount] = useState(0);
          let [increment, setIncrement] = useState(0);

          useEffect(() => {
            let id = setInterval(() => {
              setCount(count => count + increment);
            }, 1000);
            return () => clearInterval(id);
          }, [increment]);

          return <h1>{count}</h1>;
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'increment'. " +
          'Either include it or remove the dependency array. ' +
          `You can also replace multiple useState variables with useReducer ` +
          `if 'setCount' needs the current value of 'increment'.`,
      ],
    },
    {
      code: `
        function Counter() {
          let [count, setCount] = useState(0);
          let increment = useCustomHook();

          useEffect(() => {
            let id = setInterval(() => {
              setCount(count => count + increment);
            }, 1000);
            return () => clearInterval(id);
          }, []);

          return <h1>{count}</h1>;
        }
      `,
      output: `
        function Counter() {
          let [count, setCount] = useState(0);
          let increment = useCustomHook();

          useEffect(() => {
            let id = setInterval(() => {
              setCount(count => count + increment);
            }, 1000);
            return () => clearInterval(id);
          }, [increment]);

          return <h1>{count}</h1>;
        }
      `,
      // This intentionally doesn't show the reducer message
      // because we don't know if it's safe for it to close over a value.
      // We only show it for state variables (and possibly props).
      errors: [
        "React Hook useEffect has a missing dependency: 'increment'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      code: `
        function Counter({ step }) {
          let [count, setCount] = useState(0);

          function increment(x) {
            return x + step;
          }

          useEffect(() => {
            let id = setInterval(() => {
              setCount(count => increment(count));
            }, 1000);
            return () => clearInterval(id);
          }, []);

          return <h1>{count}</h1>;
        }
      `,
      output: `
        function Counter({ step }) {
          let [count, setCount] = useState(0);

          function increment(x) {
            return x + step;
          }

          useEffect(() => {
            let id = setInterval(() => {
              setCount(count => increment(count));
            }, 1000);
            return () => clearInterval(id);
          }, [increment]);

          return <h1>{count}</h1>;
        }
      `,
      // This intentionally doesn't show the reducer message
      // because we don't know if it's safe for it to close over a value.
      // We only show it for state variables (and possibly props).
      errors: [
        "React Hook useEffect has a missing dependency: 'increment'. " +
          'Either include it or remove the dependency array.',
      ],
    },
    {
      code: `
        function Counter({ step }) {
          let [count, setCount] = useState(0);

          function increment(x) {
            return x + step;
          }

          useEffect(() => {
            let id = setInterval(() => {
              setCount(count => increment(count));
            }, 1000);
            return () => clearInterval(id);
          }, [increment]);

          return <h1>{count}</h1>;
        }
      `,
      output: `
        function Counter({ step }) {
          let [count, setCount] = useState(0);

          function increment(x) {
            return x + step;
          }

          useEffect(() => {
            let id = setInterval(() => {
              setCount(count => increment(count));
            }, 1000);
            return () => clearInterval(id);
          }, [increment]);

          return <h1>{count}</h1>;
        }
      `,
      errors: [
        `The 'increment' function makes the dependencies of useEffect Hook ` +
          `(at line 14) change on every render. Move it inside the useEffect callback. ` +
          `Alternatively, wrap the \'increment\' definition into its own ` +
          `useCallback() Hook.`,
      ],
    },
    {
      code: `
        function Counter({ increment }) {
          let [count, setCount] = useState(0);

          useEffect(() => {
            let id = setInterval(() => {
              setCount(count => count + increment);
            }, 1000);
            return () => clearInterval(id);
          }, []);

          return <h1>{count}</h1>;
        }
      `,
      output: `
        function Counter({ increment }) {
          let [count, setCount] = useState(0);

          useEffect(() => {
            let id = setInterval(() => {
              setCount(count => count + increment);
            }, 1000);
            return () => clearInterval(id);
          }, [increment]);

          return <h1>{count}</h1>;
        }
      `,
      errors: [
        "React Hook useEffect has a missing dependency: 'increment'. " +
          'Either include it or remove the dependency array. ' +
          `If 'setCount' needs the current value of 'increment', ` +
          `you can also switch to useReducer instead of useState and read 'increment' in the reducer.`,
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
    {
      // Regression test for a crash
      code: `
        function Podcasts() {
          useEffect(() => {
            alert(podcasts);
          }, []);
          let [podcasts, setPodcasts] = useState(null);
        }
      `,
      // Note: this autofix is shady because
      // the variable is used before declaration.
      // TODO: Maybe we can catch those fixes and not autofix.
      output: `
        function Podcasts() {
          useEffect(() => {
            alert(podcasts);
          }, [podcasts]);
          let [podcasts, setPodcasts] = useState(null);
        }
      `,
      errors: [
        `React Hook useEffect has a missing dependency: 'podcasts'. ` +
          `Either include it or remove the dependency array.`,
      ],
    },
    {
      code: `
        function Podcasts({ fetchPodcasts, id }) {
          let [podcasts, setPodcasts] = useState(null);
          useEffect(() => {
            fetchPodcasts(id).then(setPodcasts);
          }, [id]);
        }
      `,
      output: `
        function Podcasts({ fetchPodcasts, id }) {
          let [podcasts, setPodcasts] = useState(null);
          useEffect(() => {
            fetchPodcasts(id).then(setPodcasts);
          }, [fetchPodcasts, id]);
        }
      `,
      errors: [
        `React Hook useEffect has a missing dependency: 'fetchPodcasts'. ` +
          `Either include it or remove the dependency array. ` +
          `If 'fetchPodcasts' changes too often, ` +
          `find the parent component that defines it and wrap that definition in useCallback.`,
      ],
    },
    {
      code: `
        function Podcasts({ api: { fetchPodcasts }, id }) {
          let [podcasts, setPodcasts] = useState(null);
          useEffect(() => {
            fetchPodcasts(id).then(setPodcasts);
          }, [id]);
        }
      `,
      output: `
        function Podcasts({ api: { fetchPodcasts }, id }) {
          let [podcasts, setPodcasts] = useState(null);
          useEffect(() => {
            fetchPodcasts(id).then(setPodcasts);
          }, [fetchPodcasts, id]);
        }
      `,
      errors: [
        `React Hook useEffect has a missing dependency: 'fetchPodcasts'. ` +
          `Either include it or remove the dependency array. ` +
          `If 'fetchPodcasts' changes too often, ` +
          `find the parent component that defines it and wrap that definition in useCallback.`,
      ],
    },
    {
      code: `
        function Podcasts({ fetchPodcasts, fetchPodcasts2, id }) {
          let [podcasts, setPodcasts] = useState(null);
          useEffect(() => {
            setTimeout(() => {
              console.log(id);
              fetchPodcasts(id).then(setPodcasts);
              fetchPodcasts2(id).then(setPodcasts);
            });
          }, [id]);
        }
      `,
      output: `
        function Podcasts({ fetchPodcasts, fetchPodcasts2, id }) {
          let [podcasts, setPodcasts] = useState(null);
          useEffect(() => {
            setTimeout(() => {
              console.log(id);
              fetchPodcasts(id).then(setPodcasts);
              fetchPodcasts2(id).then(setPodcasts);
            });
          }, [fetchPodcasts, fetchPodcasts2, id]);
        }
      `,
      errors: [
        `React Hook useEffect has missing dependencies: 'fetchPodcasts' and 'fetchPodcasts2'. ` +
          `Either include them or remove the dependency array. ` +
          `If 'fetchPodcasts' changes too often, ` +
          `find the parent component that defines it and wrap that definition in useCallback.`,
      ],
    },
    {
      code: `
        function Podcasts({ fetchPodcasts, id }) {
          let [podcasts, setPodcasts] = useState(null);
          useEffect(() => {
            console.log(fetchPodcasts);
            fetchPodcasts(id).then(setPodcasts);
          }, [id]);
        }
      `,
      output: `
        function Podcasts({ fetchPodcasts, id }) {
          let [podcasts, setPodcasts] = useState(null);
          useEffect(() => {
            console.log(fetchPodcasts);
            fetchPodcasts(id).then(setPodcasts);
          }, [fetchPodcasts, id]);
        }
      `,
      errors: [
        `React Hook useEffect has a missing dependency: 'fetchPodcasts'. ` +
          `Either include it or remove the dependency array. ` +
          `If 'fetchPodcasts' changes too often, ` +
          `find the parent component that defines it and wrap that definition in useCallback.`,
      ],
    },
    {
      // The mistake here is that it was moved inside the effect
      // so it can't be referenced in the deps array.
      code: `
        function Thing() {
          useEffect(() => {
            const fetchData = async () => {};
            fetchData();
          }, [fetchData]);
        }
      `,
      output: `
        function Thing() {
          useEffect(() => {
            const fetchData = async () => {};
            fetchData();
          }, []);
        }
      `,
      errors: [
        `React Hook useEffect has an unnecessary dependency: 'fetchData'. ` +
          `Either exclude it or remove the dependency array.`,
      ],
    },
    {
      code: `
        function Hello() {
          const [state, setState] = useState(0);
          useEffect(() => {
            setState({});
          });
        }
      `,
      output: `
        function Hello() {
          const [state, setState] = useState(0);
          useEffect(() => {
            setState({});
          }, []);
        }
      `,
      errors: [
        `React Hook useEffect contains a call to 'setState'. ` +
          `Without a list of dependencies, this can lead to an infinite chain of updates. ` +
          `To fix this, pass [] as a second argument to the useEffect Hook.`,
      ],
    },
    {
      code: `
        function Hello() {
          const [data, setData] = useState(0);
          useEffect(() => {
            fetchData.then(setData);
          });
        }
      `,
      output: `
        function Hello() {
          const [data, setData] = useState(0);
          useEffect(() => {
            fetchData.then(setData);
          }, []);
        }
      `,
      errors: [
        `React Hook useEffect contains a call to 'setData'. ` +
          `Without a list of dependencies, this can lead to an infinite chain of updates. ` +
          `To fix this, pass [] as a second argument to the useEffect Hook.`,
      ],
    },
    {
      code: `
        function Hello({ country }) {
          const [data, setData] = useState(0);
          useEffect(() => {
            fetchData(country).then(setData);
          });
        }
      `,
      output: `
        function Hello({ country }) {
          const [data, setData] = useState(0);
          useEffect(() => {
            fetchData(country).then(setData);
          }, [country]);
        }
      `,
      errors: [
        `React Hook useEffect contains a call to 'setData'. ` +
          `Without a list of dependencies, this can lead to an infinite chain of updates. ` +
          `To fix this, pass [country] as a second argument to the useEffect Hook.`,
      ],
    },
    {
      code: `
        function Hello({ prop1, prop2 }) {
          const [state, setState] = useState(0);
          useEffect(() => {
            if (prop1) {
              setState(prop2);
            }
          });
        }
      `,
      output: `
        function Hello({ prop1, prop2 }) {
          const [state, setState] = useState(0);
          useEffect(() => {
            if (prop1) {
              setState(prop2);
            }
          }, [prop1, prop2]);
        }
      `,
      errors: [
        `React Hook useEffect contains a call to 'setState'. ` +
          `Without a list of dependencies, this can lead to an infinite chain of updates. ` +
          `To fix this, pass [prop1, prop2] as a second argument to the useEffect Hook.`,
      ],
    },
    {
      code: `
        function Thing() {
          useEffect(async () => {}, []);
        }
      `,
      output: `
        function Thing() {
          useEffect(async () => {}, []);
        }
      `,
      errors: [
        `Effect callbacks are synchronous to prevent race conditions. ` +
          `Put the async function inside:\n\n` +
          'useEffect(() => {\n' +
          '  async function fetchData() {\n' +
          '    // You can await here\n' +
          '    const response = await MyAPI.getData(someId);\n' +
          '    // ...\n' +
          '  }\n' +
          '  fetchData();\n' +
          `}, [someId]); // Or [] if effect doesn't need props or state\n\n` +
          'Learn more about data fetching with Hooks: https://fb.me/react-hooks-data-fetching',
      ],
    },
    {
      code: `
        function Thing() {
          useEffect(async () => {});
        }
      `,
      output: `
        function Thing() {
          useEffect(async () => {});
        }
      `,
      errors: [
        `Effect callbacks are synchronous to prevent race conditions. ` +
          `Put the async function inside:\n\n` +
          'useEffect(() => {\n' +
          '  async function fetchData() {\n' +
          '    // You can await here\n' +
          '    const response = await MyAPI.getData(someId);\n' +
          '    // ...\n' +
          '  }\n' +
          '  fetchData();\n' +
          `}, [someId]); // Or [] if effect doesn't need props or state\n\n` +
          'Learn more about data fetching with Hooks: https://fb.me/react-hooks-data-fetching',
      ],
    },
    {
      code: `
        function Example() {
          const foo = useCallback(() => {
            foo();
          }, [foo]);
        }
      `,
      output: `
        function Example() {
          const foo = useCallback(() => {
            foo();
          }, []);
        }
      `,
      errors: [
        "React Hook useCallback has an unnecessary dependency: 'foo'. " +
          'Either exclude it or remove the dependency array.',
      ],
    },
    {
      code: `
        function Example({ prop }) {
          const foo = useCallback(() => {
            prop.hello(foo);
          }, [foo]);
          const bar = useCallback(() => {
            foo();
          }, [foo]);
        }
      `,
      output: `
        function Example({ prop }) {
          const foo = useCallback(() => {
            prop.hello(foo);
          }, [prop]);
          const bar = useCallback(() => {
            foo();
          }, [foo]);
        }
      `,
      errors: [
        "React Hook useCallback has a missing dependency: 'prop'. " +
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
