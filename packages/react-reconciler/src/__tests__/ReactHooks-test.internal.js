/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

/* eslint-disable no-func-assign */

'use strict';

let React;
let ReactFeatureFlags;
let ReactNoop;
let useState;
let useReducer;
let useEffect;
let useCallback;
let useMemo;
let useRef;
let useAPI;
let forwardRef;

describe('ReactHooks', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.enableHooks_DEPRECATED = true;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    useState = React.useState;
    useReducer = React.useReducer;
    useEffect = React.useEffect;
    useCallback = React.useCallback;
    useMemo = React.useMemo;
    useRef = React.useRef;
    useAPI = React.useAPI;
    forwardRef = React.forwardRef;
  });

  function span(prop) {
    return {type: 'span', children: [], prop};
  }

  function Text(props) {
    ReactNoop.yield(props.text);
    return <span prop={props.text} />;
  }

  it('resumes after an interruption', () => {
    function Counter(props, ref) {
      const [count, updateCount] = useState(0);
      useAPI(ref, () => ({updateCount}));
      return <Text text={props.label + ': ' + count} />;
    }
    Counter = forwardRef(Counter);

    // Initial mount
    const counter = React.createRef(null);
    ReactNoop.render(<Counter label="Count" ref={counter} />);
    expect(ReactNoop.flush()).toEqual(['Count: 0']);
    expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

    // Schedule some updates
    counter.current.updateCount(1);
    counter.current.updateCount(count => count + 10);
    // Partially flush without committing
    ReactNoop.flushThrough(['Count: 11']);
    expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

    // Interrupt with a high priority update
    ReactNoop.flushSync(() => {
      ReactNoop.render(<Counter label="Total" />);
    });
    expect(ReactNoop.clearYields()).toEqual(['Total: 0']);

    // Resume rendering
    ReactNoop.flush();
    expect(ReactNoop.getChildren()).toEqual([span('Total: 11')]);
  });

  it('throws inside class components', () => {
    class BadCounter extends React.Component {
      render() {
        const [count] = useState(0);
        return <Text text={this.props.label + ': ' + count} />;
      }
    }
    ReactNoop.render(<BadCounter />);

    expect(() => ReactNoop.flush()).toThrow(
      'Hooks can only be called inside the body of a functional component.',
    );

    // Confirm that a subsequent hook works properly.
    function GoodCounter(props, ref) {
      const [count] = useState(props.initialCount);
      return <Text text={count} />;
    }
    ReactNoop.render(<GoodCounter initialCount={10} />);
    expect(ReactNoop.flush()).toEqual([10]);
  });

  it('throws inside module-style components', () => {
    function Counter() {
      return {
        render() {
          const [count] = useState(0);
          return <Text text={this.props.label + ': ' + count} />;
        },
      };
    }
    ReactNoop.render(<Counter />);
    expect(() => ReactNoop.flush()).toThrow(
      'Hooks can only be called inside the body of a functional component.',
    );

    // Confirm that a subsequent hook works properly.
    function GoodCounter(props) {
      const [count] = useState(props.initialCount);
      return <Text text={count} />;
    }
    ReactNoop.render(<GoodCounter initialCount={10} />);
    expect(ReactNoop.flush()).toEqual([10]);
  });

  it('throws when called outside the render phase', () => {
    expect(() => useState(0)).toThrow(
      'Hooks can only be called inside the body of a functional component.',
    );
  });

  describe('useState', () => {
    it('simple mount and update', () => {
      function Counter(props, ref) {
        const [count, updateCount] = useState(0);
        useAPI(ref, () => ({updateCount}));
        return <Text text={'Count: ' + count} />;
      }
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      ReactNoop.render(<Counter ref={counter} />);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      counter.current.updateCount(1);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);

      counter.current.updateCount(count => count + 10);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 11')]);
    });

    it('lazy state initializer', () => {
      function Counter(props, ref) {
        const [count, updateCount] = useState(() => {
          ReactNoop.yield('getInitialState');
          return props.initialState;
        });
        useAPI(ref, () => ({updateCount}));
        return <Text text={'Count: ' + count} />;
      }
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      ReactNoop.render(<Counter initialState={42} ref={counter} />);
      expect(ReactNoop.flush()).toEqual(['getInitialState', 'Count: 42']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 42')]);

      counter.current.updateCount(7);
      expect(ReactNoop.flush()).toEqual(['Count: 7']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 7')]);
    });

    it('multiple states', () => {
      function Counter(props, ref) {
        const [count, updateCount] = useState(0);
        const [label, updateLabel] = useState('Count');
        useAPI(ref, () => ({updateCount, updateLabel}));
        return <Text text={label + ': ' + count} />;
      }
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      ReactNoop.render(<Counter ref={counter} />);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      counter.current.updateCount(7);
      expect(ReactNoop.flush()).toEqual(['Count: 7']);

      counter.current.updateLabel('Total');
      expect(ReactNoop.flush()).toEqual(['Total: 7']);
    });

    it('callbacks', () => {
      function Counter(props, ref) {
        const [count, updateCount] = useState(0);
        useAPI(ref, () => ({updateCount}));
        return <Text text={'Count: ' + count} />;
      }
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      ReactNoop.render(<Counter ref={counter} />);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      counter.current.updateCount(7, count => {
        ReactNoop.yield(`Did update count`);
      });
      expect(ReactNoop.flush()).toEqual(['Count: 7', 'Did update count']);

      // Update twice in the same batch
      counter.current.updateCount(1, () => {
        ReactNoop.yield(`Did update count (first callback)`);
      });
      counter.current.updateCount(2, () => {
        ReactNoop.yield(`Did update count (second callback)`);
      });
      expect(ReactNoop.flush()).toEqual([
        // Component only renders once
        'Count: 2',
        'Did update count (first callback)',
        'Did update count (second callback)',
      ]);
    });

    it('does not fire callbacks more than once when rebasing', () => {
      function Counter(props, ref) {
        const [count, updateCount] = useState(0);
        useAPI(ref, () => ({updateCount}));
        return <Text text={'Count: ' + count} />;
      }
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      ReactNoop.render(<Counter ref={counter} />);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      counter.current.updateCount(1, count => {
        ReactNoop.yield(`Did update count (low pri)`);
      });
      ReactNoop.flushSync(() => {
        counter.current.updateCount(2, count => {
          ReactNoop.yield(`Did update count (high pri)`);
        });
      });
      expect(ReactNoop.clearYields()).toEqual([
        'Count: 2',
        'Did update count (high pri)',
      ]);
      // The high-pri update is processed again when we render at low priority,
      // but its callback should not fire again.
      expect(ReactNoop.flush()).toEqual([
        'Count: 2',
        'Did update count (low pri)',
      ]);
    });

    it('returns the same updater function every time', () => {
      let updaters = [];
      function Counter() {
        const [count, updateCount] = useState(0);
        updaters.push(updateCount);
        return <Text text={'Count: ' + count} />;
      }
      ReactNoop.render(<Counter />);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      updaters[0](1);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);

      updaters[0](count => count + 10);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 11')]);

      expect(updaters).toEqual([updaters[0], updaters[0], updaters[0]]);
    });
  });

  describe('updates during the render phase', () => {
    it('restarts the render function and applies the new updates on top', () => {
      function ScrollView({row: newRow}) {
        let [isScrollingDown, setIsScrollingDown] = useState(false);
        let [row, setRow] = useState(null);

        if (row !== newRow) {
          // Row changed since last render. Update isScrollingDown.
          setIsScrollingDown(row !== null && newRow > row);
          setRow(newRow);
        }

        return <Text text={`Scrolling down: ${isScrollingDown}`} />;
      }

      ReactNoop.render(<ScrollView row={1} />);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Scrolling down: false')]);

      ReactNoop.render(<ScrollView row={5} />);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Scrolling down: true')]);

      ReactNoop.render(<ScrollView row={5} />);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Scrolling down: true')]);

      ReactNoop.render(<ScrollView row={10} />);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Scrolling down: true')]);

      ReactNoop.render(<ScrollView row={2} />);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Scrolling down: false')]);

      ReactNoop.render(<ScrollView row={2} />);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Scrolling down: false')]);
    });

    it('keeps restarting until there are no more new updates', () => {
      function Counter({row: newRow}) {
        let [count, setCount] = useState(0);
        if (count < 3) {
          setCount(count + 1);
        }
        ReactNoop.yield('Render: ' + count);
        return <Text text={count} />;
      }

      ReactNoop.render(<Counter />);
      expect(ReactNoop.flush()).toEqual([
        'Render: 0',
        'Render: 1',
        'Render: 2',
        'Render: 3',
        3,
      ]);
      expect(ReactNoop.getChildren()).toEqual([span(3)]);
    });

    it('updates multiple times within same render function', () => {
      function Counter({row: newRow}) {
        let [count, setCount] = useState(0);
        if (count < 12) {
          setCount(c => c + 1);
          setCount(c => c + 1);
          setCount(c => c + 1);
        }
        ReactNoop.yield('Render: ' + count);
        return <Text text={count} />;
      }

      ReactNoop.render(<Counter />);
      expect(ReactNoop.flush()).toEqual([
        // Should increase by three each time
        'Render: 0',
        'Render: 3',
        'Render: 6',
        'Render: 9',
        'Render: 12',
        12,
      ]);
      expect(ReactNoop.getChildren()).toEqual([span(12)]);
    });

    it('throws after too many iterations', () => {
      function Counter({row: newRow}) {
        let [count, setCount] = useState(0);
        setCount(count + 1);
        ReactNoop.yield('Render: ' + count);
        return <Text text={count} />;
      }
      ReactNoop.render(<Counter />);
      expect(() => ReactNoop.flush()).toThrow(
        'Too many re-renders. React limits the number of renders to prevent ' +
          'an infinite loop.',
      );
    });

    it('works with useReducer', () => {
      function reducer(state, action) {
        return action === 'increment' ? state + 1 : state;
      }
      function Counter({row: newRow}) {
        let [count, dispatch] = useReducer(reducer, 0);
        if (count < 3) {
          dispatch('increment');
        }
        ReactNoop.yield('Render: ' + count);
        return <Text text={count} />;
      }

      ReactNoop.render(<Counter />);
      expect(ReactNoop.flush()).toEqual([
        'Render: 0',
        'Render: 1',
        'Render: 2',
        'Render: 3',
        3,
      ]);
      expect(ReactNoop.getChildren()).toEqual([span(3)]);
    });

    it('uses reducer passed at time of render, not time of dispatch', () => {
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

      function Counter({row: newRow}, ref) {
        let [reducer, setReducer] = useState(() => reducerA);
        let [count, dispatch] = useReducer(reducer, 0);
        useAPI(ref, () => ({dispatch}));
        if (count < 20) {
          dispatch('increment');
          // Swap reducers each time we increment
          if (reducer === reducerA) {
            setReducer(() => reducerB);
          } else {
            setReducer(() => reducerA);
          }
        }
        ReactNoop.yield('Render: ' + count);
        return <Text text={count} />;
      }
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      ReactNoop.render(<Counter ref={counter} />);
      expect(ReactNoop.flush()).toEqual([
        // The count should increase by alternating amounts of 10 and 1
        // until we reach 21.
        'Render: 0',
        'Render: 10',
        'Render: 11',
        'Render: 21',
        21,
      ]);
      expect(ReactNoop.getChildren()).toEqual([span(21)]);

      // Test that it works on update, too. This time the log is a bit different
      // because we started with reducerB instead of reducerA.
      counter.current.dispatch('reset');
      ReactNoop.render(<Counter ref={counter} />);
      expect(ReactNoop.flush()).toEqual([
        'Render: 0',
        'Render: 1',
        'Render: 11',
        'Render: 12',
        'Render: 22',
        22,
      ]);
      expect(ReactNoop.getChildren()).toEqual([span(22)]);
    });
  });

  describe('useReducer', () => {
    it('simple mount and update', () => {
      const INCREMENT = 'INCREMENT';
      const DECREMENT = 'DECREMENT';

      function reducer(state, action) {
        switch (action) {
          case 'INCREMENT':
            return state + 1;
          case 'DECREMENT':
            return state - 1;
          default:
            return state;
        }
      }

      function Counter(props, ref) {
        const [count, dispatch] = useReducer(reducer, 0);
        useAPI(ref, () => ({dispatch}));
        return <Text text={'Count: ' + count} />;
      }
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      ReactNoop.render(<Counter ref={counter} />);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      counter.current.dispatch(INCREMENT);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);

      counter.current.dispatch(DECREMENT);
      counter.current.dispatch(DECREMENT);
      counter.current.dispatch(DECREMENT);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: -2')]);
    });

    it('accepts an initial action', () => {
      const INCREMENT = 'INCREMENT';
      const DECREMENT = 'DECREMENT';

      function reducer(state, action) {
        switch (action) {
          case 'INITIALIZE':
            return 10;
          case 'INCREMENT':
            return state + 1;
          case 'DECREMENT':
            return state - 1;
          default:
            return state;
        }
      }

      const initialAction = 'INITIALIZE';

      function Counter(props, ref) {
        const [count, dispatch] = useReducer(reducer, 0, initialAction);
        useAPI(ref, () => ({dispatch}));
        return <Text text={'Count: ' + count} />;
      }
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      ReactNoop.render(<Counter ref={counter} />);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 10')]);

      counter.current.dispatch(INCREMENT);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 11')]);

      counter.current.dispatch(DECREMENT);
      counter.current.dispatch(DECREMENT);
      counter.current.dispatch(DECREMENT);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 8')]);
    });
  });

  describe('useEffect', () => {
    it('simple mount and update', () => {
      function Counter(props) {
        useEffect(() => {
          ReactNoop.yield(`Did commit [${props.count}]`);
        });
        return <Text text={'Count: ' + props.count} />;
      }
      ReactNoop.render(<Counter count={0} />);
      expect(ReactNoop.flush()).toEqual(['Count: 0', 'Did commit [0]']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      ReactNoop.render(<Counter count={1} />);
      expect(ReactNoop.flush()).toEqual(['Count: 1', 'Did commit [1]']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
    });

    it('unmounts previous effect', () => {
      function Counter(props) {
        useEffect(() => {
          ReactNoop.yield(`Did create [${props.count}]`);
          return () => {
            ReactNoop.yield(`Did destroy [${props.count}]`);
          };
        });
        return <Text text={'Count: ' + props.count} />;
      }
      ReactNoop.render(<Counter count={0} />);
      expect(ReactNoop.flush()).toEqual(['Count: 0', 'Did create [0]']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      ReactNoop.render(<Counter count={1} />);
      expect(ReactNoop.flush()).toEqual([
        'Count: 1',
        'Did destroy [0]',
        'Did create [1]',
      ]);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
    });

    it('unmounts on deletion', () => {
      function Counter(props) {
        useEffect(() => {
          ReactNoop.yield(`Did create [${props.count}]`);
          return () => {
            ReactNoop.yield(`Did destroy [${props.count}]`);
          };
        });
        return <Text text={'Count: ' + props.count} />;
      }
      ReactNoop.render(<Counter count={0} />);
      expect(ReactNoop.flush()).toEqual(['Count: 0', 'Did create [0]']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      ReactNoop.render(null);
      expect(ReactNoop.flush()).toEqual(['Did destroy [0]']);
      expect(ReactNoop.getChildren()).toEqual([]);
    });

    it('skips effect if constructor has not changed', () => {
      function effect() {
        ReactNoop.yield(`Did mount`);
        return () => {
          ReactNoop.yield(`Did unmount`);
        };
      }
      function Counter(props) {
        useEffect(effect);
        return <Text text={'Count: ' + props.count} />;
      }
      ReactNoop.render(<Counter count={0} />);
      expect(ReactNoop.flush()).toEqual(['Count: 0', 'Did mount']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      ReactNoop.render(<Counter count={1} />);
      // No effect, because constructor was hoisted outside render
      expect(ReactNoop.flush()).toEqual(['Count: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);

      ReactNoop.render(null);
      expect(ReactNoop.flush()).toEqual(['Did unmount']);
      expect(ReactNoop.getChildren()).toEqual([]);
    });

    it('skips effect if inputs have not changed', () => {
      function Counter(props) {
        const text = `${props.label}: ${props.count}`;
        useEffect(
          () => {
            ReactNoop.yield(`Did create [${text}]`);
            return () => {
              ReactNoop.yield(`Did destroy [${text}]`);
            };
          },
          [props.label, props.count],
        );
        return <Text text={text} />;
      }
      ReactNoop.render(<Counter label="Count" count={0} />);
      expect(ReactNoop.flush()).toEqual(['Count: 0', 'Did create [Count: 0]']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      ReactNoop.render(<Counter label="Count" count={1} />);
      // Count changed
      expect(ReactNoop.flush()).toEqual([
        'Count: 1',
        'Did destroy [Count: 0]',
        'Did create [Count: 1]',
      ]);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);

      ReactNoop.render(<Counter label="Count" count={1} />);
      // Nothing changed, so no effect should have fired
      expect(ReactNoop.flush()).toEqual(['Count: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);

      ReactNoop.render(<Counter label="Total" count={1} />);
      // Label changed
      expect(ReactNoop.flush()).toEqual([
        'Total: 1',
        'Did destroy [Count: 1]',
        'Did create [Total: 1]',
      ]);
      expect(ReactNoop.getChildren()).toEqual([span('Total: 1')]);
    });

    it('multiple effects', () => {
      function Counter(props) {
        useEffect(() => {
          ReactNoop.yield(`Did commit 1 [${props.count}]`);
        });
        useEffect(() => {
          ReactNoop.yield(`Did commit 2 [${props.count}]`);
        });
        return <Text text={'Count: ' + props.count} />;
      }
      ReactNoop.render(<Counter count={0} />);
      expect(ReactNoop.flush()).toEqual([
        'Count: 0',
        'Did commit 1 [0]',
        'Did commit 2 [0]',
      ]);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      ReactNoop.render(<Counter count={1} />);
      expect(ReactNoop.flush()).toEqual([
        'Count: 1',
        'Did commit 1 [1]',
        'Did commit 2 [1]',
      ]);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
    });

    it('unmounts all previous effects before creating any new ones', () => {
      function Counter(props) {
        useEffect(() => {
          ReactNoop.yield(`Mount A [${props.count}]`);
          return () => {
            ReactNoop.yield(`Unmount A [${props.count}]`);
          };
        });
        useEffect(() => {
          ReactNoop.yield(`Mount B [${props.count}]`);
          return () => {
            ReactNoop.yield(`Unmount B [${props.count}]`);
          };
        });
        return <Text text={'Count: ' + props.count} />;
      }
      ReactNoop.render(<Counter count={0} />);
      expect(ReactNoop.flush()).toEqual([
        'Count: 0',
        'Mount A [0]',
        'Mount B [0]',
      ]);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      ReactNoop.render(<Counter count={1} />);
      expect(ReactNoop.flush()).toEqual([
        'Count: 1',
        'Unmount A [0]',
        'Unmount B [0]',
        'Mount A [1]',
        'Mount B [1]',
      ]);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
    });
  });

  describe('useCallback', () => {
    it('memoizes callback by comparing inputs', () => {
      class IncrementButton extends React.PureComponent {
        increment = () => {
          this.props.increment();
        };
        render() {
          return <Text text="Increment" />;
        }
      }

      function Counter({incrementBy}) {
        const [count, updateCount] = useState(0);
        const increment = useCallback(() => updateCount(c => c + incrementBy), [
          incrementBy,
        ]);
        return (
          <React.Fragment>
            <IncrementButton increment={increment} ref={button} />
            <Text text={'Count: ' + count} />
          </React.Fragment>
        );
      }

      const button = React.createRef(null);
      ReactNoop.render(<Counter incrementBy={1} />);
      expect(ReactNoop.flush()).toEqual(['Increment', 'Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([
        span('Increment'),
        span('Count: 0'),
      ]);

      button.current.increment();
      expect(ReactNoop.flush()).toEqual([
        // Button should not re-render, because its props haven't changed
        // 'Increment',
        'Count: 1',
      ]);
      expect(ReactNoop.getChildren()).toEqual([
        span('Increment'),
        span('Count: 1'),
      ]);

      // Increase the increment amount
      ReactNoop.render(<Counter incrementBy={10} />);
      expect(ReactNoop.flush()).toEqual([
        // Inputs did change this time
        'Increment',
        'Count: 1',
      ]);
      expect(ReactNoop.getChildren()).toEqual([
        span('Increment'),
        span('Count: 1'),
      ]);

      // Callback should have updated
      button.current.increment();
      expect(ReactNoop.flush()).toEqual(['Count: 11']);
      expect(ReactNoop.getChildren()).toEqual([
        span('Increment'),
        span('Count: 11'),
      ]);
    });
  });

  describe('useMemo', () => {
    it('memoizes value by comparing to previous inputs', () => {
      function CapitalizedText(props) {
        const text = props.text;
        const capitalizedText = useMemo(
          () => {
            ReactNoop.yield(`Capitalize '${text}'`);
            return text.toUpperCase();
          },
          [text],
        );
        return <Text text={capitalizedText} />;
      }

      ReactNoop.render(<CapitalizedText text="hello" />);
      expect(ReactNoop.flush()).toEqual(["Capitalize 'hello'", 'HELLO']);
      expect(ReactNoop.getChildren()).toEqual([span('HELLO')]);

      ReactNoop.render(<CapitalizedText text="hi" />);
      expect(ReactNoop.flush()).toEqual(["Capitalize 'hi'", 'HI']);
      expect(ReactNoop.getChildren()).toEqual([span('HI')]);

      ReactNoop.render(<CapitalizedText text="hi" />);
      expect(ReactNoop.flush()).toEqual(['HI']);
      expect(ReactNoop.getChildren()).toEqual([span('HI')]);

      ReactNoop.render(<CapitalizedText text="goodbye" />);
      expect(ReactNoop.flush()).toEqual(["Capitalize 'goodbye'", 'GOODBYE']);
      expect(ReactNoop.getChildren()).toEqual([span('GOODBYE')]);
    });

    it('compares function if no inputs are provided', () => {
      function LazyCompute(props) {
        const computed = useMemo(props.compute);
        return <Text text={computed} />;
      }

      function computeA() {
        ReactNoop.yield('compute A');
        return 'A';
      }

      function computeB() {
        ReactNoop.yield('compute B');
        return 'B';
      }

      ReactNoop.render(<LazyCompute compute={computeA} />);
      expect(ReactNoop.flush()).toEqual(['compute A', 'A']);

      ReactNoop.render(<LazyCompute compute={computeA} />);
      expect(ReactNoop.flush()).toEqual(['A']);

      ReactNoop.render(<LazyCompute compute={computeA} />);
      expect(ReactNoop.flush()).toEqual(['A']);

      ReactNoop.render(<LazyCompute compute={computeB} />);
      expect(ReactNoop.flush()).toEqual(['compute B', 'B']);
    });
  });

  describe('useRef', () => {
    it('creates a ref object initialized with the provided value', () => {
      jest.useFakeTimers();

      function useDebouncedCallback(callback, ms, inputs) {
        const timeoutID = useRef(-1);
        useEffect(() => {
          return function unmount() {
            clearTimeout(timeoutID.current);
          };
        }, []);
        const debouncedCallback = useCallback(
          (...args) => {
            clearTimeout(timeoutID.current);
            timeoutID.current = setTimeout(callback, ms, ...args);
          },
          [callback, ms],
        );
        return useCallback(debouncedCallback, inputs);
      }

      let ping;
      function App() {
        ping = useDebouncedCallback(
          value => {
            ReactNoop.yield('ping: ' + value);
          },
          100,
          [],
        );
        return null;
      }

      ReactNoop.render(<App />);
      expect(ReactNoop.flush()).toEqual([]);

      ping(1);
      ping(2);
      ping(3);

      expect(ReactNoop.flush()).toEqual([]);

      jest.advanceTimersByTime(100);

      expect(ReactNoop.flush()).toEqual(['ping: 3']);

      ping(4);
      jest.advanceTimersByTime(20);
      ping(5);
      ping(6);
      jest.advanceTimersByTime(80);

      expect(ReactNoop.flush()).toEqual([]);

      jest.advanceTimersByTime(20);
      expect(ReactNoop.flush()).toEqual(['ping: 6']);
    });
  });

  describe('progressive enhancement', () => {
    it('mount additional state', () => {
      let updateA;
      let updateB;
      let updateC;

      function App(props) {
        const [A, _updateA] = useState(0);
        const [B, _updateB] = useState(0);
        updateA = _updateA;
        updateB = _updateB;

        let C;
        if (props.loadC) {
          const [_C, _updateC] = useState(0);
          C = _C;
          updateC = _updateC;
        } else {
          C = '[not loaded]';
        }

        return <Text text={`A: ${A}, B: ${B}, C: ${C}`} />;
      }

      ReactNoop.render(<App loadC={false} />);
      expect(ReactNoop.flush()).toEqual(['A: 0, B: 0, C: [not loaded]']);
      expect(ReactNoop.getChildren()).toEqual([
        span('A: 0, B: 0, C: [not loaded]'),
      ]);

      updateA(2);
      updateB(3);
      expect(ReactNoop.flush()).toEqual(['A: 2, B: 3, C: [not loaded]']);
      expect(ReactNoop.getChildren()).toEqual([
        span('A: 2, B: 3, C: [not loaded]'),
      ]);

      ReactNoop.render(<App loadC={true} />);
      expect(ReactNoop.flush()).toEqual(['A: 2, B: 3, C: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('A: 2, B: 3, C: 0')]);

      updateC(4);
      expect(ReactNoop.flush()).toEqual(['A: 2, B: 3, C: 4']);
      expect(ReactNoop.getChildren()).toEqual([span('A: 2, B: 3, C: 4')]);
    });

    it('unmount state', () => {
      let updateA;
      let updateB;
      let updateC;

      function App(props) {
        const [A, _updateA] = useState(0);
        const [B, _updateB] = useState(0);
        updateA = _updateA;
        updateB = _updateB;

        let C;
        if (props.loadC) {
          const [_C, _updateC] = useState(0);
          C = _C;
          updateC = _updateC;
        } else {
          C = '[not loaded]';
        }

        return <Text text={`A: ${A}, B: ${B}, C: ${C}`} />;
      }

      ReactNoop.render(<App loadC={true} />);
      expect(ReactNoop.flush()).toEqual(['A: 0, B: 0, C: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('A: 0, B: 0, C: 0')]);

      updateA(2);
      updateB(3);
      updateC(4);
      expect(ReactNoop.flush()).toEqual(['A: 2, B: 3, C: 4']);
      expect(ReactNoop.getChildren()).toEqual([span('A: 2, B: 3, C: 4')]);

      ReactNoop.render(<App loadC={false} />);
      expect(ReactNoop.flush()).toEqual(['A: 2, B: 3, C: [not loaded]']);
      expect(ReactNoop.getChildren()).toEqual([
        span('A: 2, B: 3, C: [not loaded]'),
      ]);

      updateC(4);
      // TODO: This hook triggered a re-render even though it's unmounted.
      // Should we warn?
      expect(ReactNoop.flush()).toEqual(['A: 2, B: 3, C: [not loaded]']);
      expect(ReactNoop.getChildren()).toEqual([
        span('A: 2, B: 3, C: [not loaded]'),
      ]);

      updateB(4);
      expect(ReactNoop.flush()).toEqual(['A: 2, B: 4, C: [not loaded]']);
      expect(ReactNoop.getChildren()).toEqual([
        span('A: 2, B: 4, C: [not loaded]'),
      ]);
    });

    it('unmount effects', () => {
      function App(props) {
        useEffect(() => {
          ReactNoop.yield('Mount A');
          return () => {
            ReactNoop.yield('Unmount A');
          };
        }, []);

        if (props.showMore) {
          useEffect(() => {
            ReactNoop.yield('Mount B');
            return () => {
              ReactNoop.yield('Unmount B');
            };
          }, []);
        }

        return null;
      }

      ReactNoop.render(<App showMore={false} />);
      expect(ReactNoop.flush()).toEqual(['Mount A']);

      ReactNoop.render(<App showMore={true} />);
      expect(ReactNoop.flush()).toEqual(['Mount B']);

      ReactNoop.render(<App showMore={false} />);
      expect(ReactNoop.flush()).toEqual(['Unmount B']);

      ReactNoop.render(null);
      expect(ReactNoop.flush()).toEqual(['Unmount A']);
    });
  });
});
