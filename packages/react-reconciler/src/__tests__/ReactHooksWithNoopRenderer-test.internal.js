/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
let Scheduler;
let SchedulerTracing;
let useState;
let useReducer;
let useEffect;
let useLayoutEffect;
let useCallback;
let useMemo;
let useRef;
let useImperativeHandle;
let forwardRef;
let memo;
let act;

describe('ReactHooksWithNoopRenderer', () => {
  beforeEach(() => {
    jest.resetModules();

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.enableSchedulerTracing = true;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    SchedulerTracing = require('scheduler/tracing');
    useState = React.useState;
    useReducer = React.useReducer;
    useEffect = React.useEffect;
    useLayoutEffect = React.useLayoutEffect;
    useCallback = React.useCallback;
    useMemo = React.useMemo;
    useRef = React.useRef;
    useImperativeHandle = React.useImperativeHandle;
    forwardRef = React.forwardRef;
    memo = React.memo;
    act = ReactNoop.act;
  });

  function span(prop) {
    return {type: 'span', hidden: false, children: [], prop};
  }

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return <span prop={props.text} />;
  }

  it('resumes after an interruption', () => {
    function Counter(props, ref) {
      const [count, updateCount] = useState(0);
      useImperativeHandle(ref, () => ({updateCount}));
      return <Text text={props.label + ': ' + count} />;
    }
    Counter = forwardRef(Counter);

    // Initial mount
    const counter = React.createRef(null);
    ReactNoop.render(<Counter label="Count" ref={counter} />);
    expect(Scheduler).toFlushAndYield(['Count: 0']);
    expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

    // Schedule some updates
    ReactNoop.batchedUpdates(() => {
      counter.current.updateCount(1);
      counter.current.updateCount(count => count + 10);
    });

    // Partially flush without committing
    expect(Scheduler).toFlushAndYieldThrough(['Count: 11']);
    expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

    // Interrupt with a high priority update
    ReactNoop.flushSync(() => {
      ReactNoop.render(<Counter label="Total" />);
    });
    expect(Scheduler).toHaveYielded(['Total: 0']);

    // Resume rendering
    expect(Scheduler).toFlushAndYield(['Total: 11']);
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

    expect(Scheduler).toFlushAndThrow(
      'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
        ' one of the following reasons:\n' +
        '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
        '2. You might be breaking the Rules of Hooks\n' +
        '3. You might have more than one copy of React in the same app\n' +
        'See https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.',
    );

    // Confirm that a subsequent hook works properly.
    function GoodCounter(props, ref) {
      const [count] = useState(props.initialCount);
      return <Text text={count} />;
    }
    ReactNoop.render(<GoodCounter initialCount={10} />);
    expect(Scheduler).toFlushAndYield([10]);
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
    expect(() =>
      expect(Scheduler).toFlushAndThrow(
        'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen ' +
          'for one of the following reasons:\n' +
          '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
          '2. You might be breaking the Rules of Hooks\n' +
          '3. You might have more than one copy of React in the same app\n' +
          'See https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.',
      ),
    ).toWarnDev(
      'Warning: The <Counter /> component appears to be a function component that returns a class instance. ' +
        'Change Counter to a class that extends React.Component instead. ' +
        "If you can't use a class try assigning the prototype on the function as a workaround. " +
        '`Counter.prototype = React.Component.prototype`. ' +
        "Don't use an arrow function since it cannot be called with `new` by React.",
      {withoutStack: true},
    );

    // Confirm that a subsequent hook works properly.
    function GoodCounter(props) {
      const [count] = useState(props.initialCount);
      return <Text text={count} />;
    }
    ReactNoop.render(<GoodCounter initialCount={10} />);
    expect(Scheduler).toFlushAndYield([10]);
  });

  it('throws when called outside the render phase', () => {
    expect(() => useState(0)).toThrow(
      'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
        ' one of the following reasons:\n' +
        '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
        '2. You might be breaking the Rules of Hooks\n' +
        '3. You might have more than one copy of React in the same app\n' +
        'See https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.',
    );
  });

  describe('useState', () => {
    it('simple mount and update', () => {
      function Counter(props, ref) {
        const [count, updateCount] = useState(0);
        useImperativeHandle(ref, () => ({updateCount}));
        return <Text text={'Count: ' + count} />;
      }
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      ReactNoop.render(<Counter ref={counter} />);
      expect(Scheduler).toFlushAndYield(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      act(() => counter.current.updateCount(1));
      expect(Scheduler).toHaveYielded(['Count: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);

      act(() => counter.current.updateCount(count => count + 10));
      expect(Scheduler).toHaveYielded(['Count: 11']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 11')]);
    });

    it('lazy state initializer', () => {
      function Counter(props, ref) {
        const [count, updateCount] = useState(() => {
          Scheduler.unstable_yieldValue('getInitialState');
          return props.initialState;
        });
        useImperativeHandle(ref, () => ({updateCount}));
        return <Text text={'Count: ' + count} />;
      }
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      ReactNoop.render(<Counter initialState={42} ref={counter} />);
      expect(Scheduler).toFlushAndYield(['getInitialState', 'Count: 42']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 42')]);

      act(() => counter.current.updateCount(7));
      expect(Scheduler).toHaveYielded(['Count: 7']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 7')]);
    });

    it('multiple states', () => {
      function Counter(props, ref) {
        const [count, updateCount] = useState(0);
        const [label, updateLabel] = useState('Count');
        useImperativeHandle(ref, () => ({updateCount, updateLabel}));
        return <Text text={label + ': ' + count} />;
      }
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      ReactNoop.render(<Counter ref={counter} />);
      expect(Scheduler).toFlushAndYield(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      act(() => counter.current.updateCount(7));
      expect(Scheduler).toHaveYielded(['Count: 7']);

      act(() => counter.current.updateLabel('Total'));
      expect(Scheduler).toHaveYielded(['Total: 7']);
    });

    it('returns the same updater function every time', () => {
      let updaters = [];
      function Counter() {
        const [count, updateCount] = useState(0);
        updaters.push(updateCount);
        return <Text text={'Count: ' + count} />;
      }
      ReactNoop.render(<Counter />);
      expect(Scheduler).toFlushAndYield(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      act(() => updaters[0](1));
      expect(Scheduler).toHaveYielded(['Count: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);

      act(() => updaters[0](count => count + 10));
      expect(Scheduler).toHaveYielded(['Count: 11']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 11')]);

      expect(updaters).toEqual([updaters[0], updaters[0], updaters[0]]);
    });

    it('warns on set after unmount', () => {
      let _updateCount;
      function Counter(props, ref) {
        const [, updateCount] = useState(0);
        _updateCount = updateCount;
        return null;
      }

      ReactNoop.render(<Counter />);
      expect(Scheduler).toFlushWithoutYielding();
      ReactNoop.render(null);
      expect(Scheduler).toFlushWithoutYielding();
      expect(() => act(() => _updateCount(1))).toWarnDev(
        "Warning: Can't perform a React state update on an unmounted " +
          'component. This is a no-op, but it indicates a memory leak in your ' +
          'application. To fix, cancel all subscriptions and asynchronous ' +
          'tasks in a useEffect cleanup function.\n' +
          '    in Counter (at **)',
      );
    });

    it('works with memo', () => {
      let _updateCount;
      function Counter(props) {
        const [count, updateCount] = useState(0);
        _updateCount = updateCount;
        return <Text text={'Count: ' + count} />;
      }
      Counter = memo(Counter);

      ReactNoop.render(<Counter />);
      expect(Scheduler).toFlushAndYield(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      ReactNoop.render(<Counter />);
      expect(Scheduler).toFlushAndYield([]);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      act(() => _updateCount(1));
      expect(Scheduler).toHaveYielded(['Count: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
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
      expect(Scheduler).toFlushAndYield(['Scrolling down: false']);
      expect(ReactNoop.getChildren()).toEqual([span('Scrolling down: false')]);

      ReactNoop.render(<ScrollView row={5} />);
      expect(Scheduler).toFlushAndYield(['Scrolling down: true']);
      expect(ReactNoop.getChildren()).toEqual([span('Scrolling down: true')]);

      ReactNoop.render(<ScrollView row={5} />);
      expect(Scheduler).toFlushAndYield(['Scrolling down: true']);
      expect(ReactNoop.getChildren()).toEqual([span('Scrolling down: true')]);

      ReactNoop.render(<ScrollView row={10} />);
      expect(Scheduler).toFlushAndYield(['Scrolling down: true']);
      expect(ReactNoop.getChildren()).toEqual([span('Scrolling down: true')]);

      ReactNoop.render(<ScrollView row={2} />);
      expect(Scheduler).toFlushAndYield(['Scrolling down: false']);
      expect(ReactNoop.getChildren()).toEqual([span('Scrolling down: false')]);

      ReactNoop.render(<ScrollView row={2} />);
      expect(Scheduler).toFlushAndYield(['Scrolling down: false']);
      expect(ReactNoop.getChildren()).toEqual([span('Scrolling down: false')]);
    });

    it('keeps restarting until there are no more new updates', () => {
      function Counter({row: newRow}) {
        let [count, setCount] = useState(0);
        if (count < 3) {
          setCount(count + 1);
        }
        Scheduler.unstable_yieldValue('Render: ' + count);
        return <Text text={count} />;
      }

      ReactNoop.render(<Counter />);
      expect(Scheduler).toFlushAndYield([
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
        Scheduler.unstable_yieldValue('Render: ' + count);
        return <Text text={count} />;
      }

      ReactNoop.render(<Counter />);
      expect(Scheduler).toFlushAndYield([
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
        Scheduler.unstable_yieldValue('Render: ' + count);
        return <Text text={count} />;
      }
      ReactNoop.render(<Counter />);
      expect(Scheduler).toFlushAndThrow(
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
        Scheduler.unstable_yieldValue('Render: ' + count);
        return <Text text={count} />;
      }

      ReactNoop.render(<Counter />);
      expect(Scheduler).toFlushAndYield([
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
        useImperativeHandle(ref, () => ({dispatch}));
        if (count < 20) {
          dispatch('increment');
          // Swap reducers each time we increment
          if (reducer === reducerA) {
            setReducer(() => reducerB);
          } else {
            setReducer(() => reducerA);
          }
        }
        Scheduler.unstable_yieldValue('Render: ' + count);
        return <Text text={count} />;
      }
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      ReactNoop.render(<Counter ref={counter} />);
      expect(Scheduler).toFlushAndYield([
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
      ReactNoop.act(() => {
        counter.current.dispatch('reset');
      });
      ReactNoop.render(<Counter ref={counter} />);
      expect(Scheduler).toHaveYielded([
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
        useImperativeHandle(ref, () => ({dispatch}));
        return <Text text={'Count: ' + count} />;
      }
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      ReactNoop.render(<Counter ref={counter} />);
      expect(Scheduler).toFlushAndYield(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      act(() => counter.current.dispatch(INCREMENT));
      expect(Scheduler).toHaveYielded(['Count: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      act(() => {
        counter.current.dispatch(DECREMENT);
        counter.current.dispatch(DECREMENT);
        counter.current.dispatch(DECREMENT);
      });

      expect(Scheduler).toHaveYielded(['Count: -2']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: -2')]);
    });

    it('lazy init', () => {
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
        const [count, dispatch] = useReducer(reducer, props, p => {
          Scheduler.unstable_yieldValue('Init');
          return p.initialCount;
        });
        useImperativeHandle(ref, () => ({dispatch}));
        return <Text text={'Count: ' + count} />;
      }
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      ReactNoop.render(<Counter initialCount={10} ref={counter} />);
      expect(Scheduler).toFlushAndYield(['Init', 'Count: 10']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 10')]);

      act(() => counter.current.dispatch(INCREMENT));
      expect(Scheduler).toHaveYielded(['Count: 11']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 11')]);

      act(() => {
        counter.current.dispatch(DECREMENT);
        counter.current.dispatch(DECREMENT);
        counter.current.dispatch(DECREMENT);
      });

      expect(Scheduler).toHaveYielded(['Count: 8']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 8')]);
    });

    // Regression test for https://github.com/facebook/react/issues/14360
    it('handles dispatches with mixed priorities', () => {
      const INCREMENT = 'INCREMENT';

      function reducer(state, action) {
        return action === INCREMENT ? state + 1 : state;
      }

      function Counter(props, ref) {
        const [count, dispatch] = useReducer(reducer, 0);
        useImperativeHandle(ref, () => ({dispatch}));
        return <Text text={'Count: ' + count} />;
      }

      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      ReactNoop.render(<Counter ref={counter} />);

      expect(Scheduler).toFlushAndYield(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      ReactNoop.batchedUpdates(() => {
        counter.current.dispatch(INCREMENT);
        counter.current.dispatch(INCREMENT);
        counter.current.dispatch(INCREMENT);
      });

      ReactNoop.flushSync(() => {
        counter.current.dispatch(INCREMENT);
      });
      expect(Scheduler).toHaveYielded(['Count: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);

      expect(Scheduler).toFlushAndYield(['Count: 4']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 4')]);
    });
  });

  describe('useEffect', () => {
    it('simple mount and update', () => {
      function Counter(props) {
        useEffect(() => {
          Scheduler.unstable_yieldValue(`Passive effect [${props.count}]`);
        });
        return <Text text={'Count: ' + props.count} />;
      }
      act(() => {
        ReactNoop.render(<Counter count={0} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 0', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
        // Effects are deferred until after the commit
        expect(Scheduler).toFlushAndYield(['Passive effect [0]']);
      });

      act(() => {
        ReactNoop.render(<Counter count={1} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 1', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
        // Effects are deferred until after the commit
        expect(Scheduler).toFlushAndYield(['Passive effect [1]']);
      });
    });

    it('flushes passive effects even with sibling deletions', () => {
      function LayoutEffect(props) {
        useLayoutEffect(() => {
          Scheduler.unstable_yieldValue(`Layout effect`);
        });
        return <Text text="Layout" />;
      }
      function PassiveEffect(props) {
        useEffect(() => {
          Scheduler.unstable_yieldValue(`Passive effect`);
        }, []);
        return <Text text="Passive" />;
      }
      let passive = <PassiveEffect key="p" />;
      act(() => {
        ReactNoop.render([<LayoutEffect key="l" />, passive]);
        expect(Scheduler).toFlushAndYieldThrough([
          'Layout',
          'Passive',
          'Layout effect',
        ]);
        expect(ReactNoop.getChildren()).toEqual([
          span('Layout'),
          span('Passive'),
        ]);
        // Destroying the first child shouldn't prevent the passive effect from
        // being executed
        ReactNoop.render([passive]);
        expect(Scheduler).toFlushAndYield(['Passive effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Passive')]);
      });
      // exiting act calls flushPassiveEffects(), but there are none left to flush.
      expect(Scheduler).toHaveYielded([]);
    });

    it('flushes passive effects even if siblings schedule an update', () => {
      function PassiveEffect(props) {
        useEffect(() => {
          Scheduler.unstable_yieldValue('Passive effect');
        });
        return <Text text="Passive" />;
      }
      function LayoutEffect(props) {
        let [count, setCount] = useState(0);
        useLayoutEffect(() => {
          // Scheduling work shouldn't interfere with the queued passive effect
          if (count === 0) {
            setCount(1);
          }
          Scheduler.unstable_yieldValue('Layout effect ' + count);
        });
        return <Text text="Layout" />;
      }

      ReactNoop.render([<PassiveEffect key="p" />, <LayoutEffect key="l" />]);

      act(() => {
        expect(Scheduler).toFlushAndYield([
          'Passive',
          'Layout',
          'Layout effect 0',
          'Passive effect',
          'Layout',
          'Layout effect 1',
        ]);
      });

      expect(ReactNoop.getChildren()).toEqual([
        span('Passive'),
        span('Layout'),
      ]);
    });

    it('flushes passive effects even if siblings schedule a new root', () => {
      function PassiveEffect(props) {
        useEffect(() => {
          Scheduler.unstable_yieldValue('Passive effect');
        }, []);
        return <Text text="Passive" />;
      }
      function LayoutEffect(props) {
        useLayoutEffect(() => {
          Scheduler.unstable_yieldValue('Layout effect');
          // Scheduling work shouldn't interfere with the queued passive effect
          ReactNoop.renderToRootWithID(<Text text="New Root" />, 'root2');
        });
        return <Text text="Layout" />;
      }
      act(() => {
        ReactNoop.render([<PassiveEffect key="p" />, <LayoutEffect key="l" />]);
        expect(Scheduler).toFlushAndYield([
          'Passive',
          'Layout',
          'Layout effect',
          'Passive effect',
          'New Root',
        ]);
        expect(ReactNoop.getChildren()).toEqual([
          span('Passive'),
          span('Layout'),
        ]);
      });
    });

    it(
      'flushes effects serially by flushing old effects before flushing ' +
        "new ones, if they haven't already fired",
      () => {
        function getCommittedText() {
          const children = ReactNoop.getChildren();
          if (children === null) {
            return null;
          }
          return children[0].prop;
        }

        function Counter(props) {
          useEffect(() => {
            Scheduler.unstable_yieldValue(
              `Committed state when effect was fired: ${getCommittedText()}`,
            );
          });
          return <Text text={props.count} />;
        }
        act(() => {
          ReactNoop.render(<Counter count={0} />, () =>
            Scheduler.unstable_yieldValue('Sync effect'),
          );
          expect(Scheduler).toFlushAndYieldThrough([0, 'Sync effect']);
          expect(ReactNoop.getChildren()).toEqual([span(0)]);
          // Before the effects have a chance to flush, schedule another update
          ReactNoop.render(<Counter count={1} />, () =>
            Scheduler.unstable_yieldValue('Sync effect'),
          );
          expect(Scheduler).toFlushAndYieldThrough([
            // The previous effect flushes before the reconciliation
            'Committed state when effect was fired: 0',
            1,
            'Sync effect',
          ]);
          expect(ReactNoop.getChildren()).toEqual([span(1)]);
        });

        expect(Scheduler).toHaveYielded([
          'Committed state when effect was fired: 1',
        ]);
      },
    );

    it('updates have async priority', () => {
      function Counter(props) {
        const [count, updateCount] = useState('(empty)');
        useEffect(
          () => {
            Scheduler.unstable_yieldValue(`Schedule update [${props.count}]`);
            updateCount(props.count);
          },
          [props.count],
        );
        return <Text text={'Count: ' + count} />;
      }
      act(() => {
        ReactNoop.render(<Counter count={0} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough([
          'Count: (empty)',
          'Sync effect',
        ]);
        expect(ReactNoop.getChildren()).toEqual([span('Count: (empty)')]);
        ReactNoop.flushPassiveEffects();
        expect(Scheduler).toHaveYielded(['Schedule update [0]']);
        expect(Scheduler).toFlushAndYield(['Count: 0']);
      });

      act(() => {
        ReactNoop.render(<Counter count={1} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 0', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
        ReactNoop.flushPassiveEffects();
        expect(Scheduler).toHaveYielded(['Schedule update [1]']);
        expect(Scheduler).toFlushAndYield(['Count: 1']);
      });
    });

    it('updates have async priority even if effects are flushed early', () => {
      function Counter(props) {
        const [count, updateCount] = useState('(empty)');
        useEffect(
          () => {
            Scheduler.unstable_yieldValue(`Schedule update [${props.count}]`);
            updateCount(props.count);
          },
          [props.count],
        );
        return <Text text={'Count: ' + count} />;
      }
      act(() => {
        ReactNoop.render(<Counter count={0} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough([
          'Count: (empty)',
          'Sync effect',
        ]);
        expect(ReactNoop.getChildren()).toEqual([span('Count: (empty)')]);

        // Rendering again should flush the previous commit's effects
        ReactNoop.render(<Counter count={1} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough([
          'Schedule update [0]',
          'Count: 0',
        ]);
        expect(ReactNoop.getChildren()).toEqual([span('Count: (empty)')]);

        expect(Scheduler).toFlushAndYieldThrough(['Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
        ReactNoop.flushPassiveEffects();
        expect(Scheduler).toHaveYielded(['Schedule update [1]']);
        expect(Scheduler).toFlushAndYield(['Count: 1']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      });
    });

    it('flushes passive effects when flushing discrete updates', () => {
      let _updateCount;
      function Counter(props) {
        const [count, updateCount] = useState(0);
        _updateCount = updateCount;
        useEffect(() => {
          Scheduler.unstable_yieldValue(`Will set count to 1`);
          updateCount(1);
        }, []);
        return <Text text={'Count: ' + count} />;
      }

      // we explicitly wait for missing act() warnings here since
      // it's a lot harder to simulate this condition inside an act scope
      expect(() => {
        ReactNoop.render(<Counter count={0} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 0', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      }).toWarnDev(['An update to Counter ran an effect']);

      // A discrete event forces the passive effect to be flushed --
      // updateCount(1) happens first, so 2 wins.
      ReactNoop.flushDiscreteUpdates();
      ReactNoop.discreteUpdates(() => {
        // (use batchedUpdates to silence the act() warning)
        ReactNoop.batchedUpdates(() => {
          _updateCount(2);
        });
      });
      expect(Scheduler).toHaveYielded(['Will set count to 1']);
      expect(() => {
        expect(Scheduler).toFlushAndYield(['Count: 2']);
      }).toWarnDev([
        'An update to Counter ran an effect',
        'An update to Counter ran an effect',
      ]);

      expect(ReactNoop.getChildren()).toEqual([span('Count: 2')]);
    });

    it('flushes passive effects when flushing discrete updates (with tracing)', () => {
      const onInteractionScheduledWorkCompleted = jest.fn();
      const onWorkCanceled = jest.fn();
      SchedulerTracing.unstable_subscribe({
        onInteractionScheduledWorkCompleted,
        onInteractionTraced: jest.fn(),
        onWorkCanceled,
        onWorkScheduled: jest.fn(),
        onWorkStarted: jest.fn(),
        onWorkStopped: jest.fn(),
      });

      let _updateCount;
      function Counter(props) {
        const [count, updateCount] = useState(0);
        _updateCount = updateCount;
        useEffect(() => {
          expect(SchedulerTracing.unstable_getCurrent()).toMatchInteractions([
            tracingEvent,
          ]);
          Scheduler.unstable_yieldValue(`Will set count to 1`);
          updateCount(1);
        }, []);
        return <Text text={'Count: ' + count} />;
      }

      const tracingEvent = {id: 0, name: 'hello', timestamp: 0};
      // we explicitly wait for missing act() warnings here since
      // it's a lot harder to simulate this condition inside an act scope
      expect(() => {
        SchedulerTracing.unstable_trace(
          tracingEvent.name,
          tracingEvent.timestamp,
          () => {
            ReactNoop.render(<Counter count={0} />, () =>
              Scheduler.unstable_yieldValue('Sync effect'),
            );
          },
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 0', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      }).toWarnDev(['An update to Counter ran an effect']);

      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(0);

      // A discrete event forces the passive effect to be flushed --
      // updateCount(1) happens first, so 2 wins.
      ReactNoop.flushDiscreteUpdates();
      ReactNoop.discreteUpdates(() => {
        // (use batchedUpdates to silence the act() warning)
        ReactNoop.batchedUpdates(() => {
          _updateCount(2);
        });
      });
      expect(Scheduler).toHaveYielded(['Will set count to 1']);
      expect(() => {
        expect(Scheduler).toFlushAndYield(['Count: 2']);
      }).toWarnDev([
        'An update to Counter ran an effect',
        'An update to Counter ran an effect',
      ]);

      expect(ReactNoop.getChildren()).toEqual([span('Count: 2')]);

      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
      expect(onWorkCanceled).toHaveBeenCalledTimes(0);
    });

    it(
      'in legacy mode, useEffect is deferred and updates finish synchronously ' +
        '(in a single batch)',
      () => {
        function Counter(props) {
          const [count, updateCount] = useState('(empty)');
          useEffect(
            () => {
              // Update multiple times. These should all be batched together in
              // a single render.
              updateCount(props.count);
              updateCount(props.count);
              updateCount(props.count);
              updateCount(props.count);
              updateCount(props.count);
              updateCount(props.count);
            },
            [props.count],
          );
          return <Text text={'Count: ' + count} />;
        }
        act(() => {
          ReactNoop.renderLegacySyncRoot(<Counter count={0} />);
          // Even in sync mode, effects are deferred until after paint
          expect(Scheduler).toFlushAndYieldThrough(['Count: (empty)']);
          expect(ReactNoop.getChildren()).toEqual([span('Count: (empty)')]);
        });

        // effects get fored on exiting act()
        // There were multiple updates, but there should only be a
        // single render
        expect(Scheduler).toHaveYielded(['Count: 0']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      },
    );

    it('flushSync is not allowed', () => {
      function Counter(props) {
        const [count, updateCount] = useState('(empty)');
        useEffect(
          () => {
            Scheduler.unstable_yieldValue(`Schedule update [${props.count}]`);
            ReactNoop.flushSync(() => {
              updateCount(props.count);
            });
          },
          [props.count],
        );
        return <Text text={'Count: ' + count} />;
      }
      act(() => {
        ReactNoop.render(<Counter count={0} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough([
          'Count: (empty)',
          'Sync effect',
        ]);
        expect(ReactNoop.getChildren()).toEqual([span('Count: (empty)')]);
        expect(() => {
          ReactNoop.flushPassiveEffects();
        }).toThrow('flushSync was called from inside a lifecycle method');
      });
    });

    it('unmounts previous effect', () => {
      function Counter(props) {
        useEffect(() => {
          Scheduler.unstable_yieldValue(`Did create [${props.count}]`);
          return () => {
            Scheduler.unstable_yieldValue(`Did destroy [${props.count}]`);
          };
        });
        return <Text text={'Count: ' + props.count} />;
      }
      act(() => {
        ReactNoop.render(<Counter count={0} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 0', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      });

      expect(Scheduler).toHaveYielded(['Did create [0]']);

      act(() => {
        ReactNoop.render(<Counter count={1} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 1', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      });

      expect(Scheduler).toHaveYielded(['Did destroy [0]', 'Did create [1]']);
    });

    it('unmounts on deletion', () => {
      function Counter(props) {
        useEffect(() => {
          Scheduler.unstable_yieldValue(`Did create [${props.count}]`);
          return () => {
            Scheduler.unstable_yieldValue(`Did destroy [${props.count}]`);
          };
        });
        return <Text text={'Count: ' + props.count} />;
      }
      act(() => {
        ReactNoop.render(<Counter count={0} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 0', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      });

      expect(Scheduler).toHaveYielded(['Did create [0]']);

      ReactNoop.render(null);
      expect(Scheduler).toFlushAndYield(['Did destroy [0]']);
      expect(ReactNoop.getChildren()).toEqual([]);
    });

    it('unmounts on deletion after skipped effect', () => {
      function Counter(props) {
        useEffect(() => {
          Scheduler.unstable_yieldValue(`Did create [${props.count}]`);
          return () => {
            Scheduler.unstable_yieldValue(`Did destroy [${props.count}]`);
          };
        }, []);
        return <Text text={'Count: ' + props.count} />;
      }
      act(() => {
        ReactNoop.render(<Counter count={0} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 0', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      });

      expect(Scheduler).toHaveYielded(['Did create [0]']);

      act(() => {
        ReactNoop.render(<Counter count={1} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 1', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      });

      expect(Scheduler).toHaveYielded([]);

      ReactNoop.render(null);
      expect(Scheduler).toFlushAndYield(['Did destroy [0]']);
      expect(ReactNoop.getChildren()).toEqual([]);
    });

    it('always fires effects if no dependencies are provided', () => {
      function effect() {
        Scheduler.unstable_yieldValue(`Did create`);
        return () => {
          Scheduler.unstable_yieldValue(`Did destroy`);
        };
      }
      function Counter(props) {
        useEffect(effect);
        return <Text text={'Count: ' + props.count} />;
      }
      act(() => {
        ReactNoop.render(<Counter count={0} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 0', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      });

      expect(Scheduler).toHaveYielded(['Did create']);

      act(() => {
        ReactNoop.render(<Counter count={1} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 1', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      });

      expect(Scheduler).toHaveYielded(['Did destroy', 'Did create']);

      ReactNoop.render(null);
      expect(Scheduler).toFlushAndYield(['Did destroy']);
      expect(ReactNoop.getChildren()).toEqual([]);
    });

    it('skips effect if inputs have not changed', () => {
      function Counter(props) {
        const text = `${props.label}: ${props.count}`;
        useEffect(
          () => {
            Scheduler.unstable_yieldValue(`Did create [${text}]`);
            return () => {
              Scheduler.unstable_yieldValue(`Did destroy [${text}]`);
            };
          },
          [props.label, props.count],
        );
        return <Text text={text} />;
      }
      act(() => {
        ReactNoop.render(<Counter label="Count" count={0} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 0', 'Sync effect']);
      });

      expect(Scheduler).toHaveYielded(['Did create [Count: 0]']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      act(() => {
        ReactNoop.render(<Counter label="Count" count={1} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        // Count changed
        expect(Scheduler).toFlushAndYieldThrough(['Count: 1', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      });

      expect(Scheduler).toHaveYielded([
        'Did destroy [Count: 0]',
        'Did create [Count: 1]',
      ]);

      act(() => {
        ReactNoop.render(<Counter label="Count" count={1} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        // Nothing changed, so no effect should have fired
        expect(Scheduler).toFlushAndYieldThrough(['Count: 1', 'Sync effect']);
      });

      expect(Scheduler).toHaveYielded([]);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);

      act(() => {
        ReactNoop.render(<Counter label="Total" count={1} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        // Label changed
        expect(Scheduler).toFlushAndYieldThrough(['Total: 1', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Total: 1')]);
      });

      expect(Scheduler).toHaveYielded([
        'Did destroy [Count: 1]',
        'Did create [Total: 1]',
      ]);
    });

    it('multiple effects', () => {
      function Counter(props) {
        useEffect(() => {
          Scheduler.unstable_yieldValue(`Did commit 1 [${props.count}]`);
        });
        useEffect(() => {
          Scheduler.unstable_yieldValue(`Did commit 2 [${props.count}]`);
        });
        return <Text text={'Count: ' + props.count} />;
      }
      act(() => {
        ReactNoop.render(<Counter count={0} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 0', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      });

      expect(Scheduler).toHaveYielded(['Did commit 1 [0]', 'Did commit 2 [0]']);

      act(() => {
        ReactNoop.render(<Counter count={1} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 1', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      });
      expect(Scheduler).toHaveYielded(['Did commit 1 [1]', 'Did commit 2 [1]']);
    });

    it('unmounts all previous effects before creating any new ones', () => {
      function Counter(props) {
        useEffect(() => {
          Scheduler.unstable_yieldValue(`Mount A [${props.count}]`);
          return () => {
            Scheduler.unstable_yieldValue(`Unmount A [${props.count}]`);
          };
        });
        useEffect(() => {
          Scheduler.unstable_yieldValue(`Mount B [${props.count}]`);
          return () => {
            Scheduler.unstable_yieldValue(`Unmount B [${props.count}]`);
          };
        });
        return <Text text={'Count: ' + props.count} />;
      }
      act(() => {
        ReactNoop.render(<Counter count={0} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 0', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      });

      expect(Scheduler).toHaveYielded(['Mount A [0]', 'Mount B [0]']);

      act(() => {
        ReactNoop.render(<Counter count={1} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 1', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      });
      expect(Scheduler).toHaveYielded([
        'Unmount A [0]',
        'Unmount B [0]',
        'Mount A [1]',
        'Mount B [1]',
      ]);
    });

    it('handles errors on mount', () => {
      function Counter(props) {
        useEffect(() => {
          Scheduler.unstable_yieldValue(`Mount A [${props.count}]`);
          return () => {
            Scheduler.unstable_yieldValue(`Unmount A [${props.count}]`);
          };
        });
        useEffect(() => {
          Scheduler.unstable_yieldValue('Oops!');
          throw new Error('Oops!');
          // eslint-disable-next-line no-unreachable
          Scheduler.unstable_yieldValue(`Mount B [${props.count}]`);
          return () => {
            Scheduler.unstable_yieldValue(`Unmount B [${props.count}]`);
          };
        });
        return <Text text={'Count: ' + props.count} />;
      }
      act(() => {
        ReactNoop.render(<Counter count={0} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 0', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
        expect(() => ReactNoop.flushPassiveEffects()).toThrow('Oops');
      });

      expect(Scheduler).toHaveYielded([
        'Mount A [0]',
        'Oops!',
        // Clean up effect A. There's no effect B to clean-up, because it
        // never mounted.
        'Unmount A [0]',
      ]);
      expect(ReactNoop.getChildren()).toEqual([]);
    });

    it('handles errors on update', () => {
      function Counter(props) {
        useEffect(() => {
          Scheduler.unstable_yieldValue(`Mount A [${props.count}]`);
          return () => {
            Scheduler.unstable_yieldValue(`Unmount A [${props.count}]`);
          };
        });
        useEffect(() => {
          if (props.count === 1) {
            Scheduler.unstable_yieldValue('Oops!');
            throw new Error('Oops!');
          }
          Scheduler.unstable_yieldValue(`Mount B [${props.count}]`);
          return () => {
            Scheduler.unstable_yieldValue(`Unmount B [${props.count}]`);
          };
        });
        return <Text text={'Count: ' + props.count} />;
      }
      act(() => {
        ReactNoop.render(<Counter count={0} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 0', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
        ReactNoop.flushPassiveEffects();
        expect(Scheduler).toHaveYielded(['Mount A [0]', 'Mount B [0]']);
      });

      act(() => {
        // This update will trigger an error
        ReactNoop.render(<Counter count={1} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 1', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
        expect(() => ReactNoop.flushPassiveEffects()).toThrow('Oops');
        expect(Scheduler).toHaveYielded([
          'Unmount A [0]',
          'Unmount B [0]',
          'Mount A [1]',
          'Oops!',
          // Clean up effect A. There's no effect B to clean-up, because it
          // never mounted.
          'Unmount A [1]',
        ]);
        expect(ReactNoop.getChildren()).toEqual([]);
      });
    });

    it('handles errors on unmount', () => {
      function Counter(props) {
        useEffect(() => {
          Scheduler.unstable_yieldValue(`Mount A [${props.count}]`);
          return () => {
            Scheduler.unstable_yieldValue('Oops!');
            throw new Error('Oops!');
            // eslint-disable-next-line no-unreachable
            Scheduler.unstable_yieldValue(`Unmount A [${props.count}]`);
          };
        });
        useEffect(() => {
          Scheduler.unstable_yieldValue(`Mount B [${props.count}]`);
          return () => {
            Scheduler.unstable_yieldValue(`Unmount B [${props.count}]`);
          };
        });
        return <Text text={'Count: ' + props.count} />;
      }
      act(() => {
        ReactNoop.render(<Counter count={0} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 0', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
        ReactNoop.flushPassiveEffects();
        expect(Scheduler).toHaveYielded(['Mount A [0]', 'Mount B [0]']);
      });

      act(() => {
        // This update will trigger an error
        ReactNoop.render(<Counter count={1} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 1', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
        expect(() => ReactNoop.flushPassiveEffects()).toThrow('Oops');
        expect(Scheduler).toHaveYielded([
          'Oops!',
          // B unmounts even though an error was thrown in the previous effect
          'Unmount B [0]',
        ]);
        expect(ReactNoop.getChildren()).toEqual([]);
      });
    });

    it('works with memo', () => {
      function Counter({count}) {
        useLayoutEffect(() => {
          Scheduler.unstable_yieldValue('Mount: ' + count);
          return () => Scheduler.unstable_yieldValue('Unmount: ' + count);
        });
        return <Text text={'Count: ' + count} />;
      }
      Counter = memo(Counter);

      ReactNoop.render(<Counter count={0} />, () =>
        Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYieldThrough([
        'Count: 0',
        'Mount: 0',
        'Sync effect',
      ]);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      ReactNoop.render(<Counter count={1} />, () =>
        Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYieldThrough([
        'Count: 1',
        'Unmount: 0',
        'Mount: 1',
        'Sync effect',
      ]);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);

      ReactNoop.render(null);
      expect(Scheduler).toFlushAndYieldThrough(['Unmount: 1']);
      expect(ReactNoop.getChildren()).toEqual([]);
    });
  });

  describe('useLayoutEffect', () => {
    it('fires layout effects after the host has been mutated', () => {
      function getCommittedText() {
        const yields = Scheduler.unstable_clearYields();
        const children = ReactNoop.getChildren();
        Scheduler.unstable_yieldValue(yields);
        if (children === null) {
          return null;
        }
        return children[0].prop;
      }

      function Counter(props) {
        useLayoutEffect(() => {
          Scheduler.unstable_yieldValue(`Current: ${getCommittedText()}`);
        });
        return <Text text={props.count} />;
      }

      ReactNoop.render(<Counter count={0} />, () =>
        Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYieldThrough([
        [0],
        'Current: 0',
        'Sync effect',
      ]);
      expect(ReactNoop.getChildren()).toEqual([span(0)]);

      ReactNoop.render(<Counter count={1} />, () =>
        Scheduler.unstable_yieldValue('Sync effect'),
      );
      expect(Scheduler).toFlushAndYieldThrough([
        [1],
        'Current: 1',
        'Sync effect',
      ]);
      expect(ReactNoop.getChildren()).toEqual([span(1)]);
    });

    it('force flushes passive effects before firing new layout effects', () => {
      let committedText = '(empty)';

      function Counter(props) {
        useLayoutEffect(() => {
          // Normally this would go in a mutation effect, but this test
          // intentionally omits a mutation effect.
          committedText = props.count + '';

          Scheduler.unstable_yieldValue(
            `Mount layout [current: ${committedText}]`,
          );
          return () => {
            Scheduler.unstable_yieldValue(
              `Unmount layout [current: ${committedText}]`,
            );
          };
        });
        useEffect(() => {
          Scheduler.unstable_yieldValue(
            `Mount normal [current: ${committedText}]`,
          );
          return () => {
            Scheduler.unstable_yieldValue(
              `Unmount normal [current: ${committedText}]`,
            );
          };
        });
        return null;
      }

      act(() => {
        ReactNoop.render(<Counter count={0} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough([
          'Mount layout [current: 0]',
          'Sync effect',
        ]);
        expect(committedText).toEqual('0');
        ReactNoop.render(<Counter count={1} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough([
          'Mount normal [current: 0]',
          'Unmount layout [current: 0]',
          'Mount layout [current: 1]',
          'Sync effect',
        ]);
        expect(committedText).toEqual('1');
      });

      expect(Scheduler).toHaveYielded([
        'Unmount normal [current: 1]',
        'Mount normal [current: 1]',
      ]);
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
      expect(Scheduler).toFlushAndYield(['Increment', 'Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([
        span('Increment'),
        span('Count: 0'),
      ]);

      act(button.current.increment);
      expect(Scheduler).toHaveYielded([
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
      expect(Scheduler).toFlushAndYield([
        // Inputs did change this time
        'Increment',
        'Count: 1',
      ]);
      expect(ReactNoop.getChildren()).toEqual([
        span('Increment'),
        span('Count: 1'),
      ]);

      // Callback should have updated
      act(button.current.increment);
      expect(Scheduler).toHaveYielded(['Count: 11']);
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
            Scheduler.unstable_yieldValue(`Capitalize '${text}'`);
            return text.toUpperCase();
          },
          [text],
        );
        return <Text text={capitalizedText} />;
      }

      ReactNoop.render(<CapitalizedText text="hello" />);
      expect(Scheduler).toFlushAndYield(["Capitalize 'hello'", 'HELLO']);
      expect(ReactNoop.getChildren()).toEqual([span('HELLO')]);

      ReactNoop.render(<CapitalizedText text="hi" />);
      expect(Scheduler).toFlushAndYield(["Capitalize 'hi'", 'HI']);
      expect(ReactNoop.getChildren()).toEqual([span('HI')]);

      ReactNoop.render(<CapitalizedText text="hi" />);
      expect(Scheduler).toFlushAndYield(['HI']);
      expect(ReactNoop.getChildren()).toEqual([span('HI')]);

      ReactNoop.render(<CapitalizedText text="goodbye" />);
      expect(Scheduler).toFlushAndYield(["Capitalize 'goodbye'", 'GOODBYE']);
      expect(ReactNoop.getChildren()).toEqual([span('GOODBYE')]);
    });

    it('always re-computes if no inputs are provided', () => {
      function LazyCompute(props) {
        const computed = useMemo(props.compute);
        return <Text text={computed} />;
      }

      function computeA() {
        Scheduler.unstable_yieldValue('compute A');
        return 'A';
      }

      function computeB() {
        Scheduler.unstable_yieldValue('compute B');
        return 'B';
      }

      ReactNoop.render(<LazyCompute compute={computeA} />);
      expect(Scheduler).toFlushAndYield(['compute A', 'A']);

      ReactNoop.render(<LazyCompute compute={computeA} />);
      expect(Scheduler).toFlushAndYield(['compute A', 'A']);

      ReactNoop.render(<LazyCompute compute={computeA} />);
      expect(Scheduler).toFlushAndYield(['compute A', 'A']);

      ReactNoop.render(<LazyCompute compute={computeB} />);
      expect(Scheduler).toFlushAndYield(['compute B', 'B']);
    });

    it('should not invoke memoized function during re-renders unless inputs change', () => {
      function LazyCompute(props) {
        const computed = useMemo(() => props.compute(props.input), [
          props.input,
        ]);
        const [count, setCount] = useState(0);
        if (count < 3) {
          setCount(count + 1);
        }
        return <Text text={computed} />;
      }

      function compute(val) {
        Scheduler.unstable_yieldValue('compute ' + val);
        return val;
      }

      ReactNoop.render(<LazyCompute compute={compute} input="A" />);
      expect(Scheduler).toFlushAndYield(['compute A', 'A']);

      ReactNoop.render(<LazyCompute compute={compute} input="A" />);
      expect(Scheduler).toFlushAndYield(['A']);

      ReactNoop.render(<LazyCompute compute={compute} input="B" />);
      expect(Scheduler).toFlushAndYield(['compute B', 'B']);
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
            Scheduler.unstable_yieldValue('ping: ' + value);
          },
          100,
          [],
        );
        return null;
      }

      act(() => {
        ReactNoop.render(<App />);
      });
      expect(Scheduler).toHaveYielded([]);

      ping(1);
      ping(2);
      ping(3);

      expect(Scheduler).toHaveYielded([]);

      jest.advanceTimersByTime(100);

      expect(Scheduler).toHaveYielded(['ping: 3']);

      ping(4);
      jest.advanceTimersByTime(20);
      ping(5);
      ping(6);
      jest.advanceTimersByTime(80);

      expect(Scheduler).toHaveYielded([]);

      jest.advanceTimersByTime(20);
      expect(Scheduler).toHaveYielded(['ping: 6']);
    });

    it('should return the same ref during re-renders', () => {
      function Counter() {
        const ref = useRef('val');
        const [count, setCount] = useState(0);
        const [firstRef] = useState(ref);

        if (firstRef !== ref) {
          throw new Error('should never change');
        }

        if (count < 3) {
          setCount(count + 1);
        }

        return <Text text={ref.current} />;
      }

      ReactNoop.render(<Counter />);
      expect(Scheduler).toFlushAndYield(['val']);

      ReactNoop.render(<Counter />);
      expect(Scheduler).toFlushAndYield(['val']);
    });
  });

  describe('useImperativeHandle', () => {
    it('does not update when deps are the same', () => {
      const INCREMENT = 'INCREMENT';

      function reducer(state, action) {
        return action === INCREMENT ? state + 1 : state;
      }

      function Counter(props, ref) {
        const [count, dispatch] = useReducer(reducer, 0);
        useImperativeHandle(ref, () => ({count, dispatch}), []);
        return <Text text={'Count: ' + count} />;
      }

      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      ReactNoop.render(<Counter ref={counter} />);
      expect(Scheduler).toFlushAndYield(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      expect(counter.current.count).toBe(0);

      act(() => {
        counter.current.dispatch(INCREMENT);
      });
      expect(Scheduler).toHaveYielded(['Count: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      // Intentionally not updated because of [] deps:
      expect(counter.current.count).toBe(0);
    });

    // Regression test for https://github.com/facebook/react/issues/14782
    it('automatically updates when deps are not specified', () => {
      const INCREMENT = 'INCREMENT';

      function reducer(state, action) {
        return action === INCREMENT ? state + 1 : state;
      }

      function Counter(props, ref) {
        const [count, dispatch] = useReducer(reducer, 0);
        useImperativeHandle(ref, () => ({count, dispatch}));
        return <Text text={'Count: ' + count} />;
      }

      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      ReactNoop.render(<Counter ref={counter} />);
      expect(Scheduler).toFlushAndYield(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      expect(counter.current.count).toBe(0);

      act(() => {
        counter.current.dispatch(INCREMENT);
      });
      expect(Scheduler).toHaveYielded(['Count: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      expect(counter.current.count).toBe(1);
    });

    it('updates when deps are different', () => {
      const INCREMENT = 'INCREMENT';

      function reducer(state, action) {
        return action === INCREMENT ? state + 1 : state;
      }

      let totalRefUpdates = 0;
      function Counter(props, ref) {
        const [count, dispatch] = useReducer(reducer, 0);
        useImperativeHandle(
          ref,
          () => {
            totalRefUpdates++;
            return {count, dispatch};
          },
          [count],
        );
        return <Text text={'Count: ' + count} />;
      }

      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      ReactNoop.render(<Counter ref={counter} />);
      expect(Scheduler).toFlushAndYield(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      expect(counter.current.count).toBe(0);
      expect(totalRefUpdates).toBe(1);

      act(() => {
        counter.current.dispatch(INCREMENT);
      });
      expect(Scheduler).toHaveYielded(['Count: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      expect(counter.current.count).toBe(1);
      expect(totalRefUpdates).toBe(2);

      // Update that doesn't change the ref dependencies
      ReactNoop.render(<Counter ref={counter} />);
      expect(Scheduler).toFlushAndYield(['Count: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      expect(counter.current.count).toBe(1);
      expect(totalRefUpdates).toBe(2); // Should not increase since last time
    });
  });

  describe('progressive enhancement (not supported)', () => {
    it('mount additional state', () => {
      let updateA;
      let updateB;
      // let updateC;

      function App(props) {
        const [A, _updateA] = useState(0);
        const [B, _updateB] = useState(0);
        updateA = _updateA;
        updateB = _updateB;

        let C;
        if (props.loadC) {
          useState(0);
        } else {
          C = '[not loaded]';
        }

        return <Text text={`A: ${A}, B: ${B}, C: ${C}`} />;
      }

      ReactNoop.render(<App loadC={false} />);
      expect(Scheduler).toFlushAndYield(['A: 0, B: 0, C: [not loaded]']);
      expect(ReactNoop.getChildren()).toEqual([
        span('A: 0, B: 0, C: [not loaded]'),
      ]);

      act(() => {
        updateA(2);
        updateB(3);
      });

      expect(Scheduler).toHaveYielded(['A: 2, B: 3, C: [not loaded]']);
      expect(ReactNoop.getChildren()).toEqual([
        span('A: 2, B: 3, C: [not loaded]'),
      ]);

      ReactNoop.render(<App loadC={true} />);
      expect(() => {
        expect(() => {
          expect(Scheduler).toFlushAndYield(['A: 2, B: 3, C: 0']);
        }).toThrow('Rendered more hooks than during the previous render');
      }).toWarnDev([
        'Warning: React has detected a change in the order of Hooks called by App. ' +
          'This will lead to bugs and errors if not fixed. For more information, ' +
          'read the Rules of Hooks: https://fb.me/rules-of-hooks\n\n' +
          '   Previous render            Next render\n' +
          '   ------------------------------------------------------\n' +
          '1. useState                   useState\n' +
          '2. useState                   useState\n' +
          '3. undefined                  useState\n' +
          '   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n\n',
      ]);

      // Uncomment if/when we support this again
      // expect(ReactNoop.getChildren()).toEqual([span('A: 2, B: 3, C: 0')]);

      // updateC(4);
      // expect(Scheduler).toFlushAndYield(['A: 2, B: 3, C: 4']);
      // expect(ReactNoop.getChildren()).toEqual([span('A: 2, B: 3, C: 4')]);
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
      expect(Scheduler).toFlushAndYield(['A: 0, B: 0, C: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('A: 0, B: 0, C: 0')]);
      act(() => {
        updateA(2);
        updateB(3);
        updateC(4);
      });
      expect(Scheduler).toHaveYielded(['A: 2, B: 3, C: 4']);
      expect(ReactNoop.getChildren()).toEqual([span('A: 2, B: 3, C: 4')]);
      ReactNoop.render(<App loadC={false} />);
      expect(Scheduler).toFlushAndThrow(
        'Rendered fewer hooks than expected. This may be caused by an ' +
          'accidental early return statement.',
      );
    });

    it('unmount effects', () => {
      function App(props) {
        useEffect(() => {
          Scheduler.unstable_yieldValue('Mount A');
          return () => {
            Scheduler.unstable_yieldValue('Unmount A');
          };
        }, []);

        if (props.showMore) {
          useEffect(() => {
            Scheduler.unstable_yieldValue('Mount B');
            return () => {
              Scheduler.unstable_yieldValue('Unmount B');
            };
          }, []);
        }

        return null;
      }

      act(() => {
        ReactNoop.render(<App showMore={false} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Sync effect']);
      });

      expect(Scheduler).toHaveYielded(['Mount A']);

      act(() => {
        ReactNoop.render(<App showMore={true} />);
        expect(() => {
          expect(() => {
            expect(Scheduler).toFlushAndYield([]);
          }).toThrow('Rendered more hooks than during the previous render');
        }).toWarnDev([
          'Warning: React has detected a change in the order of Hooks called by App. ' +
            'This will lead to bugs and errors if not fixed. For more information, ' +
            'read the Rules of Hooks: https://fb.me/rules-of-hooks\n\n' +
            '   Previous render            Next render\n' +
            '   ------------------------------------------------------\n' +
            '1. useEffect                  useEffect\n' +
            '2. undefined                  useEffect\n' +
            '   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n\n',
        ]);
      });

      // Uncomment if/when we support this again
      // ReactNoop.flushPassiveEffects();
      // expect(Scheduler).toHaveYielded(['Mount B']);

      // ReactNoop.render(<App showMore={false} />);
      // expect(Scheduler).toFlushAndThrow(
      //   'Rendered fewer hooks than expected. This may be caused by an ' +
      //     'accidental early return statement.',
      // );
    });
  });

  it('eager bailout optimization should always compare to latest rendered reducer', () => {
    // Edge case based on a bug report
    let setCounter;
    function App() {
      const [counter, _setCounter] = useState(1);
      setCounter = _setCounter;
      return <Component count={counter} />;
    }

    function Component({count}) {
      const [state, dispatch] = useReducer(() => {
        // This reducer closes over a value from props. If the reducer is not
        // properly updated, the eager reducer will compare to an old value
        // and bail out incorrectly.
        Scheduler.unstable_yieldValue('Reducer: ' + count);
        return count;
      }, -1);
      useEffect(
        () => {
          Scheduler.unstable_yieldValue('Effect: ' + count);
          dispatch();
        },
        [count],
      );
      Scheduler.unstable_yieldValue('Render: ' + state);
      return count;
    }

    act(() => {
      ReactNoop.render(<App />);
      expect(Scheduler).toFlushAndYield([
        'Render: -1',
        'Effect: 1',
        'Reducer: 1',
        'Reducer: 1',
        'Render: 1',
      ]);
      expect(ReactNoop).toMatchRenderedOutput('1');
    });

    act(() => {
      setCounter(2);
    });
    expect(Scheduler).toHaveYielded([
      'Render: 1',
      'Effect: 2',
      'Reducer: 2',
      'Reducer: 2',
      'Render: 2',
    ]);
    expect(ReactNoop).toMatchRenderedOutput('2');
  });

  it('should update latest rendered reducer when a preceding state receives a render phase update', () => {
    // Similar to previous test, except using a preceding render phase update
    // instead of new props.
    let dispatch;
    function App() {
      const [step, setStep] = useState(0);
      const [shadow, _dispatch] = useReducer(() => step, step);
      dispatch = _dispatch;

      if (step < 5) {
        setStep(step + 1);
      }

      Scheduler.unstable_yieldValue(`Step: ${step}, Shadow: ${shadow}`);
      return shadow;
    }

    ReactNoop.render(<App />);
    expect(Scheduler).toFlushAndYield([
      'Step: 0, Shadow: 0',
      'Step: 1, Shadow: 0',
      'Step: 2, Shadow: 0',
      'Step: 3, Shadow: 0',
      'Step: 4, Shadow: 0',
      'Step: 5, Shadow: 0',
    ]);
    expect(ReactNoop).toMatchRenderedOutput('0');

    act(() => dispatch());
    expect(Scheduler).toHaveYielded(['Step: 5, Shadow: 5']);
    expect(ReactNoop).toMatchRenderedOutput('5');
  });

  describe('revertPassiveEffectsChange', () => {
    it('flushes serial effects before enqueueing work', () => {
      jest.resetModules();

      ReactFeatureFlags = require('shared/ReactFeatureFlags');
      ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
      ReactFeatureFlags.enableSchedulerTracing = true;
      ReactFeatureFlags.revertPassiveEffectsChange = true;
      React = require('react');
      ReactNoop = require('react-noop-renderer');
      Scheduler = require('scheduler');
      SchedulerTracing = require('scheduler/tracing');
      useState = React.useState;
      useEffect = React.useEffect;
      act = ReactNoop.act;

      let _updateCount;
      function Counter(props) {
        const [count, updateCount] = useState(0);
        _updateCount = updateCount;
        useEffect(() => {
          Scheduler.unstable_yieldValue(`Will set count to 1`);
          updateCount(1);
        }, []);
        return <Text text={'Count: ' + count} />;
      }

      act(() => {
        ReactNoop.render(<Counter count={0} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 0', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
        // Enqueuing this update forces the passive effect to be flushed --
        // updateCount(1) happens first, so 2 wins.
        act(() => _updateCount(2));
        expect(Scheduler).toHaveYielded(['Will set count to 1']);
        expect(Scheduler).toFlushAndYield(['Count: 2']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 2')]);
      });
    });
  });
});
