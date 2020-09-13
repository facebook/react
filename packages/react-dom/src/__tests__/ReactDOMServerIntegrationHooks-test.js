/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

/* eslint-disable no-func-assign */

'use strict';

const ReactDOMServerIntegrationUtils = require('./utils/ReactDOMServerIntegrationTestUtils');

let React;
let ReactDOM;
let ReactDOMServer;
let ReactTestUtils;
let act;
let Scheduler;
let useState;
let useReducer;
let useEffect;
let useContext;
let useCallback;
let useMemo;
let useRef;
let useImperativeHandle;
let useLayoutEffect;
let useDebugValue;
let useOpaqueIdentifier;
let forwardRef;
let yieldedValues;
let yieldValue;
let clearYields;

function initModules() {
  // Reset warning cache.
  jest.resetModuleRegistry();

  React = require('react');
  ReactDOM = require('react-dom');
  ReactDOMServer = require('react-dom/server');
  ReactTestUtils = require('react-dom/test-utils');
  Scheduler = require('scheduler');
  act = ReactTestUtils.unstable_concurrentAct;
  useState = React.useState;
  useReducer = React.useReducer;
  useEffect = React.useEffect;
  useContext = React.useContext;
  useCallback = React.useCallback;
  useMemo = React.useMemo;
  useRef = React.useRef;
  useDebugValue = React.useDebugValue;
  useImperativeHandle = React.useImperativeHandle;
  useLayoutEffect = React.useLayoutEffect;
  useOpaqueIdentifier = React.unstable_useOpaqueIdentifier;
  forwardRef = React.forwardRef;

  yieldedValues = [];
  yieldValue = value => {
    yieldedValues.push(value);
  };
  clearYields = () => {
    const ret = yieldedValues;
    yieldedValues = [];
    return ret;
  };

  // Make them available to the helpers.
  return {
    ReactDOM,
    ReactDOMServer,
    ReactTestUtils,
  };
}

const {
  resetModules,
  itRenders,
  itThrowsWhenRendering,
  serverRender,
  streamRender,
  clientCleanRender,
  clientRenderOnServerString,
} = ReactDOMServerIntegrationUtils(initModules);

describe('ReactDOMServerHooks', () => {
  beforeEach(() => {
    resetModules();
  });

  function Text(props) {
    yieldValue(props.text);
    return <span>{props.text}</span>;
  }

  describe('useState', () => {
    itRenders('basic render', async render => {
      function Counter(props) {
        const [count] = useState(0);
        return <span>Count: {count}</span>;
      }

      const domNode = await render(<Counter />);
      expect(domNode.textContent).toEqual('Count: 0');
    });

    itRenders('lazy state initialization', async render => {
      function Counter(props) {
        const [count] = useState(() => {
          return 0;
        });
        return <span>Count: {count}</span>;
      }

      const domNode = await render(<Counter />);
      expect(domNode.textContent).toEqual('Count: 0');
    });

    it('does not trigger a re-renders when updater is invoked outside current render function', async () => {
      function UpdateCount({setCount, count, children}) {
        if (count < 3) {
          setCount(c => c + 1);
        }
        return <span>{children}</span>;
      }
      function Counter() {
        const [count, setCount] = useState(0);
        return (
          <div>
            <UpdateCount setCount={setCount} count={count}>
              Count: {count}
            </UpdateCount>
          </div>
        );
      }

      const domNode = await serverRender(<Counter />);
      expect(domNode.textContent).toEqual('Count: 0');
    });

    itThrowsWhenRendering(
      'if used inside a class component',
      async render => {
        class Counter extends React.Component {
          render() {
            const [count] = useState(0);
            return <Text text={count} />;
          }
        }

        return render(<Counter />);
      },
      'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
        ' one of the following reasons:\n' +
        '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
        '2. You might be breaking the Rules of Hooks\n' +
        '3. You might have more than one copy of React in the same app\n' +
        'See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.',
    );

    itRenders('multiple times when an updater is called', async render => {
      function Counter() {
        const [count, setCount] = useState(0);
        if (count < 12) {
          setCount(c => c + 1);
          setCount(c => c + 1);
          setCount(c => c + 1);
        }
        return <Text text={'Count: ' + count} />;
      }

      const domNode = await render(<Counter />);
      expect(domNode.textContent).toEqual('Count: 12');
    });

    itRenders('until there are no more new updates', async render => {
      function Counter() {
        const [count, setCount] = useState(0);
        if (count < 3) {
          setCount(count + 1);
        }
        return <span>Count: {count}</span>;
      }

      const domNode = await render(<Counter />);
      expect(domNode.textContent).toEqual('Count: 3');
    });

    itThrowsWhenRendering(
      'after too many iterations',
      async render => {
        function Counter() {
          const [count, setCount] = useState(0);
          setCount(count + 1);
          return <span>{count}</span>;
        }
        return render(<Counter />);
      },
      'Too many re-renders. React limits the number of renders to prevent ' +
        'an infinite loop.',
    );
  });

  describe('useReducer', () => {
    itRenders('with initial state', async render => {
      function reducer(state, action) {
        return action === 'increment' ? state + 1 : state;
      }
      function Counter() {
        const [count] = useReducer(reducer, 0);
        yieldValue('Render: ' + count);
        return <Text text={count} />;
      }

      const domNode = await render(<Counter />);

      expect(clearYields()).toEqual(['Render: 0', 0]);
      expect(domNode.tagName).toEqual('SPAN');
      expect(domNode.textContent).toEqual('0');
    });

    itRenders('lazy initialization', async render => {
      function reducer(state, action) {
        return action === 'increment' ? state + 1 : state;
      }
      function Counter() {
        const [count] = useReducer(reducer, 0, c => c + 1);
        yieldValue('Render: ' + count);
        return <Text text={count} />;
      }

      const domNode = await render(<Counter />);

      expect(clearYields()).toEqual(['Render: 1', 1]);
      expect(domNode.tagName).toEqual('SPAN');
      expect(domNode.textContent).toEqual('1');
    });

    itRenders(
      'multiple times when updates happen during the render phase',
      async render => {
        function reducer(state, action) {
          return action === 'increment' ? state + 1 : state;
        }
        function Counter() {
          const [count, dispatch] = useReducer(reducer, 0);
          if (count < 3) {
            dispatch('increment');
          }
          yieldValue('Render: ' + count);
          return <Text text={count} />;
        }

        const domNode = await render(<Counter />);

        expect(clearYields()).toEqual([
          'Render: 0',
          'Render: 1',
          'Render: 2',
          'Render: 3',
          3,
        ]);
        expect(domNode.tagName).toEqual('SPAN');
        expect(domNode.textContent).toEqual('3');
      },
    );

    itRenders(
      'using reducer passed at time of render, not time of dispatch',
      async render => {
        // This test is a bit contrived but it demonstrates a subtle edge case.

        // Reducer A increments by 1. Reducer B increments by 10.
        function reducerA(state, action) {
          switch (action) {
            case 'increment':
              return state + 1;
            case 'reset':
              return 0;
          }
        }
        function reducerB(state, action) {
          switch (action) {
            case 'increment':
              return state + 10;
            case 'reset':
              return 0;
          }
        }

        function Counter() {
          const [reducer, setReducer] = useState(() => reducerA);
          const [count, dispatch] = useReducer(reducer, 0);
          if (count < 20) {
            dispatch('increment');
            // Swap reducers each time we increment
            if (reducer === reducerA) {
              setReducer(() => reducerB);
            } else {
              setReducer(() => reducerA);
            }
          }
          yieldValue('Render: ' + count);
          return <Text text={count} />;
        }

        const domNode = await render(<Counter />);

        expect(clearYields()).toEqual([
          // The count should increase by alternating amounts of 10 and 1
          // until we reach 21.
          'Render: 0',
          'Render: 10',
          'Render: 11',
          'Render: 21',
          21,
        ]);
        expect(domNode.tagName).toEqual('SPAN');
        expect(domNode.textContent).toEqual('21');
      },
    );
  });

  describe('useMemo', () => {
    itRenders('basic render', async render => {
      function CapitalizedText(props) {
        const text = props.text;
        const capitalizedText = useMemo(() => {
          yieldValue(`Capitalize '${text}'`);
          return text.toUpperCase();
        }, [text]);
        return <Text text={capitalizedText} />;
      }

      const domNode = await render(<CapitalizedText text="hello" />);
      expect(clearYields()).toEqual(["Capitalize 'hello'", 'HELLO']);
      expect(domNode.tagName).toEqual('SPAN');
      expect(domNode.textContent).toEqual('HELLO');
    });

    itRenders('if no inputs are provided', async render => {
      function LazyCompute(props) {
        const computed = useMemo(props.compute);
        return <Text text={computed} />;
      }

      function computeA() {
        yieldValue('compute A');
        return 'A';
      }

      const domNode = await render(<LazyCompute compute={computeA} />);
      expect(clearYields()).toEqual(['compute A', 'A']);
      expect(domNode.tagName).toEqual('SPAN');
      expect(domNode.textContent).toEqual('A');
    });

    itRenders(
      'multiple times when updates happen during the render phase',
      async render => {
        function CapitalizedText(props) {
          const [text, setText] = useState(props.text);
          const capitalizedText = useMemo(() => {
            yieldValue(`Capitalize '${text}'`);
            return text.toUpperCase();
          }, [text]);

          if (text === 'hello') {
            setText('hello, world.');
          }
          return <Text text={capitalizedText} />;
        }

        const domNode = await render(<CapitalizedText text="hello" />);
        expect(clearYields()).toEqual([
          "Capitalize 'hello'",
          "Capitalize 'hello, world.'",
          'HELLO, WORLD.',
        ]);
        expect(domNode.tagName).toEqual('SPAN');
        expect(domNode.textContent).toEqual('HELLO, WORLD.');
      },
    );

    itRenders(
      'should only invoke the memoized function when the inputs change',
      async render => {
        function CapitalizedText(props) {
          const [text, setText] = useState(props.text);
          const [count, setCount] = useState(0);
          const capitalizedText = useMemo(() => {
            yieldValue(`Capitalize '${text}'`);
            return text.toUpperCase();
          }, [text]);

          yieldValue(count);

          if (count < 3) {
            setCount(count + 1);
          }

          if (text === 'hello' && count === 2) {
            setText('hello, world.');
          }
          return <Text text={capitalizedText} />;
        }

        const domNode = await render(<CapitalizedText text="hello" />);
        expect(clearYields()).toEqual([
          "Capitalize 'hello'",
          0,
          1,
          2,
          // `capitalizedText` only recomputes when the text has changed
          "Capitalize 'hello, world.'",
          3,
          'HELLO, WORLD.',
        ]);
        expect(domNode.tagName).toEqual('SPAN');
        expect(domNode.textContent).toEqual('HELLO, WORLD.');
      },
    );

    itRenders('with a warning for useState inside useMemo', async render => {
      function App() {
        useMemo(() => {
          useState();
          return 0;
        });
        return 'hi';
      }

      const domNode = await render(<App />, 1);
      expect(domNode.textContent).toEqual('hi');
    });

    itThrowsWhenRendering(
      'with a warning for useRef inside useReducer',
      async render => {
        function App() {
          const [value, dispatch] = useReducer((state, action) => {
            useRef(0);
            return state + 1;
          }, 0);
          if (value === 0) {
            dispatch();
          }
          return value;
        }

        const domNode = await render(<App />, 1);
        expect(domNode.textContent).toEqual('1');
      },
      'Rendered more hooks than during the previous render',
    );

    itRenders('with a warning for useRef inside useState', async render => {
      function App() {
        const [value] = useState(() => {
          useRef(0);
          return 0;
        });
        return value;
      }

      const domNode = await render(<App />, 1);
      expect(domNode.textContent).toEqual('0');
    });
  });

  describe('useRef', () => {
    itRenders('basic render', async render => {
      function Counter(props) {
        const count = useRef(0);
        return <span>Count: {count.current}</span>;
      }

      const domNode = await render(<Counter />);
      expect(domNode.textContent).toEqual('Count: 0');
    });

    itRenders(
      'multiple times when updates happen during the render phase',
      async render => {
        function Counter(props) {
          const [count, setCount] = useState(0);
          const ref = useRef(count);

          if (count < 3) {
            const newCount = count + 1;

            ref.current = newCount;
            setCount(newCount);
          }

          yieldValue(count);

          return <span>Count: {ref.current}</span>;
        }

        const domNode = await render(<Counter />);
        expect(clearYields()).toEqual([0, 1, 2, 3]);
        expect(domNode.textContent).toEqual('Count: 3');
      },
    );

    itRenders(
      'always return the same reference through multiple renders',
      async render => {
        let firstRef = null;
        function Counter(props) {
          const [count, setCount] = useState(0);
          const ref = useRef(count);
          if (firstRef === null) {
            firstRef = ref;
          } else if (firstRef !== ref) {
            throw new Error('should never change');
          }

          if (count < 3) {
            setCount(count + 1);
          } else {
            firstRef = null;
          }

          yieldValue(count);

          return <span>Count: {ref.current}</span>;
        }

        const domNode = await render(<Counter />);
        expect(clearYields()).toEqual([0, 1, 2, 3]);
        expect(domNode.textContent).toEqual('Count: 0');
      },
    );
  });

  describe('useEffect', () => {
    const yields = [];
    itRenders('should ignore effects on the server', async render => {
      function Counter(props) {
        useEffect(() => {
          yieldValue('invoked on client');
        });
        return <Text text={'Count: ' + props.count} />;
      }

      const domNode = await render(<Counter count={0} />);
      yields.push(clearYields());
      expect(domNode.tagName).toEqual('SPAN');
      expect(domNode.textContent).toEqual('Count: 0');
    });

    it('verifies yields in order', () => {
      expect(yields).toEqual([
        ['Count: 0'], // server render
        ['Count: 0'], // server stream
        ['Count: 0', 'invoked on client'], // clean render
        ['Count: 0', 'invoked on client'], // hydrated render
        // nothing yielded for bad markup
      ]);
    });
  });

  describe('useCallback', () => {
    itRenders('should not invoke the passed callbacks', async render => {
      function Counter(props) {
        useCallback(() => {
          yieldValue('should not be invoked');
        });
        return <Text text={'Count: ' + props.count} />;
      }
      const domNode = await render(<Counter count={0} />);
      expect(clearYields()).toEqual(['Count: 0']);
      expect(domNode.tagName).toEqual('SPAN');
      expect(domNode.textContent).toEqual('Count: 0');
    });

    itRenders('should support render time callbacks', async render => {
      function Counter(props) {
        const renderCount = useCallback(increment => {
          return 'Count: ' + (props.count + increment);
        });
        return <Text text={renderCount(3)} />;
      }
      const domNode = await render(<Counter count={2} />);
      expect(clearYields()).toEqual(['Count: 5']);
      expect(domNode.tagName).toEqual('SPAN');
      expect(domNode.textContent).toEqual('Count: 5');
    });

    itRenders(
      'should only change the returned reference when the inputs change',
      async render => {
        function CapitalizedText(props) {
          const [text, setText] = useState(props.text);
          const [count, setCount] = useState(0);
          const capitalizeText = useCallback(() => text.toUpperCase(), [text]);
          yieldValue(capitalizeText);
          if (count < 3) {
            setCount(count + 1);
          }
          if (text === 'hello' && count === 2) {
            setText('hello, world.');
          }
          return <Text text={capitalizeText()} />;
        }

        const domNode = await render(<CapitalizedText text="hello" />);
        const [first, second, third, fourth, result] = clearYields();
        expect(first).toBe(second);
        expect(second).toBe(third);
        expect(third).not.toBe(fourth);
        expect(result).toEqual('HELLO, WORLD.');
        expect(domNode.tagName).toEqual('SPAN');
        expect(domNode.textContent).toEqual('HELLO, WORLD.');
      },
    );
  });

  describe('useImperativeHandle', () => {
    it('should not be invoked on the server', async () => {
      function Counter(props, ref) {
        useImperativeHandle(ref, () => {
          throw new Error('should not be invoked');
        });
        return <Text text={props.label + ': ' + ref.current} />;
      }
      Counter = forwardRef(Counter);
      const counter = React.createRef();
      counter.current = 0;
      const domNode = await serverRender(
        <Counter label="Count" ref={counter} />,
      );
      expect(clearYields()).toEqual(['Count: 0']);
      expect(domNode.tagName).toEqual('SPAN');
      expect(domNode.textContent).toEqual('Count: 0');
    });
  });

  describe('useLayoutEffect', () => {
    it('should warn when invoked during render', async () => {
      function Counter() {
        useLayoutEffect(() => {
          throw new Error('should not be invoked');
        });

        return <Text text="Count: 0" />;
      }
      const domNode = await serverRender(<Counter />, 1);
      expect(clearYields()).toEqual(['Count: 0']);
      expect(domNode.tagName).toEqual('SPAN');
      expect(domNode.textContent).toEqual('Count: 0');
    });
  });

  describe('useContext', () => {
    itThrowsWhenRendering(
      'if used inside a class component',
      async render => {
        const Context = React.createContext({}, () => {});
        class Counter extends React.Component {
          render() {
            const [count] = useContext(Context);
            return <Text text={count} />;
          }
        }

        return render(<Counter />);
      },
      'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
        ' one of the following reasons:\n' +
        '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
        '2. You might be breaking the Rules of Hooks\n' +
        '3. You might have more than one copy of React in the same app\n' +
        'See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.',
    );
  });

  itRenders(
    'can use the same context multiple times in the same function',
    async render => {
      const Context = React.createContext({foo: 0, bar: 0, baz: 0});

      function Provider(props) {
        return (
          <Context.Provider
            value={{foo: props.foo, bar: props.bar, baz: props.baz}}>
            {props.children}
          </Context.Provider>
        );
      }

      function FooAndBar() {
        const {foo} = useContext(Context);
        const {bar} = useContext(Context);
        return <Text text={`Foo: ${foo}, Bar: ${bar}`} />;
      }

      function Baz() {
        const {baz} = useContext(Context);
        return <Text text={'Baz: ' + baz} />;
      }

      class Indirection extends React.Component {
        render() {
          return this.props.children;
        }
      }

      function App(props) {
        return (
          <div>
            <Provider foo={props.foo} bar={props.bar} baz={props.baz}>
              <Indirection>
                <Indirection>
                  <FooAndBar />
                </Indirection>
                <Indirection>
                  <Baz />
                </Indirection>
              </Indirection>
            </Provider>
          </div>
        );
      }

      const domNode = await render(<App foo={1} bar={3} baz={5} />);
      expect(clearYields()).toEqual(['Foo: 1, Bar: 3', 'Baz: 5']);
      expect(domNode.childNodes.length).toBe(2);
      expect(domNode.firstChild.tagName).toEqual('SPAN');
      expect(domNode.firstChild.textContent).toEqual('Foo: 1, Bar: 3');
      expect(domNode.lastChild.tagName).toEqual('SPAN');
      expect(domNode.lastChild.textContent).toEqual('Baz: 5');
    },
  );

  itRenders('warns when bitmask is passed to useContext', async render => {
    const Context = React.createContext('Hi');

    function Foo() {
      return <span>{useContext(Context, 1)}</span>;
    }

    const domNode = await render(<Foo />, 1);
    expect(domNode.textContent).toBe('Hi');
  });

  describe('useDebugValue', () => {
    itRenders('is a noop', async render => {
      function Counter(props) {
        const debugValue = useDebugValue(123);
        return <Text text={typeof debugValue} />;
      }

      const domNode = await render(<Counter />);
      expect(domNode.textContent).toEqual('undefined');
    });
  });

  describe('readContext', () => {
    function readContext(Context, observedBits) {
      const dispatcher =
        React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
          .ReactCurrentDispatcher.current;
      return dispatcher.readContext(Context, observedBits);
    }

    itRenders(
      'can read the same context multiple times in the same function',
      async render => {
        const Context = React.createContext(
          {foo: 0, bar: 0, baz: 0},
          (a, b) => {
            let result = 0;
            if (a.foo !== b.foo) {
              result |= 0b001;
            }
            if (a.bar !== b.bar) {
              result |= 0b010;
            }
            if (a.baz !== b.baz) {
              result |= 0b100;
            }
            return result;
          },
        );

        function Provider(props) {
          return (
            <Context.Provider
              value={{foo: props.foo, bar: props.bar, baz: props.baz}}>
              {props.children}
            </Context.Provider>
          );
        }

        function FooAndBar() {
          const {foo} = readContext(Context, 0b001);
          const {bar} = readContext(Context, 0b010);
          return <Text text={`Foo: ${foo}, Bar: ${bar}`} />;
        }

        function Baz() {
          const {baz} = readContext(Context, 0b100);
          return <Text text={'Baz: ' + baz} />;
        }

        class Indirection extends React.Component {
          shouldComponentUpdate() {
            return false;
          }
          render() {
            return this.props.children;
          }
        }

        function App(props) {
          return (
            <div>
              <Provider foo={props.foo} bar={props.bar} baz={props.baz}>
                <Indirection>
                  <Indirection>
                    <FooAndBar />
                  </Indirection>
                  <Indirection>
                    <Baz />
                  </Indirection>
                </Indirection>
              </Provider>
            </div>
          );
        }

        const domNode = await render(<App foo={1} bar={3} baz={5} />);
        expect(clearYields()).toEqual(['Foo: 1, Bar: 3', 'Baz: 5']);
        expect(domNode.childNodes.length).toBe(2);
        expect(domNode.firstChild.tagName).toEqual('SPAN');
        expect(domNode.firstChild.textContent).toEqual('Foo: 1, Bar: 3');
        expect(domNode.lastChild.tagName).toEqual('SPAN');
        expect(domNode.lastChild.textContent).toEqual('Baz: 5');
      },
    );

    itRenders('with a warning inside useMemo and useReducer', async render => {
      const Context = React.createContext(42);

      function ReadInMemo(props) {
        const count = React.useMemo(() => readContext(Context), []);
        return <Text text={count} />;
      }

      function ReadInReducer(props) {
        const [count, dispatch] = React.useReducer(() => readContext(Context));
        if (count !== 42) {
          dispatch();
        }
        return <Text text={count} />;
      }

      const domNode1 = await render(<ReadInMemo />, 1);
      expect(domNode1.textContent).toEqual('42');

      const domNode2 = await render(<ReadInReducer />, 1);
      expect(domNode2.textContent).toEqual('42');
    });
  });

  it('renders successfully after a component using hooks throws an error', () => {
    function ThrowingComponent() {
      const [value, dispatch] = useReducer((state, action) => {
        return state + 1;
      }, 0);

      // throw an error if the count gets too high during the re-render phase
      if (value >= 3) {
        throw new Error('Error from ThrowingComponent');
      } else {
        // dispatch to trigger a re-render of the component
        dispatch();
      }

      return <div>{value}</div>;
    }

    function NonThrowingComponent() {
      const [count] = useState(0);
      return <div>{count}</div>;
    }

    // First, render a component that will throw an error during a re-render triggered
    // by a dispatch call.
    expect(() => ReactDOMServer.renderToString(<ThrowingComponent />)).toThrow(
      'Error from ThrowingComponent',
    );

    // Next, assert that we can render a function component using hooks immediately
    // after an error occurred, which indictates the internal hooks state has been
    // reset.
    const container = document.createElement('div');
    container.innerHTML = ReactDOMServer.renderToString(
      <NonThrowingComponent />,
    );
    expect(container.children[0].textContent).toEqual('0');
  });

  describe('useOpaqueIdentifier', () => {
    // @gate experimental
    it('generates unique ids for server string render', async () => {
      function App(props) {
        const idOne = useOpaqueIdentifier();
        const idTwo = useOpaqueIdentifier();
        return (
          <div>
            <div aria-labelledby={idOne} />
            <div id={idOne} />
            <span aria-labelledby={idTwo} />
            <span id={idTwo} />
          </div>
        );
      }

      const domNode = await serverRender(<App />);
      expect(domNode.children.length).toEqual(4);
      expect(domNode.children[0].getAttribute('aria-labelledby')).toEqual(
        domNode.children[1].getAttribute('id'),
      );
      expect(domNode.children[2].getAttribute('aria-labelledby')).toEqual(
        domNode.children[3].getAttribute('id'),
      );
      expect(domNode.children[0].getAttribute('aria-labelledby')).not.toEqual(
        domNode.children[2].getAttribute('aria-labelledby'),
      );
      expect(
        domNode.children[0].getAttribute('aria-labelledby'),
      ).not.toBeNull();
      expect(
        domNode.children[2].getAttribute('aria-labelledby'),
      ).not.toBeNull();
    });

    // @gate experimental
    it('generates unique ids for server stream render', async () => {
      function App(props) {
        const idOne = useOpaqueIdentifier();
        const idTwo = useOpaqueIdentifier();
        return (
          <div>
            <div aria-labelledby={idOne} />
            <div id={idOne} />
            <span aria-labelledby={idTwo} />
            <span id={idTwo} />
          </div>
        );
      }

      const domNode = await streamRender(<App />);
      expect(domNode.children.length).toEqual(4);
      expect(domNode.children[0].getAttribute('aria-labelledby')).toEqual(
        domNode.children[1].getAttribute('id'),
      );
      expect(domNode.children[2].getAttribute('aria-labelledby')).toEqual(
        domNode.children[3].getAttribute('id'),
      );
      expect(domNode.children[0].getAttribute('aria-labelledby')).not.toEqual(
        domNode.children[2].getAttribute('aria-labelledby'),
      );
      expect(
        domNode.children[0].getAttribute('aria-labelledby'),
      ).not.toBeNull();
      expect(
        domNode.children[2].getAttribute('aria-labelledby'),
      ).not.toBeNull();
    });

    // @gate experimental
    it('generates unique ids for client render', async () => {
      function App(props) {
        const idOne = useOpaqueIdentifier();
        const idTwo = useOpaqueIdentifier();
        return (
          <div>
            <div aria-labelledby={idOne} />
            <div id={idOne} />
            <span aria-labelledby={idTwo} />
            <span id={idTwo} />
          </div>
        );
      }

      const domNode = await clientCleanRender(<App />);
      expect(domNode.children.length).toEqual(4);
      expect(domNode.children[0].getAttribute('aria-labelledby')).toEqual(
        domNode.children[1].getAttribute('id'),
      );
      expect(domNode.children[2].getAttribute('aria-labelledby')).toEqual(
        domNode.children[3].getAttribute('id'),
      );
      expect(domNode.children[0].getAttribute('aria-labelledby')).not.toEqual(
        domNode.children[2].getAttribute('aria-labelledby'),
      );
      expect(
        domNode.children[0].getAttribute('aria-labelledby'),
      ).not.toBeNull();
      expect(
        domNode.children[2].getAttribute('aria-labelledby'),
      ).not.toBeNull();
    });

    // @gate experimental
    it('generates unique ids for client render on good server markup', async () => {
      function App(props) {
        const idOne = useOpaqueIdentifier();
        const idTwo = useOpaqueIdentifier();
        return (
          <div>
            <div aria-labelledby={idOne} />
            <div id={idOne} />
            <span aria-labelledby={idTwo} />
            <span id={idTwo} />
          </div>
        );
      }

      const domNode = await clientRenderOnServerString(<App />);
      expect(domNode.children.length).toEqual(4);
      expect(domNode.children[0].getAttribute('aria-labelledby')).toEqual(
        domNode.children[1].getAttribute('id'),
      );
      expect(domNode.children[2].getAttribute('aria-labelledby')).toEqual(
        domNode.children[3].getAttribute('id'),
      );
      expect(domNode.children[0].getAttribute('aria-labelledby')).not.toEqual(
        domNode.children[2].getAttribute('aria-labelledby'),
      );
      expect(
        domNode.children[0].getAttribute('aria-labelledby'),
      ).not.toBeNull();
      expect(
        domNode.children[2].getAttribute('aria-labelledby'),
      ).not.toBeNull();
    });

    // @gate experimental
    it('useOpaqueIdentifier does not change id even if the component updates during client render', async () => {
      let _setShowId;
      function App() {
        const id = useOpaqueIdentifier();
        const [showId, setShowId] = useState(false);
        _setShowId = setShowId;
        return (
          <div>
            <div aria-labelledby={id} />
            {showId && <div id={id} />}
          </div>
        );
      }

      const domNode = await clientCleanRender(<App />);
      const oldClientId = domNode.children[0].getAttribute('aria-labelledby');

      expect(domNode.children.length).toEqual(1);
      expect(oldClientId).not.toBeNull();

      await act(async () => _setShowId(true));

      expect(domNode.children.length).toEqual(2);
      expect(domNode.children[0].getAttribute('aria-labelledby')).toEqual(
        domNode.children[1].getAttribute('id'),
      );
      expect(domNode.children[0].getAttribute('aria-labelledby')).toEqual(
        oldClientId,
      );
    });

    // @gate experimental
    it('useOpaqueIdentifier identifierPrefix works for server renderer and does not clash', async () => {
      function ChildTwo({id}) {
        return <div id={id}>Child Three</div>;
      }
      function App() {
        const id = useOpaqueIdentifier();
        const idTwo = useOpaqueIdentifier();

        return (
          <div>
            <div aria-labelledby={id}>Child One</div>
            <ChildTwo id={id} />
            <div aria-labelledby={idTwo}>Child Three</div>
            <div id={idTwo}>Child Four</div>
          </div>
        );
      }

      const containerOne = document.createElement('div');
      document.body.append(containerOne);

      containerOne.innerHTML = ReactDOMServer.renderToString(<App />, {
        identifierPrefix: 'one',
      });

      const containerTwo = document.createElement('div');
      document.body.append(containerTwo);

      containerTwo.innerHTML = ReactDOMServer.renderToString(<App />, {
        identifierPrefix: 'two',
      });

      expect(document.body.children.length).toEqual(2);
      const childOne = document.body.children[0];
      const childTwo = document.body.children[1];

      expect(
        childOne.children[0].children[0].getAttribute('aria-labelledby'),
      ).toEqual(childOne.children[0].children[1].getAttribute('id'));
      expect(
        childOne.children[0].children[2].getAttribute('aria-labelledby'),
      ).toEqual(childOne.children[0].children[3].getAttribute('id'));

      expect(
        childOne.children[0].children[0].getAttribute('aria-labelledby'),
      ).not.toEqual(
        childOne.children[0].children[2].getAttribute('aria-labelledby'),
      );

      expect(
        childOne.children[0].children[0]
          .getAttribute('aria-labelledby')
          .startsWith('one'),
      ).toBe(true);
      expect(
        childOne.children[0].children[2]
          .getAttribute('aria-labelledby')
          .includes('one'),
      ).toBe(true);

      expect(
        childTwo.children[0].children[0].getAttribute('aria-labelledby'),
      ).toEqual(childTwo.children[0].children[1].getAttribute('id'));
      expect(
        childTwo.children[0].children[2].getAttribute('aria-labelledby'),
      ).toEqual(childTwo.children[0].children[3].getAttribute('id'));

      expect(
        childTwo.children[0].children[0].getAttribute('aria-labelledby'),
      ).not.toEqual(
        childTwo.children[0].children[2].getAttribute('aria-labelledby'),
      );

      expect(
        childTwo.children[0].children[0]
          .getAttribute('aria-labelledby')
          .startsWith('two'),
      ).toBe(true);
      expect(
        childTwo.children[0].children[2]
          .getAttribute('aria-labelledby')
          .startsWith('two'),
      ).toBe(true);
    });

    // @gate experimental
    it('useOpaqueIdentifier identifierPrefix works for multiple reads on a streaming server renderer', async () => {
      function ChildTwo() {
        const id = useOpaqueIdentifier();

        return <div id={id}>Child Two</div>;
      }

      function App() {
        const id = useOpaqueIdentifier();

        return (
          <>
            <div id={id}>Child One</div>
            <ChildTwo />
            <div aria-labelledby={id}>Aria One</div>
          </>
        );
      }

      const container = document.createElement('div');
      document.body.append(container);

      const streamOne = ReactDOMServer.renderToNodeStream(<App />, {
        identifierPrefix: 'one',
      }).setEncoding('utf8');
      const streamTwo = ReactDOMServer.renderToNodeStream(<App />, {
        identifierPrefix: 'two',
      }).setEncoding('utf8');

      const streamOneIsDone = new Promise((resolve, reject) => {
        streamOne.on('end', () => resolve());
        streamOne.on('error', e => reject(e));
      });
      const streamTwoIsDone = new Promise((resolve, reject) => {
        streamTwo.on('end', () => resolve());
        streamTwo.on('error', e => reject(e));
      });

      const containerOne = document.createElement('div');
      const containerTwo = document.createElement('div');

      streamOne._read(10);
      streamTwo._read(10);

      containerOne.innerHTML = streamOne.read();
      containerTwo.innerHTML = streamTwo.read();

      expect(containerOne.children[0].getAttribute('id')).not.toEqual(
        containerOne.children[1].getAttribute('id'),
      );
      expect(containerTwo.children[0].getAttribute('id')).not.toEqual(
        containerTwo.children[1].getAttribute('id'),
      );
      expect(containerOne.children[0].getAttribute('id')).not.toEqual(
        containerTwo.children[0].getAttribute('id'),
      );
      expect(containerOne.children[0].getAttribute('id').includes('one')).toBe(
        true,
      );
      expect(containerOne.children[1].getAttribute('id').includes('one')).toBe(
        true,
      );
      expect(containerTwo.children[0].getAttribute('id').includes('two')).toBe(
        true,
      );
      expect(containerTwo.children[1].getAttribute('id').includes('two')).toBe(
        true,
      );

      expect(containerOne.children[1].getAttribute('id')).not.toEqual(
        containerTwo.children[1].getAttribute('id'),
      );
      expect(containerOne.children[0].getAttribute('id')).toEqual(
        containerOne.children[2].getAttribute('aria-labelledby'),
      );
      expect(containerTwo.children[0].getAttribute('id')).toEqual(
        containerTwo.children[2].getAttribute('aria-labelledby'),
      );

      // Exhaust the rest of the stream
      class Sink extends require('stream').Writable {
        _write(chunk, encoding, done) {
          done();
        }
      }
      streamOne.pipe(new Sink());
      streamTwo.pipe(new Sink());

      await Promise.all([streamOneIsDone, streamTwoIsDone]);
    });

    // @gate experimental
    it('useOpaqueIdentifier: IDs match when, after hydration, a new component that uses the ID is rendered', async () => {
      let _setShowDiv;
      function App() {
        const id = useOpaqueIdentifier();
        const [showDiv, setShowDiv] = useState(false);
        _setShowDiv = setShowDiv;

        return (
          <div>
            <div id={id}>Child One</div>
            {showDiv && <div id={id}>Child Two</div>}
          </div>
        );
      }

      const container = document.createElement('div');
      document.body.append(container);

      container.innerHTML = ReactDOMServer.renderToString(<App />);
      const root = ReactDOM.unstable_createRoot(container, {hydrate: true});
      root.render(<App />);
      Scheduler.unstable_flushAll();
      jest.runAllTimers();

      expect(container.children[0].children.length).toEqual(1);
      const oldServerId = container.children[0].children[0].getAttribute('id');
      expect(oldServerId).not.toBeNull();

      await act(async () => {
        _setShowDiv(true);
      });
      expect(container.children[0].children.length).toEqual(2);
      expect(container.children[0].children[0].getAttribute('id')).toEqual(
        container.children[0].children[1].getAttribute('id'),
      );
      expect(container.children[0].children[0].getAttribute('id')).not.toEqual(
        oldServerId,
      );
      expect(
        container.children[0].children[0].getAttribute('id'),
      ).not.toBeNull();
    });

    // @gate experimental
    it('useOpaqueIdentifier: IDs match when, after hydration, a new component that uses the ID is rendered for legacy', async () => {
      let _setShowDiv;
      function App() {
        const id = useOpaqueIdentifier();
        const [showDiv, setShowDiv] = useState(false);
        _setShowDiv = setShowDiv;

        return (
          <div>
            <div id={id}>Child One</div>
            {showDiv && <div id={id}>Child Two</div>}
          </div>
        );
      }

      const container = document.createElement('div');
      document.body.append(container);

      container.innerHTML = ReactDOMServer.renderToString(<App />);
      ReactDOM.hydrate(<App />, container);

      expect(container.children[0].children.length).toEqual(1);
      const oldServerId = container.children[0].children[0].getAttribute('id');
      expect(oldServerId).not.toBeNull();

      await act(async () => {
        _setShowDiv(true);
      });
      expect(container.children[0].children.length).toEqual(2);
      expect(container.children[0].children[0].getAttribute('id')).toEqual(
        container.children[0].children[1].getAttribute('id'),
      );
      expect(container.children[0].children[0].getAttribute('id')).not.toEqual(
        oldServerId,
      );
      expect(
        container.children[0].children[0].getAttribute('id'),
      ).not.toBeNull();
    });

    // @gate experimental
    it('useOpaqueIdentifier: ID is not used during hydration but is used in an update', async () => {
      let _setShow;
      function App({unused}) {
        Scheduler.unstable_yieldValue('App');
        const id = useOpaqueIdentifier();
        const [show, setShow] = useState(false);
        _setShow = setShow;
        return (
          <div>
            <span id={show ? id : null}>{'Child One'}</span>
          </div>
        );
      }

      const container = document.createElement('div');
      document.body.append(container);
      container.innerHTML = ReactDOMServer.renderToString(<App />);
      const root = ReactDOM.unstable_createRoot(container, {hydrate: true});
      act(() => {
        root.render(<App />);
      });
      expect(Scheduler).toHaveYielded(['App', 'App']);
      // The ID goes from not being used to being added to the page
      act(() => {
        _setShow(true);
      });
      expect(Scheduler).toHaveYielded(['App', 'App']);
      expect(
        container.getElementsByTagName('span')[0].getAttribute('id'),
      ).not.toBeNull();
    });

    // @gate experimental
    it('useOpaqueIdentifier: ID is not used during hydration but is used in an update in legacy', async () => {
      let _setShow;
      function App({unused}) {
        Scheduler.unstable_yieldValue('App');
        const id = useOpaqueIdentifier();
        const [show, setShow] = useState(false);
        _setShow = setShow;
        return (
          <div>
            <span id={show ? id : null}>{'Child One'}</span>
          </div>
        );
      }

      const container = document.createElement('div');
      document.body.append(container);
      container.innerHTML = ReactDOMServer.renderToString(<App />);
      ReactDOM.hydrate(<App />, container);
      expect(Scheduler).toHaveYielded(['App', 'App']);
      // The ID goes from not being used to being added to the page
      act(() => {
        _setShow(true);
      });
      expect(Scheduler).toHaveYielded(['App']);
      expect(
        container.getElementsByTagName('span')[0].getAttribute('id'),
      ).not.toBeNull();
    });

    // @gate experimental
    it('useOpaqueIdentifier: flushSync', async () => {
      let _setShow;
      function App() {
        const id = useOpaqueIdentifier();
        const [show, setShow] = useState(false);
        _setShow = setShow;
        return (
          <div>
            <span id={show ? id : null}>{'Child One'}</span>
          </div>
        );
      }

      const container = document.createElement('div');
      document.body.append(container);
      container.innerHTML = ReactDOMServer.renderToString(<App />);
      const root = ReactDOM.unstable_createRoot(container, {hydrate: true});
      act(() => {
        root.render(<App />);
      });

      // The ID goes from not being used to being added to the page
      act(() => {
        ReactDOM.flushSync(() => {
          _setShow(true);
        });
      });
      expect(
        container.getElementsByTagName('span')[0].getAttribute('id'),
      ).not.toBeNull();
    });

    // @gate experimental
    it('useOpaqueIdentifier: children with id hydrates before other children if ID updates', async () => {
      let _setShow;

      const child1Ref = React.createRef();
      const childWithIDRef = React.createRef();
      const setShowRef = React.createRef();

      // RENAME THESE
      function Child1() {
        Scheduler.unstable_yieldValue('Child One');
        return <span ref={child1Ref}>{'Child One'}</span>;
      }

      function Child2() {
        Scheduler.unstable_yieldValue('Child Two');
        return <span>{'Child Two'}</span>;
      }

      const Children = React.memo(function Children() {
        return (
          <React.Suspense fallback="Loading 1...">
            <Child1 />
            <Child2 />
          </React.Suspense>
        );
      });

      function ChildWithID({parentID}) {
        Scheduler.unstable_yieldValue('Child with ID');
        return (
          <span id={parentID} ref={childWithIDRef}>
            {'Child with ID'}
          </span>
        );
      }

      const ChildrenWithID = React.memo(function ChildrenWithID({parentID}) {
        return (
          <React.Suspense fallback="Loading 2...">
            <ChildWithID parentID={parentID} />
          </React.Suspense>
        );
      });

      function App() {
        const id = useOpaqueIdentifier();
        const [show, setShow] = useState(false);
        _setShow = setShow;
        return (
          <div>
            <Children />
            <ChildrenWithID parentID={id} />
            {show && (
              <span aria-labelledby={id} ref={setShowRef}>
                {'Child Three'}
              </span>
            )}
          </div>
        );
      }

      const container = document.createElement('div');
      container.innerHTML = ReactDOMServer.renderToString(<App />);
      expect(Scheduler).toHaveYielded([
        'Child One',
        'Child Two',
        'Child with ID',
      ]);
      expect(container.textContent).toEqual('Child OneChild TwoChild with ID');

      const serverId = container
        .getElementsByTagName('span')[2]
        .getAttribute('id');
      expect(serverId).not.toBeNull();

      const root = ReactDOM.unstable_createRoot(container, {hydrate: true});
      root.render(<App show={false} />);
      expect(Scheduler).toHaveYielded([]);

      //Hydrate just child one before updating state
      expect(Scheduler).toFlushAndYieldThrough(['Child One']);
      expect(child1Ref.current).toBe(null);
      expect(Scheduler).toHaveYielded([]);

      act(() => {
        _setShow(true);

        // State update should trigger the ID to update, which changes the props
        // of ChildWithID. This should cause ChildWithID to hydrate before Children

        expect(Scheduler).toFlushAndYieldThrough([
          'Child with ID',
          // Fallbacks are immediately committed in TestUtils version
          // of act
          // 'Child with ID',
          // 'Child with ID',
          'Child One',
          'Child Two',
        ]);

        expect(child1Ref.current).toBe(null);
        expect(childWithIDRef.current).toEqual(
          container.getElementsByTagName('span')[2],
        );

        expect(setShowRef.current).toEqual(
          container.getElementsByTagName('span')[3],
        );

        expect(childWithIDRef.current.getAttribute('id')).toEqual(
          setShowRef.current.getAttribute('aria-labelledby'),
        );
        expect(childWithIDRef.current.getAttribute('id')).not.toEqual(serverId);
      });

      // Children hydrates after ChildWithID
      expect(child1Ref.current).toBe(container.getElementsByTagName('span')[0]);

      Scheduler.unstable_flushAll();

      expect(Scheduler).toHaveYielded([]);
    });

    // @gate experimental
    it('useOpaqueIdentifier: IDs match when part of the DOM tree is server rendered and part is client rendered', async () => {
      let suspend = true;
      let resolve;
      const promise = new Promise(resolvePromise => (resolve = resolvePromise));

      function Child({text}) {
        if (suspend) {
          throw promise;
        } else {
          return text;
        }
      }

      function RenderedChild() {
        useEffect(() => {
          Scheduler.unstable_yieldValue('Child did commit');
        });
        return null;
      }

      function App() {
        const id = useOpaqueIdentifier();
        useEffect(() => {
          Scheduler.unstable_yieldValue('Did commit');
        });
        return (
          <div>
            <div id={id}>Child One</div>
            <RenderedChild />
            <React.Suspense fallback={'Fallback'}>
              <div id={id}>
                <Child text="Child Two" />
              </div>
            </React.Suspense>
          </div>
        );
      }

      const container = document.createElement('div');
      document.body.appendChild(container);

      container.innerHTML = ReactDOMServer.renderToString(<App />);

      suspend = true;
      const root = ReactDOM.unstable_createRoot(container, {hydrate: true});
      await act(async () => {
        root.render(<App />);
      });
      jest.runAllTimers();
      expect(Scheduler).toHaveYielded(['Child did commit', 'Did commit']);
      expect(Scheduler).toFlushAndYield([]);

      const serverId = container.children[0].children[0].getAttribute('id');
      expect(container.children[0].children.length).toEqual(1);
      expect(
        container.children[0].children[0].getAttribute('id'),
      ).not.toBeNull();

      await act(async () => {
        suspend = false;
        resolve();
        await promise;
      });

      expect(Scheduler).toHaveYielded(['Child did commit', 'Did commit']);
      expect(Scheduler).toFlushAndYield([]);
      jest.runAllTimers();

      expect(container.children[0].children.length).toEqual(2);
      expect(container.children[0].children[0].getAttribute('id')).toEqual(
        container.children[0].children[1].getAttribute('id'),
      );
      expect(container.children[0].children[0].getAttribute('id')).not.toEqual(
        serverId,
      );
      expect(
        container.children[0].children[0].getAttribute('id'),
      ).not.toBeNull();
    });

    // @gate experimental
    it('useOpaqueIdentifier warn when there is a hydration error', async () => {
      function Child({appId}) {
        return <div aria-labelledby={appId} />;
      }
      function App() {
        const id = useOpaqueIdentifier();
        return <Child appId={id} />;
      }

      const container = document.createElement('div');
      document.body.appendChild(container);

      // This is the wrong HTML string
      container.innerHTML = '<span></span>';
      ReactDOM.unstable_createRoot(container, {hydrate: true}).render(<App />);
      expect(() => Scheduler.unstable_flushAll()).toErrorDev([
        'Warning: Expected server HTML to contain a matching <div> in <div>.',
      ]);
    });

    // @gate experimental
    it('useOpaqueIdentifier: IDs match when part of the DOM tree is server rendered and part is client rendered', async () => {
      let suspend = true;

      function Child({text}) {
        if (suspend) {
          throw new Promise(() => {});
        } else {
          return text;
        }
      }

      function RenderedChild() {
        useEffect(() => {
          Scheduler.unstable_yieldValue('Child did commit');
        });
        return null;
      }

      function App() {
        const id = useOpaqueIdentifier();
        useEffect(() => {
          Scheduler.unstable_yieldValue('Did commit');
        });
        return (
          <div>
            <div id={id}>Child One</div>
            <RenderedChild />
            <React.Suspense fallback={'Fallback'}>
              <div id={id}>
                <Child text="Child Two" />
              </div>
            </React.Suspense>
          </div>
        );
      }

      const container = document.createElement('div');
      document.body.appendChild(container);

      container.innerHTML = ReactDOMServer.renderToString(<App />);

      suspend = false;
      const root = ReactDOM.unstable_createRoot(container, {hydrate: true});
      await act(async () => {
        root.render(<App />);
      });
      jest.runAllTimers();
      expect(Scheduler).toHaveYielded([
        'Child did commit',
        'Did commit',
        'Child did commit',
        'Did commit',
      ]);
      expect(Scheduler).toFlushAndYield([]);

      expect(container.children[0].children.length).toEqual(2);
      expect(container.children[0].children[0].getAttribute('id')).toEqual(
        container.children[0].children[1].getAttribute('id'),
      );
      expect(
        container.children[0].children[0].getAttribute('id'),
      ).not.toBeNull();
    });

    // @gate experimental
    it('useOpaqueIdentifier warn when there is a hydration error', async () => {
      function Child({appId}) {
        return <div aria-labelledby={appId} />;
      }
      function App() {
        const id = useOpaqueIdentifier();
        return <Child appId={id} />;
      }

      const container = document.createElement('div');
      document.body.appendChild(container);

      // This is the wrong HTML string
      container.innerHTML = '<span></span>';
      ReactDOM.unstable_createRoot(container, {hydrate: true}).render(<App />);
      expect(() => Scheduler.unstable_flushAll()).toErrorDev([
        'Warning: Expected server HTML to contain a matching <div> in <div>.',
      ]);
    });

    // @gate experimental
    it('useOpaqueIdentifier warns when there is a hydration error and we are using ID as a string', async () => {
      function Child({appId}) {
        return <div aria-labelledby={appId + ''} />;
      }
      function App() {
        const id = useOpaqueIdentifier();
        return <Child appId={id} />;
      }

      const container = document.createElement('div');
      document.body.appendChild(container);

      // This is the wrong HTML string
      container.innerHTML = '<span></span>';
      ReactDOM.unstable_createRoot(container, {hydrate: true}).render(<App />);
      expect(() => Scheduler.unstable_flushAll()).toErrorDev(
        [
          'Warning: The object passed back from useOpaqueIdentifier is meant to be passed through to attributes only. Do not read the value directly.',
          'Warning: Did not expect server HTML to contain a <span> in <div>.',
        ],
        {withoutStack: 1},
      );
    });

    // @gate experimental
    it('useOpaqueIdentifier warns when there is a hydration error and we are using ID as a string', async () => {
      function Child({appId}) {
        return <div aria-labelledby={appId + ''} />;
      }
      function App() {
        const id = useOpaqueIdentifier();
        return <Child appId={id} />;
      }

      const container = document.createElement('div');
      document.body.appendChild(container);

      // This is the wrong HTML string
      container.innerHTML = '<span></span>';
      ReactDOM.unstable_createRoot(container, {hydrate: true}).render(<App />);
      expect(() => Scheduler.unstable_flushAll()).toErrorDev(
        [
          'Warning: The object passed back from useOpaqueIdentifier is meant to be passed through to attributes only. Do not read the value directly.',
          'Warning: Did not expect server HTML to contain a <span> in <div>.',
        ],
        {withoutStack: 1},
      );
    });

    // @gate experimental
    it('useOpaqueIdentifier warns if you try to use the result as a string in a child component', async () => {
      function Child({appId}) {
        return <div aria-labelledby={appId + ''} />;
      }
      function App() {
        const id = useOpaqueIdentifier();
        return <Child appId={id} />;
      }

      const container = document.createElement('div');
      document.body.appendChild(container);

      container.innerHTML = ReactDOMServer.renderToString(<App />);
      ReactDOM.unstable_createRoot(container, {hydrate: true}).render(<App />);
      expect(() => Scheduler.unstable_flushAll()).toErrorDev(
        [
          'Warning: The object passed back from useOpaqueIdentifier is meant to be passed through to attributes only. Do not read the value directly.',
          'Warning: Did not expect server HTML to contain a <div> in <div>.',
        ],
        {withoutStack: 1},
      );
    });

    // @gate experimental
    it('useOpaqueIdentifier warns if you try to use the result as a string', async () => {
      function App() {
        const id = useOpaqueIdentifier();
        return <div aria-labelledby={id + ''} />;
      }

      const container = document.createElement('div');
      document.body.appendChild(container);

      container.innerHTML = ReactDOMServer.renderToString(<App />);
      ReactDOM.unstable_createRoot(container, {hydrate: true}).render(<App />);
      expect(() => Scheduler.unstable_flushAll()).toErrorDev(
        [
          'Warning: The object passed back from useOpaqueIdentifier is meant to be passed through to attributes only. Do not read the value directly.',
          'Warning: Did not expect server HTML to contain a <div> in <div>.',
        ],
        {withoutStack: 1},
      );
    });

    // @gate experimental
    it('useOpaqueIdentifier warns if you try to use the result as a string in a child component wrapped in a Suspense', async () => {
      function Child({appId}) {
        return <div aria-labelledby={appId + ''} />;
      }
      function App() {
        const id = useOpaqueIdentifier();
        return (
          <React.Suspense fallback={null}>
            <Child appId={id} />
          </React.Suspense>
        );
      }

      const container = document.createElement('div');
      document.body.appendChild(container);

      container.innerHTML = ReactDOMServer.renderToString(<App />);

      ReactDOM.unstable_createRoot(container, {hydrate: true}).render(<App />);

      if (gate(flags => flags.deferRenderPhaseUpdateToNextBatch)) {
        expect(() => Scheduler.unstable_flushAll()).toErrorDev([
          'The object passed back from useOpaqueIdentifier is meant to be passed through to attributes only. ' +
            'Do not read the value directly.',
        ]);
      } else {
        // This error isn't surfaced to the user; only the warning is.
        // The error is just the mechanism that restarts the render.
        expect(() =>
          expect(() => Scheduler.unstable_flushAll()).toThrow(
            'The object passed back from useOpaqueIdentifier is meant to be passed through to attributes only. ' +
              'Do not read the value directly.',
          ),
        ).toErrorDev([
          'The object passed back from useOpaqueIdentifier is meant to be passed through to attributes only. ' +
            'Do not read the value directly.',
        ]);
      }
    });

    // @gate experimental
    it('useOpaqueIdentifier warns if you try to add the result as a number in a child component wrapped in a Suspense', async () => {
      function Child({appId}) {
        return <div aria-labelledby={+appId} />;
      }
      function App() {
        const [show] = useState(false);
        const id = useOpaqueIdentifier();
        return (
          <React.Suspense fallback={null}>
            {show && <div id={id} />}
            <Child appId={id} />
          </React.Suspense>
        );
      }

      const container = document.createElement('div');
      document.body.appendChild(container);

      container.innerHTML = ReactDOMServer.renderToString(<App />);

      ReactDOM.unstable_createRoot(container, {hydrate: true}).render(<App />);

      if (gate(flags => flags.deferRenderPhaseUpdateToNextBatch)) {
        expect(() => Scheduler.unstable_flushAll()).toErrorDev([
          'The object passed back from useOpaqueIdentifier is meant to be passed through to attributes only. ' +
            'Do not read the value directly.',
        ]);
      } else {
        // This error isn't surfaced to the user; only the warning is.
        // The error is just the mechanism that restarts the render.
        expect(() =>
          expect(() => Scheduler.unstable_flushAll()).toThrow(
            'The object passed back from useOpaqueIdentifier is meant to be passed through to attributes only. ' +
              'Do not read the value directly.',
          ),
        ).toErrorDev([
          'The object passed back from useOpaqueIdentifier is meant to be passed through to attributes only. ' +
            'Do not read the value directly.',
        ]);
      }
    });

    // @gate experimental
    it('useOpaqueIdentifier with two opaque identifiers on the same page', () => {
      let _setShow;

      function App() {
        const id1 = useOpaqueIdentifier();
        const id2 = useOpaqueIdentifier();
        const [show, setShow] = useState(true);
        _setShow = setShow;

        return (
          <div>
            <React.Suspense fallback={null}>
              {show ? (
                <span id={id1}>{'Child'}</span>
              ) : (
                <span id={id2}>{'Child'}</span>
              )}
            </React.Suspense>
            <span aria-labelledby={id1}>{'test'}</span>
          </div>
        );
      }

      const container = document.createElement('div');
      document.body.appendChild(container);

      container.innerHTML = ReactDOMServer.renderToString(<App />);

      const serverID = container
        .getElementsByTagName('span')[0]
        .getAttribute('id');
      expect(serverID).not.toBeNull();
      expect(
        container
          .getElementsByTagName('span')[1]
          .getAttribute('aria-labelledby'),
      ).toEqual(serverID);

      ReactDOM.unstable_createRoot(container, {hydrate: true}).render(<App />);
      jest.runAllTimers();
      expect(Scheduler).toHaveYielded([]);
      expect(Scheduler).toFlushAndYield([]);

      act(() => {
        _setShow(false);
      });

      expect(
        container
          .getElementsByTagName('span')[1]
          .getAttribute('aria-labelledby'),
      ).toEqual(serverID);
      expect(
        container.getElementsByTagName('span')[0].getAttribute('id'),
      ).not.toEqual(serverID);
      expect(
        container.getElementsByTagName('span')[0].getAttribute('id'),
      ).not.toBeNull();
    });
  });
});
