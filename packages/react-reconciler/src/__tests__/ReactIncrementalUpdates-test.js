/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactNoop;
let Scheduler;

// Copied from ReactFiberLanes. Don't do this!
// This is hard coded directly to avoid needing to import, and
// we'll remove this as we replace runWithPriority with React APIs.
const InputContinuousLanePriority = 10;

describe('ReactIncrementalUpdates', () => {
  beforeEach(() => {
    jest.resetModuleRegistry();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
  });

  function span(prop) {
    return {type: 'span', children: [], prop, hidden: false};
  }

  it('applies updates in order of priority', () => {
    let state;
    class Foo extends React.Component {
      state = {};
      componentDidMount() {
        Scheduler.unstable_yieldValue('commit');
        ReactNoop.deferredUpdates(() => {
          // Has low priority
          this.setState({b: 'b'});
          this.setState({c: 'c'});
        });
        // Has Task priority
        this.setState({a: 'a'});
      }
      render() {
        state = this.state;
        return <div />;
      }
    }

    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushAndYieldThrough(['commit']);
    expect(state).toEqual({a: 'a'});
    expect(Scheduler).toFlushWithoutYielding();
    expect(state).toEqual({a: 'a', b: 'b', c: 'c'});
  });

  it('applies updates with equal priority in insertion order', () => {
    let state;
    class Foo extends React.Component {
      state = {};
      componentDidMount() {
        // All have Task priority
        this.setState({a: 'a'});
        this.setState({b: 'b'});
        this.setState({c: 'c'});
      }
      render() {
        state = this.state;
        return <div />;
      }
    }

    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushWithoutYielding();
    expect(state).toEqual({a: 'a', b: 'b', c: 'c'});
  });

  it('only drops updates with equal or lesser priority when replaceState is called', () => {
    let instance;
    class Foo extends React.Component {
      state = {};
      componentDidMount() {
        Scheduler.unstable_yieldValue('componentDidMount');
      }
      componentDidUpdate() {
        Scheduler.unstable_yieldValue('componentDidUpdate');
      }
      render() {
        Scheduler.unstable_yieldValue('render');
        instance = this;
        return <div />;
      }
    }

    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushAndYield(['render', 'componentDidMount']);

    ReactNoop.flushSync(() => {
      ReactNoop.deferredUpdates(() => {
        instance.setState({x: 'x'});
        instance.setState({y: 'y'});
      });
      instance.setState({a: 'a'});
      instance.setState({b: 'b'});
      ReactNoop.deferredUpdates(() => {
        instance.updater.enqueueReplaceState(instance, {c: 'c'});
        instance.setState({d: 'd'});
      });
    });

    // Even though a replaceState has been already scheduled, it hasn't been
    // flushed yet because it has async priority.
    expect(instance.state).toEqual({a: 'a', b: 'b'});
    expect(Scheduler).toHaveYielded(['render', 'componentDidUpdate']);

    expect(Scheduler).toFlushAndYield(['render', 'componentDidUpdate']);
    // Now the rest of the updates are flushed, including the replaceState.
    expect(instance.state).toEqual({c: 'c', d: 'd'});
  });

  it('can abort an update, schedule additional updates, and resume', () => {
    let instance;
    class Foo extends React.Component {
      state = {};
      render() {
        instance = this;
        return (
          <span
            prop={Object.keys(this.state)
              .sort()
              .join('')}
          />
        );
      }
    }

    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushWithoutYielding();

    function createUpdate(letter) {
      return () => {
        Scheduler.unstable_yieldValue(letter);
        return {
          [letter]: letter,
        };
      };
    }

    // Schedule some async updates
    instance.setState(createUpdate('a'));
    instance.setState(createUpdate('b'));
    instance.setState(createUpdate('c'));

    // Begin the updates but don't flush them yet
    expect(Scheduler).toFlushAndYieldThrough(['a', 'b', 'c']);
    expect(ReactNoop.getChildren()).toEqual([span('')]);

    // Schedule some more updates at different priorities
    instance.setState(createUpdate('d'));
    ReactNoop.flushSync(() => {
      instance.setState(createUpdate('e'));
      instance.setState(createUpdate('f'));
    });
    instance.setState(createUpdate('g'));

    // The sync updates should have flushed, but not the async ones
    expect(Scheduler).toHaveYielded(['e', 'f']);
    expect(ReactNoop.getChildren()).toEqual([span('ef')]);

    // Now flush the remaining work. Even though e and f were already processed,
    // they should be processed again, to ensure that the terminal state
    // is deterministic.
    expect(Scheduler).toFlushAndYield(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
    expect(ReactNoop.getChildren()).toEqual([span('abcdefg')]);
  });

  it('can abort an update, schedule a replaceState, and resume', () => {
    let instance;
    class Foo extends React.Component {
      state = {};
      render() {
        instance = this;
        return (
          <span
            prop={Object.keys(this.state)
              .sort()
              .join('')}
          />
        );
      }
    }

    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushWithoutYielding();

    function createUpdate(letter) {
      return () => {
        Scheduler.unstable_yieldValue(letter);
        return {
          [letter]: letter,
        };
      };
    }

    // Schedule some async updates
    instance.setState(createUpdate('a'));
    instance.setState(createUpdate('b'));
    instance.setState(createUpdate('c'));

    // Begin the updates but don't flush them yet
    expect(Scheduler).toFlushAndYieldThrough(['a', 'b', 'c']);
    expect(ReactNoop.getChildren()).toEqual([span('')]);

    // Schedule some more updates at different priorities{
    instance.setState(createUpdate('d'));
    ReactNoop.flushSync(() => {
      instance.setState(createUpdate('e'));
      // No longer a public API, but we can test that it works internally by
      // reaching into the updater.
      instance.updater.enqueueReplaceState(instance, createUpdate('f'));
    });
    instance.setState(createUpdate('g'));

    // The sync updates should have flushed, but not the async ones. Update d
    // was dropped and replaced by e.
    expect(Scheduler).toHaveYielded(['e', 'f']);
    expect(ReactNoop.getChildren()).toEqual([span('f')]);

    // Now flush the remaining work. Even though e and f were already processed,
    // they should be processed again, to ensure that the terminal state
    // is deterministic.
    expect(Scheduler).toFlushAndYield(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
    expect(ReactNoop.getChildren()).toEqual([span('fg')]);
  });

  it('passes accumulation of previous updates to replaceState updater function', () => {
    let instance;
    class Foo extends React.Component {
      state = {};
      render() {
        instance = this;
        return <span />;
      }
    }
    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushWithoutYielding();

    instance.setState({a: 'a'});
    instance.setState({b: 'b'});
    // No longer a public API, but we can test that it works internally by
    // reaching into the updater.
    instance.updater.enqueueReplaceState(instance, previousState => ({
      previousState,
    }));
    expect(Scheduler).toFlushWithoutYielding();
    expect(instance.state).toEqual({previousState: {a: 'a', b: 'b'}});
  });

  it('does not call callbacks that are scheduled by another callback until a later commit', () => {
    class Foo extends React.Component {
      state = {};
      componentDidMount() {
        Scheduler.unstable_yieldValue('did mount');
        this.setState({a: 'a'}, () => {
          Scheduler.unstable_yieldValue('callback a');
          this.setState({b: 'b'}, () => {
            Scheduler.unstable_yieldValue('callback b');
          });
        });
      }
      render() {
        Scheduler.unstable_yieldValue('render');
        return <div />;
      }
    }

    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushAndYield([
      'render',
      'did mount',
      'render',
      'callback a',
      'render',
      'callback b',
    ]);
  });

  it('gives setState during reconciliation the same priority as whatever level is currently reconciling', () => {
    let instance;

    class Foo extends React.Component {
      state = {};
      UNSAFE_componentWillReceiveProps() {
        Scheduler.unstable_yieldValue('componentWillReceiveProps');
        this.setState({b: 'b'});
      }
      render() {
        Scheduler.unstable_yieldValue('render');
        instance = this;
        return <div />;
      }
    }
    ReactNoop.render(<Foo />);
    expect(() =>
      expect(Scheduler).toFlushAndYield(['render']),
    ).toErrorDev(
      'Using UNSAFE_componentWillReceiveProps in strict mode is not recommended',
      {withoutStack: true},
    );

    ReactNoop.flushSync(() => {
      instance.setState({a: 'a'});

      ReactNoop.render(<Foo />); // Trigger componentWillReceiveProps
    });

    expect(instance.state).toEqual({a: 'a', b: 'b'});
    expect(Scheduler).toHaveYielded(['componentWillReceiveProps', 'render']);
  });

  it('updates triggered from inside a class setState updater', () => {
    let instance;
    class Foo extends React.Component {
      state = {};
      render() {
        Scheduler.unstable_yieldValue('render');
        instance = this;
        return <div />;
      }
    }

    ReactNoop.render(<Foo />);
    expect(Scheduler).toFlushAndYield([
      // Initial render
      'render',
    ]);

    instance.setState(function a() {
      Scheduler.unstable_yieldValue('setState updater');
      this.setState({b: 'b'});
      return {a: 'a'};
    });

    expect(() =>
      expect(Scheduler).toFlushAndYield(
        gate(flags =>
          flags.deferRenderPhaseUpdateToNextBatch
            ? [
                'setState updater',
                // In the new reconciler, updates inside the render phase are
                // treated as if they came from an event, so the update gets
                // shifted to a subsequent render.
                'render',
                'render',
              ]
            : [
                'setState updater',
                // In the old reconciler, updates in the render phase receive
                // the currently rendering expiration time, so the update
                // flushes immediately in the same render.
                'render',
              ],
        ),
      ),
    ).toErrorDev(
      'An update (setState, replaceState, or forceUpdate) was scheduled ' +
        'from inside an update function. Update functions should be pure, ' +
        'with zero side-effects. Consider using componentDidUpdate or a ' +
        'callback.',
    );
    expect(instance.state).toEqual({a: 'a', b: 'b'});

    // Test deduplication (no additional warnings expected)
    instance.setState(function a() {
      this.setState({a: 'a'});
      return {b: 'b'};
    });
    expect(Scheduler).toFlushAndYield(
      gate(flags =>
        flags.deferRenderPhaseUpdateToNextBatch
          ? // In the new reconciler, updates inside the render phase are
            // treated as if they came from an event, so the update gets shifted
            // to a subsequent render.
            ['render', 'render']
          : // In the old reconciler, updates in the render phase receive
            // the currently rendering expiration time, so the update flushes
            // immediately in the same render.
            ['render'],
      ),
    );
  });

  it('getDerivedStateFromProps should update base state of updateQueue (based on product bug)', () => {
    // Based on real-world bug.

    let foo;
    class Foo extends React.Component {
      state = {value: 'initial state'};
      static getDerivedStateFromProps() {
        return {value: 'derived state'};
      }
      render() {
        foo = this;
        return (
          <>
            <span prop={this.state.value} />
            <Bar />
          </>
        );
      }
    }

    let bar;
    class Bar extends React.Component {
      render() {
        bar = this;
        return null;
      }
    }

    ReactNoop.flushSync(() => {
      ReactNoop.render(<Foo />);
    });
    expect(ReactNoop.getChildren()).toEqual([span('derived state')]);

    ReactNoop.flushSync(() => {
      // Triggers getDerivedStateFromProps again
      ReactNoop.render(<Foo />);
      // The noop callback is needed to trigger the specific internal path that
      // led to this bug. Removing it causes it to "accidentally" work.
      foo.setState({value: 'update state'}, function noop() {});
    });
    expect(ReactNoop.getChildren()).toEqual([span('derived state')]);

    ReactNoop.flushSync(() => {
      bar.setState({});
    });
    expect(ReactNoop.getChildren()).toEqual([span('derived state')]);
  });

  it('regression: does not expire soon due to layout effects in the last batch', () => {
    const {useState, useLayoutEffect} = React;

    let setCount;
    function App() {
      const [count, _setCount] = useState(0);
      setCount = _setCount;
      Scheduler.unstable_yieldValue('Render: ' + count);
      useLayoutEffect(() => {
        setCount(prevCount => prevCount + 1);
        Scheduler.unstable_yieldValue('Commit: ' + count);
      }, []);
      return null;
    }

    ReactNoop.act(() => {
      ReactNoop.render(<App />);
      expect(Scheduler).toFlushExpired([]);
      expect(Scheduler).toFlushAndYield([
        'Render: 0',
        'Commit: 0',
        'Render: 1',
      ]);

      Scheduler.unstable_advanceTime(10000);

      setCount(2);
      expect(Scheduler).toFlushExpired([]);
    });
  });

  it('regression: does not expire soon due to previous flushSync', () => {
    function Text({text}) {
      Scheduler.unstable_yieldValue(text);
      return text;
    }

    ReactNoop.flushSync(() => {
      ReactNoop.render(<Text text="A" />);
    });
    expect(Scheduler).toHaveYielded(['A']);

    Scheduler.unstable_advanceTime(10000);

    ReactNoop.render(<Text text="B" />);
    expect(Scheduler).toFlushExpired([]);
  });

  it('regression: does not expire soon due to previous expired work', () => {
    function Text({text}) {
      Scheduler.unstable_yieldValue(text);
      return text;
    }

    ReactNoop.render(<Text text="A" />);
    Scheduler.unstable_advanceTime(10000);
    expect(Scheduler).toFlushExpired(['A']);

    Scheduler.unstable_advanceTime(10000);

    ReactNoop.render(<Text text="B" />);
    expect(Scheduler).toFlushExpired([]);
  });

  it('when rebasing, does not exclude updates that were already committed, regardless of priority', async () => {
    const {useState, useLayoutEffect} = React;

    let pushToLog;
    function App() {
      const [log, setLog] = useState('');
      pushToLog = msg => {
        setLog(prevLog => prevLog + msg);
      };

      useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('Committed: ' + log);
        if (log === 'B') {
          // Right after B commits, schedule additional updates.
          // TODO: Double wrapping is temporary while we remove Scheduler runWithPriority.
          ReactNoop.unstable_runWithPriority(InputContinuousLanePriority, () =>
            Scheduler.unstable_runWithPriority(
              Scheduler.unstable_UserBlockingPriority,
              () => {
                pushToLog('C');
              },
            ),
          );
          setLog(prevLog => prevLog + 'D');
        }
      }, [log]);

      return log;
    }

    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded(['Committed: ']);
    expect(root).toMatchRenderedOutput('');

    await ReactNoop.act(async () => {
      pushToLog('A');

      // TODO: Double wrapping is temporary while we remove Scheduler runWithPriority.
      ReactNoop.unstable_runWithPriority(InputContinuousLanePriority, () =>
        Scheduler.unstable_runWithPriority(
          Scheduler.unstable_UserBlockingPriority,
          () => {
            pushToLog('B');
          },
        ),
      );
    });
    expect(Scheduler).toHaveYielded([
      // A and B are pending. B is higher priority, so we'll render that first.
      'Committed: B',
      // Because A comes first in the queue, we're now in rebase mode. B must
      // be rebased on top of A. Also, in a layout effect, we received two new
      // updates: C and D. C is user-blocking and D is synchronous.
      //
      // First render the synchronous update. What we're testing here is that
      // B *is not dropped* even though it has lower than sync priority. That's
      // because we already committed it. However, this render should not
      // include C, because that update wasn't already committed.
      'Committed: BD',
      'Committed: BCD',
      'Committed: ABCD',
    ]);
    expect(root).toMatchRenderedOutput('ABCD');
  });

  it('when rebasing, does not exclude updates that were already committed, regardless of priority (classes)', async () => {
    let pushToLog;
    class App extends React.Component {
      state = {log: ''};
      pushToLog = msg => {
        this.setState(prevState => ({log: prevState.log + msg}));
      };
      componentDidUpdate() {
        Scheduler.unstable_yieldValue('Committed: ' + this.state.log);
        if (this.state.log === 'B') {
          // Right after B commits, schedule additional updates.
          // TODO: Double wrapping is temporary while we remove Scheduler runWithPriority.
          ReactNoop.unstable_runWithPriority(InputContinuousLanePriority, () =>
            Scheduler.unstable_runWithPriority(
              Scheduler.unstable_UserBlockingPriority,
              () => {
                this.pushToLog('C');
              },
            ),
          );
          this.pushToLog('D');
        }
      }
      render() {
        pushToLog = this.pushToLog;
        return this.state.log;
      }
    }

    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded([]);
    expect(root).toMatchRenderedOutput('');

    await ReactNoop.act(async () => {
      pushToLog('A');
      // TODO: Double wrapping is temporary while we remove Scheduler runWithPriority.
      ReactNoop.unstable_runWithPriority(InputContinuousLanePriority, () =>
        Scheduler.unstable_runWithPriority(
          Scheduler.unstable_UserBlockingPriority,
          () => {
            pushToLog('B');
          },
        ),
      );
    });
    expect(Scheduler).toHaveYielded([
      // A and B are pending. B is higher priority, so we'll render that first.
      'Committed: B',
      // Because A comes first in the queue, we're now in rebase mode. B must
      // be rebased on top of A. Also, in a layout effect, we received two new
      // updates: C and D. C is user-blocking and D is synchronous.
      //
      // First render the synchronous update. What we're testing here is that
      // B *is not dropped* even though it has lower than sync priority. That's
      // because we already committed it. However, this render should not
      // include C, because that update wasn't already committed.
      'Committed: BD',
      'Committed: BCD',
      'Committed: ABCD',
    ]);
    expect(root).toMatchRenderedOutput('ABCD');
  });

  it("base state of update queue is initialized to its fiber's memoized state", async () => {
    // This test is very weird because it tests an implementation detail but
    // is tested in terms of public APIs. When it was originally written, the
    // test failed because the update queue was initialized to the state of
    // the alternate fiber.
    let app;
    class App extends React.Component {
      state = {prevProp: 'A', count: 0};
      static getDerivedStateFromProps(props, state) {
        // Add 100 whenever the label prop changes. The prev label is stored
        // in state. If the state is dropped incorrectly, we'll fail to detect
        // prop changes.
        if (props.prop !== state.prevProp) {
          return {
            prevProp: props.prop,
            count: state.count + 100,
          };
        }
        return null;
      }
      render() {
        app = this;
        return this.state.count;
      }
    }

    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
      root.render(<App prop="A" />);
    });
    expect(root).toMatchRenderedOutput('0');

    // Changing the prop causes the count to increase by 100
    await ReactNoop.act(async () => {
      root.render(<App prop="B" />);
    });
    expect(root).toMatchRenderedOutput('100');

    // Now increment the count by 1 with a state update. And, in the same
    // batch, change the prop back to its original value.
    await ReactNoop.act(async () => {
      root.render(<App prop="A" />);
      app.setState(state => ({count: state.count + 1}));
    });
    // There were two total prop changes, plus an increment.
    expect(root).toMatchRenderedOutput('201');
  });
});
