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
let textCache;
let readText;
let resolveText;
let ReactNoop;
let Scheduler;
let SchedulerTracing;
let Suspense;
let useState;
let useReducer;
let useEffect;
let useLayoutEffect;
let useCallback;
let useMemo;
let useRef;
let useImperativeHandle;
let useTransition;
let useDeferredValue;
let forwardRef;
let memo;
let act;
let ContinuousEventPriority;

describe('ReactHooksWithNoopRenderer', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();

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
    useTransition = React.unstable_useTransition;
    useDeferredValue = React.unstable_useDeferredValue;
    Suspense = React.Suspense;
    act = ReactNoop.act;
    ContinuousEventPriority = require('react-reconciler/constants')
      .ContinuousEventPriority;

    textCache = new Map();

    readText = text => {
      const record = textCache.get(text);
      if (record !== undefined) {
        switch (record.status) {
          case 'pending':
            throw record.promise;
          case 'rejected':
            throw Error('Failed to load: ' + text);
          case 'resolved':
            return text;
        }
      } else {
        let ping;
        const promise = new Promise(resolve => (ping = resolve));
        const newRecord = {
          status: 'pending',
          ping: ping,
          promise,
        };
        textCache.set(text, newRecord);
        throw promise;
      }
    };

    resolveText = text => {
      const record = textCache.get(text);
      if (record !== undefined) {
        if (record.status === 'pending') {
          Scheduler.unstable_yieldValue(`Promise resolved [${text}]`);
          record.ping();
          record.ping = null;
          record.status = 'resolved';
          clearTimeout(record.promise._timer);
          record.promise = null;
        }
      } else {
        const newRecord = {
          ping: null,
          status: 'resolved',
          promise: null,
        };
        textCache.set(text, newRecord);
      }
    };
  });

  function span(prop) {
    return {type: 'span', hidden: false, children: [], prop};
  }

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return <span prop={props.text} />;
  }

  function AsyncText(props) {
    const text = props.text;
    try {
      readText(text);
      Scheduler.unstable_yieldValue(text);
      return <span prop={text} />;
    } catch (promise) {
      if (typeof promise.then === 'function') {
        Scheduler.unstable_yieldValue(`Suspend! [${text}]`);
        if (typeof props.ms === 'number' && promise._timer === undefined) {
          promise._timer = setTimeout(() => {
            resolveText(text);
          }, props.ms);
        }
      } else {
        Scheduler.unstable_yieldValue(`Error! [${text}]`);
      }
      throw promise;
    }
  }

  function advanceTimers(ms) {
    // Note: This advances Jest's virtual time but not React's. Use
    // ReactNoop.expire for that.
    if (typeof ms !== 'number') {
      throw new Error('Must specify ms');
    }
    jest.advanceTimersByTime(ms);
    // Wait until the end of the current tick
    // We cannot use a timer since we're faking them
    return Promise.resolve().then(() => {});
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
        'See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.',
    );

    // Confirm that a subsequent hook works properly.
    function GoodCounter(props, ref) {
      const [count] = useState(props.initialCount);
      return <Text text={count} />;
    }
    ReactNoop.render(<GoodCounter initialCount={10} />);
    expect(Scheduler).toFlushAndYield([10]);
  });

  if (!require('shared/ReactFeatureFlags').disableModulePatternComponents) {
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
            'See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.',
        ),
      ).toErrorDev(
        'Warning: The <Counter /> component appears to be a function component that returns a class instance. ' +
          'Change Counter to a class that extends React.Component instead. ' +
          "If you can't use a class try assigning the prototype on the function as a workaround. " +
          '`Counter.prototype = React.Component.prototype`. ' +
          "Don't use an arrow function since it cannot be called with `new` by React.",
      );

      // Confirm that a subsequent hook works properly.
      function GoodCounter(props) {
        const [count] = useState(props.initialCount);
        return <Text text={count} />;
      }
      ReactNoop.render(<GoodCounter initialCount={10} />);
      expect(Scheduler).toFlushAndYield([10]);
    });
  }

  it('throws when called outside the render phase', () => {
    expect(() => {
      expect(() => useState(0)).toThrow(
        "Cannot read property 'useState' of null",
      );
    }).toErrorDev(
      'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
        ' one of the following reasons:\n' +
        '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
        '2. You might be breaking the Rules of Hooks\n' +
        '3. You might have more than one copy of React in the same app\n' +
        'See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.',
      {withoutStack: true},
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
      let updater = null;
      function Counter() {
        const [count, updateCount] = useState(0);
        updater = updateCount;
        return <Text text={'Count: ' + count} />;
      }
      ReactNoop.render(<Counter />);
      expect(Scheduler).toFlushAndYield(['Count: 0']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);

      const firstUpdater = updater;

      act(() => firstUpdater(1));
      expect(Scheduler).toHaveYielded(['Count: 1']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);

      const secondUpdater = updater;

      act(() => firstUpdater(count => count + 10));
      expect(Scheduler).toHaveYielded(['Count: 11']);
      expect(ReactNoop.getChildren()).toEqual([span('Count: 11')]);

      expect(firstUpdater).toBe(secondUpdater);
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
      expect(() => act(() => _updateCount(1))).toErrorDev(
        "Warning: Can't perform a React state update on an unmounted " +
          'component. This is a no-op, but it indicates a memory leak in your ' +
          'application. To fix, cancel all subscriptions and asynchronous ' +
          'tasks in a useEffect cleanup function.\n' +
          '    in Counter (at **)',
      );
    });

    it('dedupes the warning by component name', () => {
      let _updateCountA;
      function CounterA(props, ref) {
        const [, updateCount] = useState(0);
        _updateCountA = updateCount;
        return null;
      }
      let _updateCountB;
      function CounterB(props, ref) {
        const [, updateCount] = useState(0);
        _updateCountB = updateCount;
        return null;
      }

      ReactNoop.render([<CounterA key="A" />, <CounterB key="B" />]);
      expect(Scheduler).toFlushWithoutYielding();
      ReactNoop.render(null);
      expect(Scheduler).toFlushWithoutYielding();
      expect(() => act(() => _updateCountA(1))).toErrorDev(
        "Warning: Can't perform a React state update on an unmounted " +
          'component. This is a no-op, but it indicates a memory leak in your ' +
          'application. To fix, cancel all subscriptions and asynchronous ' +
          'tasks in a useEffect cleanup function.\n' +
          '    in CounterA (at **)',
      );
      // already cached so this logs no error
      act(() => _updateCountA(2));
      expect(() => act(() => _updateCountB(1))).toErrorDev(
        "Warning: Can't perform a React state update on an unmounted " +
          'component. This is a no-op, but it indicates a memory leak in your ' +
          'application. To fix, cancel all subscriptions and asynchronous ' +
          'tasks in a useEffect cleanup function.\n' +
          '    in CounterB (at **)',
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
        const [isScrollingDown, setIsScrollingDown] = useState(false);
        const [row, setRow] = useState(null);

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

    it('warns about render phase update on a different component', async () => {
      let setStep;
      function Foo() {
        const [step, _setStep] = useState(0);
        setStep = _setStep;
        return <Text text={`Foo [${step}]`} />;
      }

      function Bar({triggerUpdate}) {
        if (triggerUpdate) {
          setStep(x => x + 1);
        }
        return <Text text="Bar" />;
      }

      const root = ReactNoop.createRoot();

      await ReactNoop.act(async () => {
        root.render(
          <>
            <Foo />
            <Bar />
          </>,
        );
      });
      expect(Scheduler).toHaveYielded(['Foo [0]', 'Bar']);

      // Bar will update Foo during its render phase. React should warn.
      await ReactNoop.act(async () => {
        root.render(
          <>
            <Foo />
            <Bar triggerUpdate={true} />
          </>,
        );
        expect(() =>
          expect(Scheduler).toFlushAndYield(
            __DEV__
              ? ['Foo [0]', 'Bar', 'Foo [2]']
              : ['Foo [0]', 'Bar', 'Foo [1]'],
          ),
        ).toErrorDev([
          'Cannot update a component (`Foo`) while rendering a ' +
            'different component (`Bar`). To locate the bad setState() call inside `Bar`',
        ]);
      });

      // It should not warn again (deduplication).
      await ReactNoop.act(async () => {
        root.render(
          <>
            <Foo />
            <Bar triggerUpdate={true} />
          </>,
        );
        expect(Scheduler).toFlushAndYield(
          __DEV__
            ? ['Foo [2]', 'Bar', 'Foo [4]']
            : ['Foo [1]', 'Bar', 'Foo [2]'],
        );
      });
    });

    it('keeps restarting until there are no more new updates', () => {
      function Counter({row: newRow}) {
        const [count, setCount] = useState(0);
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
        const [count, setCount] = useState(0);
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
        const [count, setCount] = useState(0);
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
        const [count, dispatch] = useReducer(reducer, 0);
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
        const [reducer, setReducer] = useState(() => reducerA);
        const [count, dispatch] = useReducer(reducer, 0);
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

    it('discards render phase updates if something suspends', async () => {
      const thenable = {then() {}};
      function Foo({signal}) {
        return (
          <Suspense fallback="Loading...">
            <Bar signal={signal} />
          </Suspense>
        );
      }

      function Bar({signal: newSignal}) {
        const [counter, setCounter] = useState(0);
        const [signal, setSignal] = useState(true);

        // Increment a counter every time the signal changes
        if (signal !== newSignal) {
          setCounter(c => c + 1);
          setSignal(newSignal);
          if (counter === 0) {
            // We're suspending during a render that includes render phase
            // updates. Those updates should not persist to the next render.
            Scheduler.unstable_yieldValue('Suspend!');
            throw thenable;
          }
        }

        return <Text text={counter} />;
      }

      const root = ReactNoop.createRoot();
      root.render(<Foo signal={true} />);

      expect(Scheduler).toFlushAndYield([0]);
      expect(root).toMatchRenderedOutput(<span prop={0} />);

      root.render(<Foo signal={false} />);
      expect(Scheduler).toFlushAndYield(['Suspend!']);
      expect(root).toMatchRenderedOutput(<span prop={0} />);

      // Rendering again should suspend again.
      root.render(<Foo signal={false} />);
      expect(Scheduler).toFlushAndYield(['Suspend!']);
    });

    it('discards render phase updates if something suspends, but not other updates in the same component', async () => {
      const thenable = {then() {}};
      function Foo({signal}) {
        return (
          <Suspense fallback="Loading...">
            <Bar signal={signal} />
          </Suspense>
        );
      }

      let setLabel;
      function Bar({signal: newSignal}) {
        const [counter, setCounter] = useState(0);

        if (counter === 1) {
          // We're suspending during a render that includes render phase
          // updates. Those updates should not persist to the next render.
          Scheduler.unstable_yieldValue('Suspend!');
          throw thenable;
        }

        const [signal, setSignal] = useState(true);

        // Increment a counter every time the signal changes
        if (signal !== newSignal) {
          setCounter(c => c + 1);
          setSignal(newSignal);
        }

        const [label, _setLabel] = useState('A');
        setLabel = _setLabel;

        return <Text text={`${label}:${counter}`} />;
      }

      const root = ReactNoop.createRoot();
      root.render(<Foo signal={true} />);

      expect(Scheduler).toFlushAndYield(['A:0']);
      expect(root).toMatchRenderedOutput(<span prop="A:0" />);

      await ReactNoop.act(async () => {
        root.render(<Foo signal={false} />);
        setLabel('B');

        expect(Scheduler).toFlushAndYield(['Suspend!']);
        expect(root).toMatchRenderedOutput(<span prop="A:0" />);

        // Rendering again should suspend again.
        root.render(<Foo signal={false} />);
        expect(Scheduler).toFlushAndYield(['Suspend!']);

        // Flip the signal back to "cancel" the update. However, the update to
        // label should still proceed. It shouldn't have been dropped.
        root.render(<Foo signal={true} />);
        expect(Scheduler).toFlushAndYield(['B:0']);
        expect(root).toMatchRenderedOutput(<span prop="B:0" />);
      });
    });

    it('regression: render phase updates cause lower pri work to be dropped', async () => {
      let setRow;
      function ScrollView() {
        const [row, _setRow] = useState(10);
        setRow = _setRow;

        const [scrollDirection, setScrollDirection] = useState('Up');
        const [prevRow, setPrevRow] = useState(null);

        if (prevRow !== row) {
          setScrollDirection(prevRow !== null && row > prevRow ? 'Down' : 'Up');
          setPrevRow(row);
        }

        return <Text text={scrollDirection} />;
      }

      const root = ReactNoop.createRoot();

      await act(async () => {
        root.render(<ScrollView row={10} />);
      });
      expect(Scheduler).toHaveYielded(['Up']);
      expect(root).toMatchRenderedOutput(<span prop="Up" />);

      await act(async () => {
        ReactNoop.discreteUpdates(() => {
          setRow(5);
        });
        setRow(20);
      });
      expect(Scheduler).toHaveYielded(['Up', 'Down']);
      expect(root).toMatchRenderedOutput(<span prop="Down" />);
    });

    // TODO: This should probably warn
    // @gate experimental
    it('calling startTransition inside render phase', async () => {
      let startTransition;
      function App() {
        const [counter, setCounter] = useState(0);
        const [_startTransition] = useTransition();
        startTransition = _startTransition;

        if (counter === 0) {
          startTransition(() => {
            setCounter(c => c + 1);
          });
        }

        return <Text text={counter} />;
      }

      const root = ReactNoop.createRoot();
      root.render(<App />);
      expect(Scheduler).toFlushAndYield([1]);
      expect(root).toMatchRenderedOutput(<span prop={1} />);
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
      const passive = <PassiveEffect key="p" />;
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
        const [count, setCount] = useState(0);
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

    it('defers passive effect destroy functions during unmount', () => {
      function Child({bar, foo}) {
        React.useEffect(() => {
          Scheduler.unstable_yieldValue('passive bar create');
          return () => {
            Scheduler.unstable_yieldValue('passive bar destroy');
          };
        }, [bar]);
        React.useLayoutEffect(() => {
          Scheduler.unstable_yieldValue('layout bar create');
          return () => {
            Scheduler.unstable_yieldValue('layout bar destroy');
          };
        }, [bar]);
        React.useEffect(() => {
          Scheduler.unstable_yieldValue('passive foo create');
          return () => {
            Scheduler.unstable_yieldValue('passive foo destroy');
          };
        }, [foo]);
        React.useLayoutEffect(() => {
          Scheduler.unstable_yieldValue('layout foo create');
          return () => {
            Scheduler.unstable_yieldValue('layout foo destroy');
          };
        }, [foo]);
        Scheduler.unstable_yieldValue('render');
        return null;
      }

      act(() => {
        ReactNoop.render(<Child bar={1} foo={1} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough([
          'render',
          'layout bar create',
          'layout foo create',
          'Sync effect',
        ]);
        // Effects are deferred until after the commit
        expect(Scheduler).toFlushAndYield([
          'passive bar create',
          'passive foo create',
        ]);
      });

      // This update is exists to test an internal implementation detail:
      // Effects without updating dependencies lose their layout/passive tag during an update.
      act(() => {
        ReactNoop.render(<Child bar={1} foo={2} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough([
          'render',
          'layout foo destroy',
          'layout foo create',
          'Sync effect',
        ]);
        // Effects are deferred until after the commit
        expect(Scheduler).toFlushAndYield([
          'passive foo destroy',
          'passive foo create',
        ]);
      });

      // Unmount the component and verify that passive destroy functions are deferred until post-commit.
      act(() => {
        ReactNoop.render(null, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough([
          'layout bar destroy',
          'layout foo destroy',
          'Sync effect',
        ]);
        // Effects are deferred until after the commit
        expect(Scheduler).toFlushAndYield([
          'passive bar destroy',
          'passive foo destroy',
        ]);
      });
    });

    it('does not warn about state updates for unmounted components with pending passive unmounts', () => {
      let completePendingRequest = null;
      function Component() {
        Scheduler.unstable_yieldValue('Component');
        const [didLoad, setDidLoad] = React.useState(false);
        React.useLayoutEffect(() => {
          Scheduler.unstable_yieldValue('layout create');
          return () => {
            Scheduler.unstable_yieldValue('layout destroy');
          };
        }, []);
        React.useEffect(() => {
          Scheduler.unstable_yieldValue('passive create');
          // Mimic an XHR request with a complete handler that updates state.
          completePendingRequest = () => setDidLoad(true);
          return () => {
            Scheduler.unstable_yieldValue('passive destroy');
          };
        }, []);
        return didLoad;
      }

      act(() => {
        ReactNoop.renderToRootWithID(<Component />, 'root', () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough([
          'Component',
          'layout create',
          'Sync effect',
        ]);
        ReactNoop.flushPassiveEffects();
        expect(Scheduler).toHaveYielded(['passive create']);

        // Unmount but don't process pending passive destroy function
        ReactNoop.unmountRootWithID('root');
        expect(Scheduler).toFlushAndYieldThrough(['layout destroy']);

        // Simulate an XHR completing, which will cause a state update-
        // but should not log a warning.
        completePendingRequest();

        ReactNoop.flushPassiveEffects();
        expect(Scheduler).toHaveYielded(['passive destroy']);
      });
    });

    it('does not warn about state updates for unmounted components with pending passive unmounts for alternates', () => {
      let setParentState = null;
      const setChildStates = [];

      function Parent() {
        const [state, setState] = useState(true);
        setParentState = setState;
        Scheduler.unstable_yieldValue(`Parent ${state} render`);
        useLayoutEffect(() => {
          Scheduler.unstable_yieldValue(`Parent ${state} commit`);
        });
        if (state) {
          return (
            <>
              <Child label="one" />
              <Child label="two" />
            </>
          );
        } else {
          return null;
        }
      }

      function Child({label}) {
        const [state, setState] = useState(0);
        useLayoutEffect(() => {
          Scheduler.unstable_yieldValue(`Child ${label} commit`);
        });
        useEffect(() => {
          setChildStates.push(setState);
          Scheduler.unstable_yieldValue(`Child ${label} passive create`);
          return () => {
            Scheduler.unstable_yieldValue(`Child ${label} passive destroy`);
          };
        }, []);
        Scheduler.unstable_yieldValue(`Child ${label} render`);
        return state;
      }

      // Schedule debounced state update for child (prob a no-op for this test)
      // later tick: schedule unmount for parent
      // start process unmount (but don't flush passive effectS)
      // State update on child
      act(() => {
        ReactNoop.render(<Parent />);
        expect(Scheduler).toFlushAndYieldThrough([
          'Parent true render',
          'Child one render',
          'Child two render',
          'Child one commit',
          'Child two commit',
          'Parent true commit',
          'Child one passive create',
          'Child two passive create',
        ]);

        // Update children.
        setChildStates.forEach(setChildState => setChildState(1));
        expect(Scheduler).toFlushAndYieldThrough([
          'Child one render',
          'Child two render',
          'Child one commit',
          'Child two commit',
        ]);

        // Schedule another update for children, and partially process it.
        setChildStates.forEach(setChildState => setChildState(2));
        expect(Scheduler).toFlushAndYieldThrough(['Child one render']);

        // Schedule unmount for the parent that unmounts children with pending update.
        ReactNoop.unstable_runWithPriority(ContinuousEventPriority, () => {
          setParentState(false);
        });
        expect(Scheduler).toFlushUntilNextPaint([
          'Parent false render',
          'Parent false commit',
        ]);

        // Schedule updates for children too (which should be ignored)
        setChildStates.forEach(setChildState => setChildState(2));
        expect(Scheduler).toFlushAndYield([
          'Child one passive destroy',
          'Child two passive destroy',
        ]);
      });
    });

    it('warns about state updates for unmounted components with no pending passive unmounts', () => {
      let completePendingRequest = null;
      function Component() {
        Scheduler.unstable_yieldValue('Component');
        const [didLoad, setDidLoad] = React.useState(false);
        React.useLayoutEffect(() => {
          Scheduler.unstable_yieldValue('layout create');
          // Mimic an XHR request with a complete handler that updates state.
          completePendingRequest = () => setDidLoad(true);
          return () => {
            Scheduler.unstable_yieldValue('layout destroy');
          };
        }, []);
        return didLoad;
      }

      act(() => {
        ReactNoop.renderToRootWithID(<Component />, 'root', () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough([
          'Component',
          'layout create',
          'Sync effect',
        ]);

        // Unmount but don't process pending passive destroy function
        ReactNoop.unmountRootWithID('root');
        expect(Scheduler).toFlushAndYieldThrough(['layout destroy']);

        // Simulate an XHR completing.
        expect(completePendingRequest).toErrorDev(
          "Warning: Can't perform a React state update on an unmounted component.",
        );
      });
    });

    it('still warns if there are pending passive unmount effects but not for the current fiber', () => {
      let completePendingRequest = null;
      function ComponentWithXHR() {
        Scheduler.unstable_yieldValue('Component');
        const [didLoad, setDidLoad] = React.useState(false);
        React.useLayoutEffect(() => {
          Scheduler.unstable_yieldValue('a:layout create');
          return () => {
            Scheduler.unstable_yieldValue('a:layout destroy');
          };
        }, []);
        React.useEffect(() => {
          Scheduler.unstable_yieldValue('a:passive create');
          // Mimic an XHR request with a complete handler that updates state.
          completePendingRequest = () => setDidLoad(true);
        }, []);
        return didLoad;
      }

      function ComponentWithPendingPassiveUnmount() {
        React.useEffect(() => {
          Scheduler.unstable_yieldValue('b:passive create');
          return () => {
            Scheduler.unstable_yieldValue('b:passive destroy');
          };
        }, []);
        return null;
      }

      act(() => {
        ReactNoop.renderToRootWithID(
          <>
            <ComponentWithXHR />
            <ComponentWithPendingPassiveUnmount />
          </>,
          'root',
          () => Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough([
          'Component',
          'a:layout create',
          'Sync effect',
        ]);
        ReactNoop.flushPassiveEffects();
        expect(Scheduler).toHaveYielded([
          'a:passive create',
          'b:passive create',
        ]);

        // Unmount but don't process pending passive destroy function
        ReactNoop.unmountRootWithID('root');
        expect(Scheduler).toFlushAndYieldThrough(['a:layout destroy']);

        // Simulate an XHR completing in the component without a pending passive effect..
        expect(completePendingRequest).toErrorDev(
          "Warning: Can't perform a React state update on an unmounted component.",
        );
      });
    });

    it('warns if there are updates after pending passive unmount effects have been flushed', () => {
      let updaterFunction;

      function Component() {
        Scheduler.unstable_yieldValue('Component');
        const [state, setState] = React.useState(false);
        updaterFunction = setState;
        React.useEffect(() => {
          Scheduler.unstable_yieldValue('passive create');
          return () => {
            Scheduler.unstable_yieldValue('passive destroy');
          };
        }, []);
        return state;
      }

      act(() => {
        ReactNoop.renderToRootWithID(<Component />, 'root', () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
      });
      expect(Scheduler).toHaveYielded([
        'Component',
        'Sync effect',
        'passive create',
      ]);

      ReactNoop.unmountRootWithID('root');
      expect(Scheduler).toFlushAndYield(['passive destroy']);

      act(() => {
        expect(() => {
          updaterFunction(true);
        }).toErrorDev(
          "Warning: Can't perform a React state update on an unmounted component. " +
            'This is a no-op, but it indicates a memory leak in your application. ' +
            'To fix, cancel all subscriptions and asynchronous tasks in a useEffect cleanup function.\n' +
            '    in Component (at **)',
        );
      });
    });

    it('does not show a warning when a component updates its own state from within passive unmount function', () => {
      function Component() {
        Scheduler.unstable_yieldValue('Component');
        const [didLoad, setDidLoad] = React.useState(false);
        React.useEffect(() => {
          Scheduler.unstable_yieldValue('passive create');
          return () => {
            setDidLoad(true);
            Scheduler.unstable_yieldValue('passive destroy');
          };
        }, []);
        return didLoad;
      }

      act(() => {
        ReactNoop.renderToRootWithID(<Component />, 'root', () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough([
          'Component',
          'Sync effect',
          'passive create',
        ]);

        // Unmount but don't process pending passive destroy function
        ReactNoop.unmountRootWithID('root');
        expect(Scheduler).toFlushAndYield(['passive destroy']);
      });
    });

    it('does not show a warning when a component updates a childs state from within passive unmount function', () => {
      function Parent() {
        Scheduler.unstable_yieldValue('Parent');
        const updaterRef = useRef(null);
        React.useEffect(() => {
          Scheduler.unstable_yieldValue('Parent passive create');
          return () => {
            updaterRef.current(true);
            Scheduler.unstable_yieldValue('Parent passive destroy');
          };
        }, []);
        return <Child updaterRef={updaterRef} />;
      }

      function Child({updaterRef}) {
        Scheduler.unstable_yieldValue('Child');
        const [state, setState] = React.useState(false);
        React.useEffect(() => {
          Scheduler.unstable_yieldValue('Child passive create');
          updaterRef.current = setState;
        }, []);
        return state;
      }

      act(() => {
        ReactNoop.renderToRootWithID(<Parent />, 'root');
        expect(Scheduler).toFlushAndYieldThrough([
          'Parent',
          'Child',
          'Child passive create',
          'Parent passive create',
        ]);

        // Unmount but don't process pending passive destroy function
        ReactNoop.unmountRootWithID('root');
        expect(Scheduler).toFlushAndYield(['Parent passive destroy']);
      });
    });

    it('does not show a warning when a component updates a parents state from within passive unmount function', () => {
      function Parent() {
        const [state, setState] = React.useState(false);
        Scheduler.unstable_yieldValue('Parent');
        return <Child setState={setState} state={state} />;
      }

      function Child({setState, state}) {
        Scheduler.unstable_yieldValue('Child');
        React.useEffect(() => {
          Scheduler.unstable_yieldValue('Child passive create');
          return () => {
            Scheduler.unstable_yieldValue('Child passive destroy');
            setState(true);
          };
        }, []);
        return state;
      }

      act(() => {
        ReactNoop.renderToRootWithID(<Parent />, 'root');
        expect(Scheduler).toFlushAndYieldThrough([
          'Parent',
          'Child',
          'Child passive create',
        ]);

        // Unmount but don't process pending passive destroy function
        ReactNoop.unmountRootWithID('root');
        expect(Scheduler).toFlushAndYield(['Child passive destroy']);
      });
    });

    it('updates have async priority', () => {
      function Counter(props) {
        const [count, updateCount] = useState('(empty)');
        useEffect(() => {
          Scheduler.unstable_yieldValue(`Schedule update [${props.count}]`);
          updateCount(props.count);
        }, [props.count]);
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
        useEffect(() => {
          Scheduler.unstable_yieldValue(`Schedule update [${props.count}]`);
          updateCount(props.count);
        }, [props.count]);
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

    it('does not flush non-discrete passive effects when flushing sync', () => {
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
      }).toErrorDev(['An update to Counter ran an effect']);

      // A flush sync doesn't cause the passive effects to fire.
      // So we haven't added the other update yet.
      act(() => {
        ReactNoop.flushSync(() => {
          _updateCount(2);
        });
      });

      // As a result we, somewhat surprisingly, commit them in the opposite order.
      // This should be fine because any non-discrete set of work doesn't guarantee order
      // and easily could've happened slightly later too.
      expect(Scheduler).toHaveYielded([
        'Will set count to 1',
        'Count: 2',
        'Count: 1',
      ]);

      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
    });

    // @gate enableSchedulerTracing
    it('does not flush non-discrete passive effects when flushing sync (with tracing)', () => {
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
      }).toErrorDev(['An update to Counter ran an effect']);

      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(0);

      // A flush sync doesn't cause the passive effects to fire.
      act(() => {
        ReactNoop.flushSync(() => {
          _updateCount(2);
        });
      });

      expect(Scheduler).toHaveYielded([
        'Will set count to 1',
        'Count: 2',
        'Count: 1',
      ]);

      expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);

      expect(onInteractionScheduledWorkCompleted).toHaveBeenCalledTimes(1);
      expect(onWorkCanceled).toHaveBeenCalledTimes(0);
    });

    it(
      'in legacy mode, useEffect is deferred and updates finish synchronously ' +
        '(in a single batch)',
      async () => {
        function Counter(props) {
          const [count, updateCount] = useState('(empty)');
          useEffect(() => {
            // Update multiple times. These should all be batched together in
            // a single render.
            updateCount(props.count);
            updateCount(props.count);
            updateCount(props.count);
            updateCount(props.count);
            updateCount(props.count);
            updateCount(props.count);
          }, [props.count]);
          return <Text text={'Count: ' + count} />;
        }
        await act(async () => {
          ReactNoop.renderLegacySyncRoot(<Counter count={0} />);

          // Even in legacy mode, effects are deferred until after paint
          ReactNoop.flushSync();
          expect(Scheduler).toHaveYielded(['Count: (empty)']);
          expect(ReactNoop.getChildren()).toEqual([span('Count: (empty)')]);
        });

        // effects get forced on exiting act()
        // There were multiple updates, but there should only be a
        // single render
        expect(Scheduler).toHaveYielded(['Count: 0']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
      },
    );

    it('flushSync is not allowed', () => {
      function Counter(props) {
        const [count, updateCount] = useState('(empty)');
        useEffect(() => {
          Scheduler.unstable_yieldValue(`Schedule update [${props.count}]`);
          ReactNoop.flushSync(() => {
            updateCount(props.count);
          });
          // This shouldn't flush synchronously.
          expect(ReactNoop.getChildren()).not.toEqual([
            span('Count: ' + props.count),
          ]);
        }, [props.count]);
        return <Text text={'Count: ' + count} />;
      }
      expect(() =>
        act(() => {
          ReactNoop.render(<Counter count={0} />, () =>
            Scheduler.unstable_yieldValue('Sync effect'),
          );
          expect(Scheduler).toFlushAndYieldThrough([
            'Count: (empty)',
            'Sync effect',
          ]);
          expect(ReactNoop.getChildren()).toEqual([span('Count: (empty)')]);
        }),
      ).toErrorDev('flushSync was called from inside a lifecycle method');
      expect(ReactNoop.getChildren()).toEqual([span('Count: 0')]);
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
        useEffect(() => {
          Scheduler.unstable_yieldValue(`Did create [${text}]`);
          return () => {
            Scheduler.unstable_yieldValue(`Did destroy [${text}]`);
          };
        }, [props.label, props.count]);
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

    it('unmounts all previous effects between siblings before creating any new ones', () => {
      function Counter({count, label}) {
        useEffect(() => {
          Scheduler.unstable_yieldValue(`Mount ${label} [${count}]`);
          return () => {
            Scheduler.unstable_yieldValue(`Unmount ${label} [${count}]`);
          };
        });
        return <Text text={`${label} ${count}`} />;
      }
      act(() => {
        ReactNoop.render(
          <>
            <Counter label="A" count={0} />
            <Counter label="B" count={0} />
          </>,
          () => Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['A 0', 'B 0', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('A 0'), span('B 0')]);
      });

      expect(Scheduler).toHaveYielded(['Mount A [0]', 'Mount B [0]']);

      act(() => {
        ReactNoop.render(
          <>
            <Counter label="A" count={1} />
            <Counter label="B" count={1} />
          </>,
          () => Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['A 1', 'B 1', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('A 1'), span('B 1')]);
      });
      expect(Scheduler).toHaveYielded([
        'Unmount A [0]',
        'Unmount B [0]',
        'Mount A [1]',
        'Mount B [1]',
      ]);

      act(() => {
        ReactNoop.render(
          <>
            <Counter label="B" count={2} />
            <Counter label="C" count={0} />
          </>,
          () => Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['B 2', 'C 0', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('B 2'), span('C 0')]);
      });
      expect(Scheduler).toHaveYielded([
        'Unmount A [1]',
        'Unmount B [1]',
        'Mount B [2]',
        'Mount C [0]',
      ]);
    });

    it('handles errors in create on mount', () => {
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

    it('handles errors in create on update', () => {
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
        ]);
        expect(ReactNoop.getChildren()).toEqual([]);
      });
      expect(Scheduler).toHaveYielded([
        // Clean up effect A runs passively on unmount.
        // There's no effect B to clean-up, because it never mounted.
        'Unmount A [1]',
      ]);
    });

    it('handles errors in destroy on update', () => {
      function Counter(props) {
        useEffect(() => {
          Scheduler.unstable_yieldValue(`Mount A [${props.count}]`);
          return () => {
            Scheduler.unstable_yieldValue('Oops!');
            if (props.count === 0) {
              throw new Error('Oops!');
            }
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
        // This update will trigger an error during passive effect unmount
        ReactNoop.render(<Counter count={1} />, () =>
          Scheduler.unstable_yieldValue('Sync effect'),
        );
        expect(Scheduler).toFlushAndYieldThrough(['Count: 1', 'Sync effect']);
        expect(ReactNoop.getChildren()).toEqual([span('Count: 1')]);
        expect(() => ReactNoop.flushPassiveEffects()).toThrow('Oops');

        // This branch enables a feature flag that flushes all passive destroys in a
        // separate pass before flushing any passive creates.
        // A result of this two-pass flush is that an error thrown from unmount does
        // not block the subsequent create functions from being run.
        expect(Scheduler).toHaveYielded([
          'Oops!',
          'Unmount B [0]',
          'Mount A [1]',
          'Mount B [1]',
        ]);
      });

      // <Counter> gets unmounted because an error is thrown above.
      // The remaining destroy functions are run later on unmount, since they're passive.
      // In this case, one of them throws again (because of how the test is written).
      expect(Scheduler).toHaveYielded(['Oops!', 'Unmount B [1]']);
      expect(ReactNoop.getChildren()).toEqual([]);
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

    describe('errors thrown in passive destroy function within unmounted trees', () => {
      let BrokenUseEffectCleanup;
      let ErrorBoundary;
      let LogOnlyErrorBoundary;

      beforeEach(() => {
        BrokenUseEffectCleanup = function() {
          useEffect(() => {
            Scheduler.unstable_yieldValue('BrokenUseEffectCleanup useEffect');
            return () => {
              Scheduler.unstable_yieldValue(
                'BrokenUseEffectCleanup useEffect destroy',
              );
              throw new Error('Expected error');
            };
          }, []);

          return 'inner child';
        };

        ErrorBoundary = class extends React.Component {
          state = {error: null};
          static getDerivedStateFromError(error) {
            Scheduler.unstable_yieldValue(
              `ErrorBoundary static getDerivedStateFromError`,
            );
            return {error};
          }
          componentDidCatch(error, info) {
            Scheduler.unstable_yieldValue(`ErrorBoundary componentDidCatch`);
          }
          render() {
            if (this.state.error) {
              Scheduler.unstable_yieldValue('ErrorBoundary render error');
              return <span prop="ErrorBoundary fallback" />;
            }
            Scheduler.unstable_yieldValue('ErrorBoundary render success');
            return this.props.children || null;
          }
        };

        LogOnlyErrorBoundary = class extends React.Component {
          componentDidCatch(error, info) {
            Scheduler.unstable_yieldValue(
              `LogOnlyErrorBoundary componentDidCatch`,
            );
          }
          render() {
            Scheduler.unstable_yieldValue(`LogOnlyErrorBoundary render`);
            return this.props.children || null;
          }
        };
      });

      // @gate skipUnmountedBoundaries
      it('should use the nearest still-mounted boundary if there are no unmounted boundaries', () => {
        act(() => {
          ReactNoop.render(
            <LogOnlyErrorBoundary>
              <BrokenUseEffectCleanup />
            </LogOnlyErrorBoundary>,
          );
        });

        expect(Scheduler).toHaveYielded([
          'LogOnlyErrorBoundary render',
          'BrokenUseEffectCleanup useEffect',
        ]);

        act(() => {
          ReactNoop.render(<LogOnlyErrorBoundary />);
        });

        expect(Scheduler).toHaveYielded([
          'LogOnlyErrorBoundary render',
          'BrokenUseEffectCleanup useEffect destroy',
          'LogOnlyErrorBoundary componentDidCatch',
        ]);
      });

      // @gate skipUnmountedBoundaries
      it('should skip unmounted boundaries and use the nearest still-mounted boundary', () => {
        function Conditional({showChildren}) {
          if (showChildren) {
            return (
              <ErrorBoundary>
                <BrokenUseEffectCleanup />
              </ErrorBoundary>
            );
          } else {
            return null;
          }
        }

        act(() => {
          ReactNoop.render(
            <LogOnlyErrorBoundary>
              <Conditional showChildren={true} />
            </LogOnlyErrorBoundary>,
          );
        });

        expect(Scheduler).toHaveYielded([
          'LogOnlyErrorBoundary render',
          'ErrorBoundary render success',
          'BrokenUseEffectCleanup useEffect',
        ]);

        act(() => {
          ReactNoop.render(
            <LogOnlyErrorBoundary>
              <Conditional showChildren={false} />
            </LogOnlyErrorBoundary>,
          );
        });

        expect(Scheduler).toHaveYielded([
          'LogOnlyErrorBoundary render',
          'BrokenUseEffectCleanup useEffect destroy',
          'LogOnlyErrorBoundary componentDidCatch',
        ]);
      });

      // @gate skipUnmountedBoundaries
      it('should call getDerivedStateFromError in the nearest still-mounted boundary', () => {
        function Conditional({showChildren}) {
          if (showChildren) {
            return <BrokenUseEffectCleanup />;
          } else {
            return null;
          }
        }

        act(() => {
          ReactNoop.render(
            <ErrorBoundary>
              <Conditional showChildren={true} />
            </ErrorBoundary>,
          );
        });

        expect(Scheduler).toHaveYielded([
          'ErrorBoundary render success',
          'BrokenUseEffectCleanup useEffect',
        ]);

        act(() => {
          ReactNoop.render(
            <ErrorBoundary>
              <Conditional showChildren={false} />
            </ErrorBoundary>,
          );
        });

        expect(Scheduler).toHaveYielded([
          'ErrorBoundary render success',
          'BrokenUseEffectCleanup useEffect destroy',
          'ErrorBoundary static getDerivedStateFromError',
          'ErrorBoundary render error',
          'ErrorBoundary componentDidCatch',
        ]);

        expect(ReactNoop.getChildren()).toEqual([
          span('ErrorBoundary fallback'),
        ]);
      });

      // @gate skipUnmountedBoundaries
      it('should rethrow error if there are no still-mounted boundaries', () => {
        function Conditional({showChildren}) {
          if (showChildren) {
            return (
              <ErrorBoundary>
                <BrokenUseEffectCleanup />
              </ErrorBoundary>
            );
          } else {
            return null;
          }
        }

        act(() => {
          ReactNoop.render(<Conditional showChildren={true} />);
        });

        expect(Scheduler).toHaveYielded([
          'ErrorBoundary render success',
          'BrokenUseEffectCleanup useEffect',
        ]);

        expect(() => {
          act(() => {
            ReactNoop.render(<Conditional showChildren={false} />);
          });
        }).toThrow('Expected error');

        expect(Scheduler).toHaveYielded([
          'BrokenUseEffectCleanup useEffect destroy',
        ]);

        expect(ReactNoop.getChildren()).toEqual([]);
      });
    });

    it('calls passive effect destroy functions for memoized components', () => {
      const Wrapper = ({children}) => children;
      function Child() {
        React.useEffect(() => {
          Scheduler.unstable_yieldValue('passive create');
          return () => {
            Scheduler.unstable_yieldValue('passive destroy');
          };
        }, []);
        React.useLayoutEffect(() => {
          Scheduler.unstable_yieldValue('layout create');
          return () => {
            Scheduler.unstable_yieldValue('layout destroy');
          };
        }, []);
        Scheduler.unstable_yieldValue('render');
        return null;
      }

      const isEqual = (prevProps, nextProps) =>
        prevProps.prop === nextProps.prop;
      const MemoizedChild = React.memo(Child, isEqual);

      act(() => {
        ReactNoop.render(
          <Wrapper>
            <MemoizedChild key={1} />
          </Wrapper>,
        );
      });
      expect(Scheduler).toHaveYielded([
        'render',
        'layout create',
        'passive create',
      ]);

      // Include at least one no-op (memoized) update to trigger original bug.
      act(() => {
        ReactNoop.render(
          <Wrapper>
            <MemoizedChild key={1} />
          </Wrapper>,
        );
      });
      expect(Scheduler).toHaveYielded([]);

      act(() => {
        ReactNoop.render(
          <Wrapper>
            <MemoizedChild key={2} />
          </Wrapper>,
        );
      });
      expect(Scheduler).toHaveYielded([
        'render',
        'layout destroy',
        'layout create',
        'passive destroy',
        'passive create',
      ]);

      act(() => {
        ReactNoop.render(null);
      });
      expect(Scheduler).toHaveYielded(['layout destroy', 'passive destroy']);
    });

    it('calls passive effect destroy functions for descendants of memoized components', () => {
      const Wrapper = ({children}) => children;
      function Child() {
        return <Grandchild />;
      }

      function Grandchild() {
        React.useEffect(() => {
          Scheduler.unstable_yieldValue('passive create');
          return () => {
            Scheduler.unstable_yieldValue('passive destroy');
          };
        }, []);
        React.useLayoutEffect(() => {
          Scheduler.unstable_yieldValue('layout create');
          return () => {
            Scheduler.unstable_yieldValue('layout destroy');
          };
        }, []);
        Scheduler.unstable_yieldValue('render');
        return null;
      }

      const isEqual = (prevProps, nextProps) =>
        prevProps.prop === nextProps.prop;
      const MemoizedChild = React.memo(Child, isEqual);

      act(() => {
        ReactNoop.render(
          <Wrapper>
            <MemoizedChild key={1} />
          </Wrapper>,
        );
      });
      expect(Scheduler).toHaveYielded([
        'render',
        'layout create',
        'passive create',
      ]);

      // Include at least one no-op (memoized) update to trigger original bug.
      act(() => {
        ReactNoop.render(
          <Wrapper>
            <MemoizedChild key={1} />
          </Wrapper>,
        );
      });
      expect(Scheduler).toHaveYielded([]);

      act(() => {
        ReactNoop.render(
          <Wrapper>
            <MemoizedChild key={2} />
          </Wrapper>,
        );
      });
      expect(Scheduler).toHaveYielded([
        'render',
        'layout destroy',
        'layout create',
        'passive destroy',
        'passive create',
      ]);

      act(() => {
        ReactNoop.render(null);
      });
      expect(Scheduler).toHaveYielded(['layout destroy', 'passive destroy']);
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

    // @gate skipUnmountedBoundaries
    it('catches errors thrown in useLayoutEffect', () => {
      class ErrorBoundary extends React.Component {
        state = {error: null};
        static getDerivedStateFromError(error) {
          Scheduler.unstable_yieldValue(
            `ErrorBoundary static getDerivedStateFromError`,
          );
          return {error};
        }
        render() {
          const {children, id, fallbackID} = this.props;
          const {error} = this.state;
          if (error) {
            Scheduler.unstable_yieldValue(`${id} render error`);
            return <Component id={fallbackID} />;
          }
          Scheduler.unstable_yieldValue(`${id} render success`);
          return children || null;
        }
      }

      function Component({id}) {
        Scheduler.unstable_yieldValue('Component render ' + id);
        return <span prop={id} />;
      }

      function BrokenLayoutEffectDestroy() {
        useLayoutEffect(() => {
          return () => {
            Scheduler.unstable_yieldValue(
              'BrokenLayoutEffectDestroy useLayoutEffect destroy',
            );
            throw Error('Expected');
          };
        }, []);

        Scheduler.unstable_yieldValue('BrokenLayoutEffectDestroy render');
        return <span prop="broken" />;
      }

      ReactNoop.render(
        <ErrorBoundary id="OuterBoundary" fallbackID="OuterFallback">
          <Component id="sibling" />
          <ErrorBoundary id="InnerBoundary" fallbackID="InnerFallback">
            <BrokenLayoutEffectDestroy />
          </ErrorBoundary>
        </ErrorBoundary>,
      );

      expect(Scheduler).toFlushAndYield([
        'OuterBoundary render success',
        'Component render sibling',
        'InnerBoundary render success',
        'BrokenLayoutEffectDestroy render',
      ]);
      expect(ReactNoop.getChildren()).toEqual([
        span('sibling'),
        span('broken'),
      ]);

      ReactNoop.render(
        <ErrorBoundary id="OuterBoundary" fallbackID="OuterFallback">
          <Component id="sibling" />
        </ErrorBoundary>,
      );

      // React should skip over the unmounting boundary and find the nearest still-mounted boundary.
      expect(Scheduler).toFlushAndYield([
        'OuterBoundary render success',
        'Component render sibling',
        'BrokenLayoutEffectDestroy useLayoutEffect destroy',
        'ErrorBoundary static getDerivedStateFromError',
        'OuterBoundary render error',
        'Component render OuterFallback',
      ]);
      expect(ReactNoop.getChildren()).toEqual([span('OuterFallback')]);
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
          <>
            <IncrementButton increment={increment} ref={button} />
            <Text text={'Count: ' + count} />
          </>
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
        const capitalizedText = useMemo(() => {
          Scheduler.unstable_yieldValue(`Capitalize '${text}'`);
          return text.toUpperCase();
        }, [text]);
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
  describe('useTransition', () => {
    // @gate experimental
    it('delays showing loading state until after timeout', async () => {
      let transition;
      function App() {
        const [show, setShow] = useState(false);
        const [startTransition, isPending] = useTransition({
          timeoutMs: 1000,
        });
        transition = () => {
          startTransition(() => {
            setShow(true);
          });
        };
        return (
          <Suspense
            fallback={<Text text={`Loading... Pending: ${isPending}`} />}>
            {show ? (
              <AsyncText text={`After... Pending: ${isPending}`} />
            ) : (
              <Text text={`Before... Pending: ${isPending}`} />
            )}
          </Suspense>
        );
      }
      ReactNoop.render(<App />);
      expect(Scheduler).toFlushAndYield(['Before... Pending: false']);
      expect(ReactNoop.getChildren()).toEqual([
        span('Before... Pending: false'),
      ]);

      await act(async () => {
        transition();

        expect(Scheduler).toFlushAndYield([
          'Before... Pending: true',
          'Suspend! [After... Pending: false]',
          'Loading... Pending: false',
        ]);
        expect(ReactNoop.getChildren()).toEqual([
          span('Before... Pending: true'),
        ]);
        Scheduler.unstable_advanceTime(500);
        await advanceTimers(500);

        // Even after a long amount of time, we still don't show a placeholder.
        Scheduler.unstable_advanceTime(100000);
        await advanceTimers(100000);
        expect(ReactNoop.getChildren()).toEqual([
          span('Before... Pending: true'),
        ]);

        await resolveText('After... Pending: false');
        expect(Scheduler).toHaveYielded([
          'Promise resolved [After... Pending: false]',
        ]);
        expect(Scheduler).toFlushAndYield(['After... Pending: false']);
        expect(ReactNoop.getChildren()).toEqual([
          span('After... Pending: false'),
        ]);
      });
    });
  });

  describe('useDeferredValue', () => {
    // @gate experimental
    it('defers text value', async () => {
      function TextBox({text}) {
        return <AsyncText text={text} />;
      }

      let _setText;
      function App() {
        const [text, setText] = useState('A');
        const deferredText = useDeferredValue(text, {
          timeoutMs: 500,
        });
        _setText = setText;
        return (
          <>
            <Text text={text} />
            <Suspense fallback={<Text text={'Loading'} />}>
              <TextBox text={deferredText} />
            </Suspense>
          </>
        );
      }

      act(() => {
        ReactNoop.render(<App />);
      });

      expect(Scheduler).toHaveYielded(['A', 'Suspend! [A]', 'Loading']);
      expect(ReactNoop.getChildren()).toEqual([span('A'), span('Loading')]);

      await resolveText('A');
      expect(Scheduler).toHaveYielded(['Promise resolved [A]']);
      expect(Scheduler).toFlushAndYield(['A']);
      expect(ReactNoop.getChildren()).toEqual([span('A'), span('A')]);

      await act(async () => {
        _setText('B');
        expect(Scheduler).toFlushAndYield([
          'B',
          'A',
          'B',
          'Suspend! [B]',
          'Loading',
        ]);
        expect(Scheduler).toFlushAndYield([]);
        expect(ReactNoop.getChildren()).toEqual([span('B'), span('A')]);
      });

      await act(async () => {
        Scheduler.unstable_advanceTime(250);
        await advanceTimers(250);
      });
      expect(Scheduler).toHaveYielded([]);
      expect(ReactNoop.getChildren()).toEqual([span('B'), span('A')]);

      // Even after a long amount of time, we don't show a fallback
      Scheduler.unstable_advanceTime(100000);
      await advanceTimers(100000);
      expect(Scheduler).toFlushAndYield([]);
      expect(ReactNoop.getChildren()).toEqual([span('B'), span('A')]);

      await act(async () => {
        await resolveText('B');
      });
      expect(Scheduler).toHaveYielded(['Promise resolved [B]', 'B', 'B']);
      expect(ReactNoop.getChildren()).toEqual([span('B'), span('B')]);
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
      }).toErrorDev([
        'Warning: React has detected a change in the order of Hooks called by App. ' +
          'This will lead to bugs and errors if not fixed. For more information, ' +
          'read the Rules of Hooks: https://reactjs.org/link/rules-of-hooks\n\n' +
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
        }).toErrorDev([
          'Warning: React has detected a change in the order of Hooks called by App. ' +
            'This will lead to bugs and errors if not fixed. For more information, ' +
            'read the Rules of Hooks: https://reactjs.org/link/rules-of-hooks\n\n' +
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
      useEffect(() => {
        Scheduler.unstable_yieldValue('Effect: ' + count);
        dispatch();
      }, [count]);
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

  // Regression test. Covers a case where an internal state variable
  // (`didReceiveUpdate`) is not reset properly.
  it('state bail out edge case (#16359)', async () => {
    let setCounterA;
    let setCounterB;

    function CounterA() {
      const [counter, setCounter] = useState(0);
      setCounterA = setCounter;
      Scheduler.unstable_yieldValue('Render A: ' + counter);
      useEffect(() => {
        Scheduler.unstable_yieldValue('Commit A: ' + counter);
      });
      return counter;
    }

    function CounterB() {
      const [counter, setCounter] = useState(0);
      setCounterB = setCounter;
      Scheduler.unstable_yieldValue('Render B: ' + counter);
      useEffect(() => {
        Scheduler.unstable_yieldValue('Commit B: ' + counter);
      });
      return counter;
    }

    const root = ReactNoop.createRoot(null);
    await ReactNoop.act(async () => {
      root.render(
        <>
          <CounterA />
          <CounterB />
        </>,
      );
    });
    expect(Scheduler).toHaveYielded([
      'Render A: 0',
      'Render B: 0',
      'Commit A: 0',
      'Commit B: 0',
    ]);

    await ReactNoop.act(async () => {
      setCounterA(1);

      // In the same batch, update B twice. To trigger the condition we're
      // testing, the first update is necessary to bypass the early
      // bailout optimization.
      setCounterB(1);
      setCounterB(0);
    });
    expect(Scheduler).toHaveYielded([
      'Render A: 1',
      'Render B: 0',
      'Commit A: 1',
      // B should not fire an effect because the update bailed out
      // 'Commit B: 0',
    ]);
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

  it('should process the rest pending updates after a render phase update', () => {
    // Similar to previous test, except using a preceding render phase update
    // instead of new props.
    let updateA;
    let updateC;
    function App() {
      const [a, setA] = useState(false);
      const [b, setB] = useState(false);
      if (a !== b) {
        setB(a);
      }
      // Even though we called setB above,
      // we should still apply the changes to C,
      // during this render pass.
      const [c, setC] = useState(false);
      updateA = setA;
      updateC = setC;
      return `${a ? 'A' : 'a'}${b ? 'B' : 'b'}${c ? 'C' : 'c'}`;
    }

    act(() => ReactNoop.render(<App />));
    expect(ReactNoop).toMatchRenderedOutput('abc');

    act(() => {
      updateA(true);
      // This update should not get dropped.
      updateC(true);
    });
    expect(ReactNoop).toMatchRenderedOutput('ABC');
  });

  it("regression test: don't unmount effects on siblings of deleted nodes", async () => {
    const root = ReactNoop.createRoot();

    function Child({label}) {
      useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('Mount layout ' + label);
        return () => {
          Scheduler.unstable_yieldValue('Unmount layout ' + label);
        };
      }, [label]);
      useEffect(() => {
        Scheduler.unstable_yieldValue('Mount passive ' + label);
        return () => {
          Scheduler.unstable_yieldValue('Unmount passive ' + label);
        };
      }, [label]);
      return label;
    }

    await act(async () => {
      root.render(
        <>
          <Child key="A" label="A" />
          <Child key="B" label="B" />
        </>,
      );
    });
    expect(Scheduler).toHaveYielded([
      'Mount layout A',
      'Mount layout B',
      'Mount passive A',
      'Mount passive B',
    ]);

    // Delete A. This should only unmount the effect on A. In the regression,
    // B's effect would also unmount.
    await act(async () => {
      root.render(
        <>
          <Child key="B" label="B" />
        </>,
      );
    });
    expect(Scheduler).toHaveYielded(['Unmount layout A', 'Unmount passive A']);

    // Now delete and unmount B.
    await act(async () => {
      root.render(null);
    });
    expect(Scheduler).toHaveYielded(['Unmount layout B', 'Unmount passive B']);
  });

  it('regression: deleting a tree and unmounting its effects after a reorder', async () => {
    const root = ReactNoop.createRoot();

    function Child({label}) {
      useEffect(() => {
        Scheduler.unstable_yieldValue('Mount ' + label);
        return () => {
          Scheduler.unstable_yieldValue('Unmount ' + label);
        };
      }, [label]);
      return label;
    }

    await act(async () => {
      root.render(
        <>
          <Child key="A" label="A" />
          <Child key="B" label="B" />
        </>,
      );
    });
    expect(Scheduler).toHaveYielded(['Mount A', 'Mount B']);

    await act(async () => {
      root.render(
        <>
          <Child key="B" label="B" />
          <Child key="A" label="A" />
        </>,
      );
    });
    expect(Scheduler).toHaveYielded([]);

    await act(async () => {
      root.render(null);
    });

    expect(Scheduler).toHaveYielded([
      'Unmount B',
      // In the regression, the reorder would cause Child A to "forget" that it
      // contains passive effects. Then when we deleted the tree, A's unmount
      // effect would not fire.
      'Unmount A',
    ]);
  });

  // @gate experimental
  it('regression: SuspenseList causes unmounts to be dropped on deletion', async () => {
    const SuspenseList = React.unstable_SuspenseList;

    function Row({label}) {
      useEffect(() => {
        Scheduler.unstable_yieldValue('Mount ' + label);
        return () => {
          Scheduler.unstable_yieldValue('Unmount ' + label);
        };
      }, [label]);
      return (
        <Suspense fallback="Loading...">
          <AsyncText text={label} />
        </Suspense>
      );
    }

    function App() {
      return (
        <SuspenseList revealOrder="together">
          <Row label="A" />
          <Row label="B" />
        </SuspenseList>
      );
    }

    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded([
      'Suspend! [A]',
      'Suspend! [B]',
      'Mount A',
      'Mount B',
    ]);

    await ReactNoop.act(async () => {
      await resolveText('A');
    });
    expect(Scheduler).toHaveYielded([
      'Promise resolved [A]',
      'A',
      'Suspend! [B]',
    ]);

    await ReactNoop.act(async () => {
      root.render(null);
    });
    // In the regression, SuspenseList would cause the children to "forget" that
    // it contains passive effects. Then when we deleted the tree, these unmount
    // effects would not fire.
    expect(Scheduler).toHaveYielded(['Unmount A', 'Unmount B']);
  });

  it('effect dependencies are persisted after a render phase update', () => {
    let handleClick;
    function Test() {
      const [count, setCount] = useState(0);

      useEffect(() => {
        Scheduler.unstable_yieldValue(`Effect: ${count}`);
      }, [count]);

      if (count > 0) {
        setCount(0);
      }

      handleClick = () => setCount(2);

      return <Text text={`Render: ${count}`} />;
    }

    ReactNoop.act(() => {
      ReactNoop.render(<Test />);
    });

    expect(Scheduler).toHaveYielded(['Render: 0', 'Effect: 0']);

    ReactNoop.act(() => {
      handleClick();
    });

    expect(Scheduler).toHaveYielded(['Render: 0']);

    ReactNoop.act(() => {
      handleClick();
    });

    expect(Scheduler).toHaveYielded(['Render: 0']);

    ReactNoop.act(() => {
      handleClick();
    });

    expect(Scheduler).toHaveYielded(['Render: 0']);
  });
});
