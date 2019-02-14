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

// These tests use React Noop Renderer. All new tests should use React Test
// Renderer and go in ReactHooks-test; plan is gradually migrate the noop tests
// to that file.
describe('ReactHooksWithNoopRenderer', () => {
  beforeEach(() => {
    jest.resetModules();

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.enableSchedulerTracing = true;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
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
    ReactNoop.yield(props.text);
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
    expect(ReactNoop.flush()).toEqual(['Count: 0']);
    expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

    // Schedule some updates
    act(() => {
      counter.current.updateCount(1);
      counter.current.updateCount(count => count + 10);
    });

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
      'Hooks can only be called inside the body of a function component.',
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
      'Hooks can only be called inside the body of a function component.',
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
      'Hooks can only be called inside the body of a function component.',
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
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      act(() => counter.current.updateCount(1));
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);

      act(() => counter.current.updateCount(count => count + 10));
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 11')]);
    });

    it('lazy state initializer', () => {
      function Counter(props, ref) {
        const [count, updateCount] = useState(() => {
          ReactNoop.yield('getInitialState');
          return props.initialState;
        });
        useImperativeHandle(ref, () => ({updateCount}));
        return <Text text={'Count: ' + count} />;
      }
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      ReactNoop.render(<Counter initialState={42} ref={counter} />);
      expect(ReactNoop.flush()).toEqual(['getInitialState', 'Count: 42']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 42')]);

      act(() => counter.current.updateCount(7));
      expect(ReactNoop.flush()).toEqual(['Count: 7']);
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
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      act(() => counter.current.updateCount(7));
      expect(ReactNoop.flush()).toEqual(['Count: 7']);

      act(() => counter.current.updateLabel('Total'));
      expect(ReactNoop.flush()).toEqual(['Total: 7']);
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

      act(() => updaters[0](1));
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);

      act(() => updaters[0](count => count + 10));
      ReactNoop.flush();
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
      ReactNoop.flush();
      ReactNoop.render(null);
      ReactNoop.flush();
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
      expect(ReactNoop.flush()).toEqual(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      ReactNoop.render(<Counter />);
      expect(ReactNoop.flush()).toEqual([]);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      act(() => _updateCount(1));
      expect(ReactNoop.flush()).toEqual(['Count: 1']);
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
      ReactNoop.act(() => {
        counter.current.dispatch('reset');
      });
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
        useImperativeHandle(ref, () => ({dispatch}));
        return <Text text={'Count: ' + count} />;
      }
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      ReactNoop.render(<Counter ref={counter} />);
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      act(() => counter.current.dispatch(INCREMENT));
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      act(() => {
        counter.current.dispatch(DECREMENT);
        counter.current.dispatch(DECREMENT);
        counter.current.dispatch(DECREMENT);
      });

      ReactNoop.flush();
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
          ReactNoop.yield('Init');
          return p.initialCount;
        });
        useImperativeHandle(ref, () => ({dispatch}));
        return <Text text={'Count: ' + count} />;
      }
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      ReactNoop.render(<Counter initialCount={10} ref={counter} />);
      expect(ReactNoop.flush()).toEqual(['Init', 'Count: 10']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 10')]);

      act(() => counter.current.dispatch(INCREMENT));
      expect(ReactNoop.flush()).toEqual(['Count: 11']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 11')]);

      act(() => {
        counter.current.dispatch(DECREMENT);
        counter.current.dispatch(DECREMENT);
        counter.current.dispatch(DECREMENT);
      });

      expect(ReactNoop.flush()).toEqual(['Count: 8']);
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

      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      act(() => {
        counter.current.dispatch(INCREMENT);
        counter.current.dispatch(INCREMENT);
        counter.current.dispatch(INCREMENT);
      });

      ReactNoop.flushSync(() => {
        counter.current.dispatch(INCREMENT);
      });
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);

      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 4')]);
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
      expect(ReactNoop.flush()).toEqual(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual(['Did commit [0]']);

      ReactNoop.render(<Counter count={1} />);
      expect(ReactNoop.flush()).toEqual(['Count: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      // Effects are deferred until after the commit
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual(['Did commit [1]']);
    });

    it('flushes passive effects even with sibling deletions', () => {
      function LayoutEffect(props) {
        useLayoutEffect(() => {
          ReactNoop.yield(`Layout effect`);
        });
        return <Text text="Layout" />;
      }
      function PassiveEffect(props) {
        useEffect(() => {
          ReactNoop.yield(`Passive effect`);
        }, []);
        return <Text text="Passive" />;
      }
      let passive = <PassiveEffect key="p" />;
      ReactNoop.render([<LayoutEffect key="l" />, passive]);
      expect(ReactNoop.flush()).toEqual(['Layout', 'Passive', 'Layout effect']);
      expect(ReactNoop.getChildren()).toEqual([
        span('Layout'),
        span('Passive'),
      ]);

      // Destroying the first child shouldn't prevent the passive effect from
      // being executed
      ReactNoop.render([passive]);
      expect(ReactNoop.flush()).toEqual(['Passive effect']);
      expect(ReactNoop.getChildren()).toEqual([span('Passive')]);

      // (No effects are left to flush.)
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual(null);
    });

    it('flushes passive effects even if siblings schedule an update', () => {
      function PassiveEffect(props) {
        useEffect(() => {
          ReactNoop.yield('Passive effect');
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
          ReactNoop.yield('Layout effect ' + count);
        });
        return <Text text="Layout" />;
      }

      ReactNoop.render([<PassiveEffect key="p" />, <LayoutEffect key="l" />]);

      act(() => {
        expect(ReactNoop.flush()).toEqual([
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
          ReactNoop.yield('Passive effect');
        }, []);
        return <Text text="Passive" />;
      }
      function LayoutEffect(props) {
        useLayoutEffect(() => {
          ReactNoop.yield('Layout effect');
          // Scheduling work shouldn't interfere with the queued passive effect
          ReactNoop.renderToRootWithID(<Text text="New Root" />, 'root2');
        });
        return <Text text="Layout" />;
      }
      ReactNoop.render([<PassiveEffect key="p" />, <LayoutEffect key="l" />]);
      expect(ReactNoop.flush()).toEqual([
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
            ReactNoop.yield(
              `Committed state when effect was fired: ${getCommittedText()}`,
            );
          });
          return <Text text={props.count} />;
        }
        ReactNoop.render(<Counter count={0} />);
        expect(ReactNoop.flush()).toEqual([0]);
        expect(ReactNoop.getChildren()).toEqual([span(0)]);

        // Before the effects have a chance to flush, schedule another update
        ReactNoop.render(<Counter count={1} />);
        expect(ReactNoop.flush()).toEqual([
          // The previous effect flushes before the reconciliation
          'Committed state when effect was fired: 0',
          1,
        ]);
        expect(ReactNoop.getChildren()).toEqual([span(1)]);

        ReactNoop.flushPassiveEffects();
        expect(ReactNoop.clearYields()).toEqual([
          'Committed state when effect was fired: 1',
        ]);
      },
    );

    it('updates have async priority', () => {
      function Counter(props) {
        const [count, updateCount] = useState('(empty)');
        useEffect(
          () => {
            ReactNoop.yield(`Schedule update [${props.count}]`);
            updateCount(props.count);
          },
          [props.count],
        );
        return <Text text={'Count: ' + count} />;
      }
      ReactNoop.render(<Counter count={0} />);
      expect(ReactNoop.flush()).toEqual(['Count: (empty)']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: (empty)')]);
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual(['Schedule update [0]']);
      expect(ReactNoop.flush()).toEqual(['Count: 0']);

      ReactNoop.render(<Counter count={1} />);
      expect(ReactNoop.flush()).toEqual(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual(['Schedule update [1]']);
      expect(ReactNoop.flush()).toEqual(['Count: 1']);
    });

    it('updates have async priority even if effects are flushed early', () => {
      function Counter(props) {
        const [count, updateCount] = useState('(empty)');
        useEffect(
          () => {
            ReactNoop.yield(`Schedule update [${props.count}]`);
            updateCount(props.count);
          },
          [props.count],
        );
        return <Text text={'Count: ' + count} />;
      }
      ReactNoop.render(<Counter count={0} />);
      expect(ReactNoop.flush()).toEqual(['Count: (empty)']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: (empty)')]);

      // Rendering again should flush the previous commit's effects
      ReactNoop.render(<Counter count={1} />);
      ReactNoop.flushThrough(['Schedule update [0]', 'Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: (empty)')]);

      ReactNoop.batchedUpdates(() => {
        expect(ReactNoop.flush()).toEqual([]);
      });

      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.flush()).toEqual(['Schedule update [1]', 'Count: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
    });

    it('flushes serial effects before enqueueing work', () => {
      let _updateCount;
      function Counter(props) {
        const [count, updateCount] = useState(0);
        _updateCount = updateCount;
        useEffect(() => {
          ReactNoop.yield(`Will set count to 1`);
          updateCount(1);
        }, []);
        return <Text text={'Count: ' + count} />;
      }

      ReactNoop.render(<Counter count={0} />);
      expect(ReactNoop.flush()).toEqual(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      // Enqueuing this update forces the passive effect to be flushed --
      // updateCount(1) happens first, so 2 wins.
      act(() => _updateCount(2));
      expect(ReactNoop.flush()).toEqual(['Will set count to 1', 'Count: 2']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 2')]);
    });

    it('flushes serial effects before enqueueing work (with tracing)', () => {
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
          ReactNoop.yield(`Will set count to 1`);
          updateCount(1);
        }, []);
        return <Text text={'Count: ' + count} />;
      }

      const tracingEvent = {id: 0, name: 'hello', timestamp: 0};
      SchedulerTracing.unstable_trace(
        tracingEvent.name,
        tracingEvent.timestamp,
        () => {
          ReactNoop.render(<Counter count={0} />);
        },
      );
      expect(ReactNoop.flush()).toEqual(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(0);

      // Enqueuing this update forces the passive effect to be flushed --
      // updateCount(1) happens first, so 2 wins.
      act(() => _updateCount(2));
      expect(ReactNoop.flush()).toEqual(['Will set count to 1', 'Count: 2']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 2')]);

      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
      expect(onWorkCanceled).toHaveBeenCalledTimes(0);
    });

    it(
      'in sync mode, useEffect is deferred and updates finish synchronously ' +
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
        ReactNoop.renderLegacySyncRoot(<Counter count={0} />);
        // Even in sync mode, effects are deferred until after paint
        expect(ReactNoop.flush()).toEqual(['Count: (empty)']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: (empty)')]);
        // Now fire the effects
        ReactNoop.flushPassiveEffects();
        // There were multiple updates, but there should only be a
        // single render
        expect(ReactNoop.clearYields()).toEqual(['Count: 0']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      },
    );

    it('flushSync is not allowed', () => {
      function Counter(props) {
        const [count, updateCount] = useState('(empty)');
        useEffect(
          () => {
            ReactNoop.yield(`Schedule update [${props.count}]`);
            ReactNoop.flushSync(() => {
              updateCount(props.count);
            });
          },
          [props.count],
        );
        return <Text text={'Count: ' + count} />;
      }
      ReactNoop.render(<Counter count={0} />);
      expect(ReactNoop.flush()).toEqual(['Count: (empty)']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: (empty)')]);

      expect(() => {
        ReactNoop.flushPassiveEffects();
      }).toThrow('flushSync was called from inside a lifecycle method');
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
      expect(ReactNoop.flush()).toEqual(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual(['Did create [0]']);

      ReactNoop.render(<Counter count={1} />);
      expect(ReactNoop.flush()).toEqual(['Count: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual([
        'Did destroy [0]',
        'Did create [1]',
      ]);
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
      expect(ReactNoop.flush()).toEqual(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual(['Did create [0]']);

      ReactNoop.render(null);
      expect(ReactNoop.flush()).toEqual(['Did destroy [0]']);
      expect(ReactNoop.getChildren()).toEqual([]);
    });

    it('unmounts on deletion after skipped effect', () => {
      function Counter(props) {
        useEffect(() => {
          ReactNoop.yield(`Did create [${props.count}]`);
          return () => {
            ReactNoop.yield(`Did destroy [${props.count}]`);
          };
        }, []);
        return <Text text={'Count: ' + props.count} />;
      }
      ReactNoop.render(<Counter count={0} />);
      expect(ReactNoop.flush()).toEqual(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual(['Did create [0]']);

      ReactNoop.render(<Counter count={1} />);
      expect(ReactNoop.flush()).toEqual(['Count: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual(null);

      ReactNoop.render(null);
      expect(ReactNoop.flush()).toEqual(['Did destroy [0]']);
      expect(ReactNoop.getChildren()).toEqual([]);
    });

    it('always fires effects if no dependencies are provided', () => {
      function effect() {
        ReactNoop.yield(`Did create`);
        return () => {
          ReactNoop.yield(`Did destroy`);
        };
      }
      function Counter(props) {
        useEffect(effect);
        return <Text text={'Count: ' + props.count} />;
      }
      ReactNoop.render(<Counter count={0} />);
      expect(ReactNoop.flush()).toEqual(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual(['Did create']);

      ReactNoop.render(<Counter count={1} />);
      expect(ReactNoop.flush()).toEqual(['Count: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual(['Did destroy', 'Did create']);

      ReactNoop.render(null);
      expect(ReactNoop.flush()).toEqual(['Did destroy']);
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
      expect(ReactNoop.flush()).toEqual(['Count: 0']);
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual(['Did create [Count: 0]']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      ReactNoop.render(<Counter label="Count" count={1} />);
      // Count changed
      expect(ReactNoop.flush()).toEqual(['Count: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual([
        'Did destroy [Count: 0]',
        'Did create [Count: 1]',
      ]);

      ReactNoop.render(<Counter label="Count" count={1} />);
      // Nothing changed, so no effect should have fired
      expect(ReactNoop.flush()).toEqual(['Count: 1']);
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual(null);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);

      ReactNoop.render(<Counter label="Total" count={1} />);
      // Label changed
      expect(ReactNoop.flush()).toEqual(['Total: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Total: 1')]);
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual([
        'Did destroy [Count: 1]',
        'Did create [Total: 1]',
      ]);
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
      expect(ReactNoop.flush()).toEqual(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual([
        'Did commit 1 [0]',
        'Did commit 2 [0]',
      ]);

      ReactNoop.render(<Counter count={1} />);
      expect(ReactNoop.flush()).toEqual(['Count: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual([
        'Did commit 1 [1]',
        'Did commit 2 [1]',
      ]);
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
      expect(ReactNoop.flush()).toEqual(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual(['Mount A [0]', 'Mount B [0]']);

      ReactNoop.render(<Counter count={1} />);
      expect(ReactNoop.flush()).toEqual(['Count: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual([
        'Unmount A [0]',
        'Unmount B [0]',
        'Mount A [1]',
        'Mount B [1]',
      ]);
    });

    it('handles errors on mount', () => {
      function Counter(props) {
        useEffect(() => {
          ReactNoop.yield(`Mount A [${props.count}]`);
          return () => {
            ReactNoop.yield(`Unmount A [${props.count}]`);
          };
        });
        useEffect(() => {
          ReactNoop.yield('Oops!');
          throw new Error('Oops!');
          // eslint-disable-next-line no-unreachable
          ReactNoop.yield(`Mount B [${props.count}]`);
          return () => {
            ReactNoop.yield(`Unmount B [${props.count}]`);
          };
        });
        return <Text text={'Count: ' + props.count} />;
      }
      ReactNoop.render(<Counter count={0} />);
      expect(ReactNoop.flush()).toEqual(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      expect(() => ReactNoop.flushPassiveEffects()).toThrow('Oops');
      expect(ReactNoop.clearYields()).toEqual([
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
          ReactNoop.yield(`Mount A [${props.count}]`);
          return () => {
            ReactNoop.yield(`Unmount A [${props.count}]`);
          };
        });
        useEffect(() => {
          if (props.count === 1) {
            ReactNoop.yield('Oops!');
            throw new Error('Oops!');
          }
          ReactNoop.yield(`Mount B [${props.count}]`);
          return () => {
            ReactNoop.yield(`Unmount B [${props.count}]`);
          };
        });
        return <Text text={'Count: ' + props.count} />;
      }
      ReactNoop.render(<Counter count={0} />);
      expect(ReactNoop.flush()).toEqual(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual(['Mount A [0]', 'Mount B [0]']);

      // This update will trigger an errror
      ReactNoop.render(<Counter count={1} />);
      expect(ReactNoop.flush()).toEqual(['Count: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      expect(() => ReactNoop.flushPassiveEffects()).toThrow('Oops');
      expect(ReactNoop.clearYields()).toEqual([
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

    it('handles errors on unmount', () => {
      function Counter(props) {
        useEffect(() => {
          ReactNoop.yield(`Mount A [${props.count}]`);
          return () => {
            ReactNoop.yield('Oops!');
            throw new Error('Oops!');
            // eslint-disable-next-line no-unreachable
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
      expect(ReactNoop.flush()).toEqual(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual(['Mount A [0]', 'Mount B [0]']);

      // This update will trigger an errror
      ReactNoop.render(<Counter count={1} />);
      expect(ReactNoop.flush()).toEqual(['Count: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      expect(() => ReactNoop.flushPassiveEffects()).toThrow('Oops');
      expect(ReactNoop.clearYields()).toEqual([
        'Oops!',
        // B unmounts even though an error was thrown in the previous effect
        'Unmount B [0]',
      ]);
      expect(ReactNoop.getChildren()).toEqual([]);
    });

    it('works with memo', () => {
      function Counter({count}) {
        useLayoutEffect(() => {
          ReactNoop.yield('Mount: ' + count);
          return () => ReactNoop.yield('Unmount: ' + count);
        });
        return <Text text={'Count: ' + count} />;
      }
      Counter = memo(Counter);

      ReactNoop.render(<Counter count={0} />);
      expect(ReactNoop.flush()).toEqual(['Count: 0', 'Mount: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      ReactNoop.render(<Counter count={1} />);
      expect(ReactNoop.flush()).toEqual(['Count: 1', 'Unmount: 0', 'Mount: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);

      ReactNoop.render(null);
      expect(ReactNoop.flush()).toEqual(['Unmount: 1']);
      expect(ReactNoop.getChildren()).toEqual([]);
    });
  });

  describe('useLayoutEffect', () => {
    it('fires layout effects after the host has been mutated', () => {
      function getCommittedText() {
        const children = ReactNoop.getChildren();
        if (children === null) {
          return null;
        }
        return children[0].prop;
      }

      function Counter(props) {
        useLayoutEffect(() => {
          ReactNoop.yield(`Current: ${getCommittedText()}`);
        });
        return <Text text={props.count} />;
      }

      ReactNoop.render(<Counter count={0} />);
      expect(ReactNoop.flush()).toEqual([0, 'Current: 0']);
      expect(ReactNoop.getChildren()).toEqual([span(0)]);

      ReactNoop.render(<Counter count={1} />);
      expect(ReactNoop.flush()).toEqual([1, 'Current: 1']);
      expect(ReactNoop.getChildren()).toEqual([span(1)]);
    });

    it('force flushes passive effects before firing new layout effects', () => {
      let committedText = '(empty)';

      function Counter(props) {
        useLayoutEffect(() => {
          // Normally this would go in a mutation effect, but this test
          // intentionally omits a mutation effect.
          committedText = props.count + '';

          ReactNoop.yield(`Mount layout [current: ${committedText}]`);
          return () => {
            ReactNoop.yield(`Unmount layout [current: ${committedText}]`);
          };
        });
        useEffect(() => {
          ReactNoop.yield(`Mount normal [current: ${committedText}]`);
          return () => {
            ReactNoop.yield(`Unmount normal [current: ${committedText}]`);
          };
        });
        return null;
      }

      ReactNoop.render(<Counter count={0} />);
      expect(ReactNoop.flush()).toEqual(['Mount layout [current: 0]']);
      expect(committedText).toEqual('0');

      ReactNoop.render(<Counter count={1} />);
      expect(ReactNoop.flush()).toEqual([
        'Mount normal [current: 0]',
        'Unmount layout [current: 0]',
        'Mount layout [current: 1]',
      ]);
      expect(committedText).toEqual('1');

      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual([
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
      expect(ReactNoop.flush()).toEqual(['Increment', 'Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([
        span('Increment'),
        span('Count: 0'),
      ]);

      act(button.current.increment);
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
      act(button.current.increment);
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

    it('always re-computes if no inputs are provided', () => {
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
      expect(ReactNoop.flush()).toEqual(['compute A', 'A']);

      ReactNoop.render(<LazyCompute compute={computeA} />);
      expect(ReactNoop.flush()).toEqual(['compute A', 'A']);

      ReactNoop.render(<LazyCompute compute={computeB} />);
      expect(ReactNoop.flush()).toEqual(['compute B', 'B']);
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
        ReactNoop.yield('compute ' + val);
        return val;
      }

      ReactNoop.render(<LazyCompute compute={compute} input="A" />);
      expect(ReactNoop.flush()).toEqual(['compute A', 'A']);

      ReactNoop.render(<LazyCompute compute={compute} input="A" />);
      expect(ReactNoop.flush()).toEqual(['A']);

      ReactNoop.render(<LazyCompute compute={compute} input="B" />);
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
      expect(ReactNoop.flush()).toEqual(['val']);

      ReactNoop.render(<Counter />);
      expect(ReactNoop.flush()).toEqual(['val']);
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
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      expect(counter.current.count).toBe(0);

      act(() => {
        counter.current.dispatch(INCREMENT);
      });
      ReactNoop.flush();
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
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      expect(counter.current.count).toBe(0);

      act(() => {
        counter.current.dispatch(INCREMENT);
      });
      ReactNoop.flush();
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
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      expect(counter.current.count).toBe(0);
      expect(totalRefUpdates).toBe(1);

      act(() => {
        counter.current.dispatch(INCREMENT);
      });
      ReactNoop.flush();
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
      expect(counter.current.count).toBe(1);
      expect(totalRefUpdates).toBe(2);

      // Update that doesn't change the ref dependencies
      ReactNoop.render(<Counter ref={counter} />);
      ReactNoop.flush();
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
      expect(ReactNoop.flush()).toEqual(['A: 0, B: 0, C: [not loaded]']);
      expect(ReactNoop.getChildren()).toEqual([
        span('A: 0, B: 0, C: [not loaded]'),
      ]);

      act(() => {
        updateA(2);
        updateB(3);
      });

      expect(ReactNoop.flush()).toEqual(['A: 2, B: 3, C: [not loaded]']);
      expect(ReactNoop.getChildren()).toEqual([
        span('A: 2, B: 3, C: [not loaded]'),
      ]);

      ReactNoop.render(<App loadC={true} />);
      expect(() => {
        expect(ReactNoop.flush()).toEqual(['A: 2, B: 3, C: 0']);
      }).toThrow('Rendered more hooks than during the previous render');

      // Uncomment if/when we support this again
      // expect(ReactNoop.getChildren()).toEqual([span('A: 2, B: 3, C: 0')]);

      // updateC(4);
      // expect(ReactNoop.flush()).toEqual(['A: 2, B: 3, C: 4']);
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
      expect(ReactNoop.flush()).toEqual(['A: 0, B: 0, C: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('A: 0, B: 0, C: 0')]);
      act(() => {
        updateA(2);
        updateB(3);
        updateC(4);
      });
      expect(ReactNoop.flush()).toEqual(['A: 2, B: 3, C: 4']);
      expect(ReactNoop.getChildren()).toEqual([span('A: 2, B: 3, C: 4')]);
      ReactNoop.render(<App loadC={false} />);
      expect(() => ReactNoop.flush()).toThrow(
        'Rendered fewer hooks than expected. This may be caused by an ' +
          'accidental early return statement.',
      );
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
      expect(ReactNoop.flush()).toEqual([]);
      ReactNoop.flushPassiveEffects();
      expect(ReactNoop.clearYields()).toEqual(['Mount A']);

      ReactNoop.render(<App showMore={true} />);
      expect(() => {
        expect(ReactNoop.flush()).toEqual([]);
      }).toThrow('Rendered more hooks than during the previous render');

      // Uncomment if/when we support this again
      // ReactNoop.flushPassiveEffects();
      // expect(ReactNoop.clearYields()).toEqual(['Mount B']);

      // ReactNoop.render(<App showMore={false} />);
      // expect(() => ReactNoop.flush()).toThrow(
      //   'Rendered fewer hooks than expected. This may be caused by an ' +
      //     'accidental early return statement.',
      // );
    });
  });
});
