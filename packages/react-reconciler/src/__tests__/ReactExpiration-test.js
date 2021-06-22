/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment node
 */

'use strict';

let React;
let ReactNoop;
let Scheduler;
let act;
let readText;
let resolveText;
let startTransition;
let useState;
let useEffect;

describe('ReactExpiration', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('jest-react').act;
    startTransition = React.startTransition;
    useState = React.useState;
    useEffect = React.useEffect;

    const textCache = new Map();

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

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return props.text;
  }

  function AsyncText(props) {
    const text = props.text;
    try {
      readText(text);
      Scheduler.unstable_yieldValue(text);
      return text;
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

  function span(prop) {
    return {type: 'span', children: [], prop, hidden: false};
  }

  function flushNextRenderIfExpired() {
    // This will start rendering the next level of work. If the work hasn't
    // expired yet, React will exit without doing anything. If it has expired,
    // it will schedule a sync task.
    Scheduler.unstable_flushExpired();
    // Flush the sync task.
    ReactNoop.flushSync();
  }

  it('increases priority of updates as time progresses', () => {
    if (gate(flags => flags.enableSyncDefaultUpdates)) {
      React.startTransition(() => {
        ReactNoop.render(<span prop="done" />);
      });
    } else {
      ReactNoop.render(<span prop="done" />);
    }

    expect(ReactNoop.getChildren()).toEqual([]);

    // Nothing has expired yet because time hasn't advanced.
    flushNextRenderIfExpired();
    expect(ReactNoop.getChildren()).toEqual([]);

    // Advance time a bit, but not enough to expire the low pri update.
    ReactNoop.expire(4500);
    flushNextRenderIfExpired();
    expect(ReactNoop.getChildren()).toEqual([]);

    // Advance by another second. Now the update should expire and flush.
    ReactNoop.expire(500);
    flushNextRenderIfExpired();
    expect(ReactNoop.getChildren()).toEqual([span('done')]);
  });

  it('two updates of like priority in the same event always flush within the same batch', () => {
    class TextClass extends React.Component {
      componentDidMount() {
        Scheduler.unstable_yieldValue(`${this.props.text} [commit]`);
      }
      componentDidUpdate() {
        Scheduler.unstable_yieldValue(`${this.props.text} [commit]`);
      }
      render() {
        Scheduler.unstable_yieldValue(`${this.props.text} [render]`);
        return <span prop={this.props.text} />;
      }
    }

    function interrupt() {
      ReactNoop.flushSync(() => {
        ReactNoop.renderToRootWithID(null, 'other-root');
      });
    }

    // First, show what happens for updates in two separate events.
    // Schedule an update.
    if (gate(flags => flags.enableSyncDefaultUpdates)) {
      React.startTransition(() => {
        ReactNoop.render(<TextClass text="A" />);
      });
    } else {
      ReactNoop.render(<TextClass text="A" />);
    }
    // Advance the timer.
    Scheduler.unstable_advanceTime(2000);
    // Partially flush the first update, then interrupt it.
    expect(Scheduler).toFlushAndYieldThrough(['A [render]']);
    interrupt();

    // Don't advance time by enough to expire the first update.
    expect(Scheduler).toHaveYielded([]);
    expect(ReactNoop.getChildren()).toEqual([]);

    // Schedule another update.
    ReactNoop.render(<TextClass text="B" />);
    // Both updates are batched
    expect(Scheduler).toFlushAndYield(['B [render]', 'B [commit]']);
    expect(ReactNoop.getChildren()).toEqual([span('B')]);

    // Now do the same thing again, except this time don't flush any work in
    // between the two updates.
    ReactNoop.render(<TextClass text="A" />);
    Scheduler.unstable_advanceTime(2000);
    expect(Scheduler).toHaveYielded([]);
    expect(ReactNoop.getChildren()).toEqual([span('B')]);
    // Schedule another update.
    ReactNoop.render(<TextClass text="B" />);
    // The updates should flush in the same batch, since as far as the scheduler
    // knows, they may have occurred inside the same event.
    expect(Scheduler).toFlushAndYield(['B [render]', 'B [commit]']);
  });

  it(
    'two updates of like priority in the same event always flush within the ' +
      "same batch, even if there's a sync update in between",
    () => {
      class TextClass extends React.Component {
        componentDidMount() {
          Scheduler.unstable_yieldValue(`${this.props.text} [commit]`);
        }
        componentDidUpdate() {
          Scheduler.unstable_yieldValue(`${this.props.text} [commit]`);
        }
        render() {
          Scheduler.unstable_yieldValue(`${this.props.text} [render]`);
          return <span prop={this.props.text} />;
        }
      }

      function interrupt() {
        ReactNoop.flushSync(() => {
          ReactNoop.renderToRootWithID(null, 'other-root');
        });
      }

      // First, show what happens for updates in two separate events.
      // Schedule an update.
      if (gate(flags => flags.enableSyncDefaultUpdates)) {
        React.startTransition(() => {
          ReactNoop.render(<TextClass text="A" />);
        });
      } else {
        ReactNoop.render(<TextClass text="A" />);
      }
      // Advance the timer.
      Scheduler.unstable_advanceTime(2000);
      // Partially flush the first update, then interrupt it.
      expect(Scheduler).toFlushAndYieldThrough(['A [render]']);
      interrupt();

      // Don't advance time by enough to expire the first update.
      expect(Scheduler).toHaveYielded([]);
      expect(ReactNoop.getChildren()).toEqual([]);

      // Schedule another update.
      ReactNoop.render(<TextClass text="B" />);
      // Both updates are batched
      expect(Scheduler).toFlushAndYield(['B [render]', 'B [commit]']);
      expect(ReactNoop.getChildren()).toEqual([span('B')]);

      // Now do the same thing again, except this time don't flush any work in
      // between the two updates.
      ReactNoop.render(<TextClass text="A" />);
      Scheduler.unstable_advanceTime(2000);
      expect(Scheduler).toHaveYielded([]);
      expect(ReactNoop.getChildren()).toEqual([span('B')]);

      // Perform some synchronous work. The scheduler must assume we're inside
      // the same event.
      interrupt();

      // Schedule another update.
      ReactNoop.render(<TextClass text="B" />);
      // The updates should flush in the same batch, since as far as the scheduler
      // knows, they may have occurred inside the same event.
      expect(Scheduler).toFlushAndYield(['B [render]', 'B [commit]']);
    },
  );

  it('cannot update at the same expiration time that is already rendering', () => {
    const store = {text: 'initial'};
    const subscribers = [];
    class Connected extends React.Component {
      state = {text: store.text};
      componentDidMount() {
        subscribers.push(this);
        Scheduler.unstable_yieldValue(
          `${this.state.text} [${this.props.label}] [commit]`,
        );
      }
      componentDidUpdate() {
        Scheduler.unstable_yieldValue(
          `${this.state.text} [${this.props.label}] [commit]`,
        );
      }
      render() {
        Scheduler.unstable_yieldValue(
          `${this.state.text} [${this.props.label}] [render]`,
        );
        return <span prop={this.state.text} />;
      }
    }

    function App() {
      return (
        <>
          <Connected label="A" />
          <Connected label="B" />
          <Connected label="C" />
          <Connected label="D" />
        </>
      );
    }

    // Initial mount
    if (gate(flags => flags.enableSyncDefaultUpdates)) {
      React.startTransition(() => {
        ReactNoop.render(<App />);
      });
    } else {
      ReactNoop.render(<App />);
    }
    expect(Scheduler).toFlushAndYield([
      'initial [A] [render]',
      'initial [B] [render]',
      'initial [C] [render]',
      'initial [D] [render]',
      'initial [A] [commit]',
      'initial [B] [commit]',
      'initial [C] [commit]',
      'initial [D] [commit]',
    ]);

    // Partial update
    if (gate(flags => flags.enableSyncDefaultUpdates)) {
      React.startTransition(() => {
        subscribers.forEach(s => s.setState({text: '1'}));
      });
    } else {
      subscribers.forEach(s => s.setState({text: '1'}));
    }
    expect(Scheduler).toFlushAndYieldThrough([
      '1 [A] [render]',
      '1 [B] [render]',
    ]);

    // Before the update can finish, update again. Even though no time has
    // advanced, this update should be given a different expiration time than
    // the currently rendering one. So, C and D should render with 1, not 2.
    subscribers.forEach(s => s.setState({text: '2'}));
    expect(Scheduler).toFlushAndYieldThrough([
      '1 [C] [render]',
      '1 [D] [render]',
    ]);
  });

  it('stops yielding if CPU-bound update takes too long to finish', () => {
    const root = ReactNoop.createRoot();
    function App() {
      return (
        <>
          <Text text="A" />
          <Text text="B" />
          <Text text="C" />
          <Text text="D" />
          <Text text="E" />
        </>
      );
    }

    if (gate(flags => flags.enableSyncDefaultUpdates)) {
      React.startTransition(() => {
        root.render(<App />);
      });
    } else {
      root.render(<App />);
    }

    expect(Scheduler).toFlushAndYieldThrough(['A']);
    expect(Scheduler).toFlushAndYieldThrough(['B']);
    expect(Scheduler).toFlushAndYieldThrough(['C']);

    Scheduler.unstable_advanceTime(10000);

    flushNextRenderIfExpired();
    expect(Scheduler).toHaveYielded(['D', 'E']);
    expect(root).toMatchRenderedOutput('ABCDE');
  });

  it('root expiration is measured from the time of the first update', () => {
    Scheduler.unstable_advanceTime(10000);

    const root = ReactNoop.createRoot();
    function App() {
      return (
        <>
          <Text text="A" />
          <Text text="B" />
          <Text text="C" />
          <Text text="D" />
          <Text text="E" />
        </>
      );
    }
    if (gate(flags => flags.enableSyncDefaultUpdates)) {
      React.startTransition(() => {
        root.render(<App />);
      });
    } else {
      root.render(<App />);
    }

    expect(Scheduler).toFlushAndYieldThrough(['A']);
    expect(Scheduler).toFlushAndYieldThrough(['B']);
    expect(Scheduler).toFlushAndYieldThrough(['C']);

    Scheduler.unstable_advanceTime(10000);

    flushNextRenderIfExpired();
    expect(Scheduler).toHaveYielded(['D', 'E']);
    expect(root).toMatchRenderedOutput('ABCDE');
  });

  it('should measure expiration times relative to module initialization', () => {
    // Tests an implementation detail where expiration times are computed using
    // bitwise operations.

    jest.resetModules();
    Scheduler = require('scheduler');
    // Before importing the renderer, advance the current time by a number
    // larger than the maximum allowed for bitwise operations.
    const maxSigned31BitInt = 1073741823;
    Scheduler.unstable_advanceTime(maxSigned31BitInt * 100);

    // Now import the renderer. On module initialization, it will read the
    // current time.
    ReactNoop = require('react-noop-renderer');

    if (gate(flags => flags.enableSyncDefaultUpdates)) {
      React.startTransition(() => {
        ReactNoop.render('Hi');
      });
    } else {
      ReactNoop.render('Hi');
    }

    // The update should not have expired yet.
    flushNextRenderIfExpired();
    expect(Scheduler).toHaveYielded([]);

    expect(ReactNoop).toMatchRenderedOutput(null);

    // Advance the time some more to expire the update.
    Scheduler.unstable_advanceTime(10000);
    flushNextRenderIfExpired();
    expect(Scheduler).toHaveYielded([]);
    expect(ReactNoop).toMatchRenderedOutput('Hi');
  });

  it('should measure callback timeout relative to current time, not start-up time', () => {
    // Corresponds to a bugfix: https://github.com/facebook/react/pull/15479
    // The bug wasn't caught by other tests because we use virtual times that
    // default to 0, and most tests don't advance time.

    // Before scheduling an update, advance the current time.
    Scheduler.unstable_advanceTime(10000);

    if (gate(flags => flags.enableSyncDefaultUpdates)) {
      React.startTransition(() => {
        ReactNoop.render('Hi');
      });
    } else {
      ReactNoop.render('Hi');
    }
    flushNextRenderIfExpired();
    expect(Scheduler).toHaveYielded([]);
    expect(ReactNoop).toMatchRenderedOutput(null);

    // Advancing by ~5 seconds should be sufficient to expire the update. (I
    // used a slightly larger number to allow for possible rounding.)
    Scheduler.unstable_advanceTime(6000);
    flushNextRenderIfExpired();
    expect(Scheduler).toHaveYielded([]);
    expect(ReactNoop).toMatchRenderedOutput('Hi');
  });

  it('prevents starvation by sync updates by disabling time slicing if too much time has elapsed', async () => {
    let updateSyncPri;
    let updateNormalPri;
    function App() {
      const [highPri, setHighPri] = useState(0);
      const [normalPri, setNormalPri] = useState(0);
      updateSyncPri = () => {
        ReactNoop.flushSync(() => {
          setHighPri(n => n + 1);
        });
      };
      updateNormalPri = () => setNormalPri(n => n + 1);
      return (
        <>
          <Text text={'Sync pri: ' + highPri} />
          {', '}
          <Text text={'Normal pri: ' + normalPri} />
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded(['Sync pri: 0', 'Normal pri: 0']);
    expect(root).toMatchRenderedOutput('Sync pri: 0, Normal pri: 0');

    // First demonstrate what happens when there's no starvation
    await act(async () => {
      if (gate(flags => flags.enableSyncDefaultUpdates)) {
        React.startTransition(() => {
          updateNormalPri();
        });
      } else {
        updateNormalPri();
      }
      expect(Scheduler).toFlushAndYieldThrough(['Sync pri: 0']);
      updateSyncPri();
      expect(Scheduler).toHaveYielded(['Sync pri: 1', 'Normal pri: 0']);

      // The remaining work hasn't expired, so the render phase is time sliced.
      // In other words, we can flush just the first child without flushing
      // the rest.
      Scheduler.unstable_flushNumberOfYields(1);
      // Yield right after first child.
      expect(Scheduler).toHaveYielded(['Sync pri: 1']);
      // Now do the rest.
      expect(Scheduler).toFlushAndYield(['Normal pri: 1']);
    });
    expect(root).toMatchRenderedOutput('Sync pri: 1, Normal pri: 1');

    // Do the same thing, but starve the first update
    await act(async () => {
      if (gate(flags => flags.enableSyncDefaultUpdates)) {
        React.startTransition(() => {
          updateNormalPri();
        });
      } else {
        updateNormalPri();
      }
      expect(Scheduler).toFlushAndYieldThrough(['Sync pri: 1']);

      // This time, a lot of time has elapsed since the normal pri update
      // started rendering. (This should advance time by some number that's
      // definitely bigger than the constant heuristic we use to detect
      // starvation of normal priority updates.)
      Scheduler.unstable_advanceTime(10000);

      updateSyncPri();
      expect(Scheduler).toHaveYielded(['Sync pri: 2', 'Normal pri: 1']);

      // The remaining work _has_ expired, so the render phase is _not_ time
      // sliced. Attempting to flush just the first child also flushes the rest.
      Scheduler.unstable_flushNumberOfYields(1);
      expect(Scheduler).toHaveYielded(['Sync pri: 2', 'Normal pri: 2']);
    });
    expect(root).toMatchRenderedOutput('Sync pri: 2, Normal pri: 2');
  });

  it('idle work never expires', async () => {
    let updateSyncPri;
    let updateIdlePri;
    function App() {
      const [syncPri, setSyncPri] = useState(0);
      const [highPri, setIdlePri] = useState(0);
      updateSyncPri = () => ReactNoop.flushSync(() => setSyncPri(n => n + 1));
      updateIdlePri = () =>
        ReactNoop.idleUpdates(() => {
          setIdlePri(n => n + 1);
        });
      return (
        <>
          <Text text={'Sync pri: ' + syncPri} />
          {', '}
          <Text text={'Idle pri: ' + highPri} />
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded(['Sync pri: 0', 'Idle pri: 0']);
    expect(root).toMatchRenderedOutput('Sync pri: 0, Idle pri: 0');

    // First demonstrate what happens when there's no starvation
    await act(async () => {
      updateIdlePri();
      expect(Scheduler).toFlushAndYieldThrough(['Sync pri: 0']);
      updateSyncPri();
    });
    expect(Scheduler).toHaveYielded([
      // Interrupt idle update to render sync update
      'Sync pri: 1',
      'Idle pri: 0',
      // Now render idle
      'Sync pri: 1',
      'Idle pri: 1',
    ]);
    expect(root).toMatchRenderedOutput('Sync pri: 1, Idle pri: 1');

    // Do the same thing, but starve the first update
    await act(async () => {
      updateIdlePri();
      expect(Scheduler).toFlushAndYieldThrough(['Sync pri: 1']);

      // Advance a ridiculously large amount of time to demonstrate that the
      // idle work never expires
      Scheduler.unstable_advanceTime(100000);

      updateSyncPri();
    });
    // Same thing should happen as last time
    expect(Scheduler).toHaveYielded([
      // Interrupt idle update to render sync update
      'Sync pri: 2',
      'Idle pri: 1',
      // Now render idle
      'Sync pri: 2',
      'Idle pri: 2',
    ]);
    expect(root).toMatchRenderedOutput('Sync pri: 2, Idle pri: 2');
  });

  it('when multiple lanes expire, we can finish the in-progress one without including the others', async () => {
    let setA;
    let setB;
    function App() {
      const [a, _setA] = useState(0);
      const [b, _setB] = useState(0);
      setA = _setA;
      setB = _setB;
      return (
        <>
          <Text text={'A' + a} />
          <Text text={'B' + b} />
          <Text text="C" />
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded(['A0', 'B0', 'C']);
    expect(root).toMatchRenderedOutput('A0B0C');

    await act(async () => {
      startTransition(() => {
        setA(1);
      });
      expect(Scheduler).toFlushAndYieldThrough(['A1']);
      startTransition(() => {
        setB(1);
      });
      // Expire both the transitions
      Scheduler.unstable_advanceTime(10000);
      // Both transitions have expired, but since they aren't related
      // (entangled), we should be able to finish the in-progress transition
      // without also including the next one.
      Scheduler.unstable_flushNumberOfYields(1);
      expect(Scheduler).toHaveYielded(['B0', 'C']);
      expect(root).toMatchRenderedOutput('A1B0C');

      // The next transition also finishes without yielding.
      Scheduler.unstable_flushNumberOfYields(1);
      expect(Scheduler).toHaveYielded(['A1', 'B1', 'C']);
      expect(root).toMatchRenderedOutput('A1B1C');
    });
  });

  it('updates do not expire while they are IO-bound', async () => {
    const {Suspense} = React;

    function App({step}) {
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          <AsyncText text={'A' + step} />
          <Text text="B" />
          <Text text="C" />
        </Suspense>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      await resolveText('A0');
      root.render(<App step={0} />);
    });
    expect(Scheduler).toHaveYielded(['A0', 'B', 'C']);
    expect(root).toMatchRenderedOutput('A0BC');

    await act(async () => {
      if (gate(flags => flags.enableSyncDefaultUpdates)) {
        React.startTransition(() => {
          root.render(<App step={1} />);
        });
      } else {
        root.render(<App step={1} />);
      }
      expect(Scheduler).toFlushAndYield([
        'Suspend! [A1]',
        'B',
        'C',
        'Loading...',
      ]);

      // Lots of time elapses before the promise resolves
      Scheduler.unstable_advanceTime(10000);
      await resolveText('A1');
      expect(Scheduler).toHaveYielded(['Promise resolved [A1]']);

      // But the update doesn't expire, because it was IO bound. So we can
      // partially rendering without finishing.
      expect(Scheduler).toFlushAndYieldThrough(['A1']);
      expect(root).toMatchRenderedOutput('A0BC');

      // Lots more time elapses. We're CPU-bound now, so we should treat this
      // as starvation.
      Scheduler.unstable_advanceTime(10000);

      // The rest of the update finishes without yielding.
      Scheduler.unstable_flushNumberOfYields(1);
      expect(Scheduler).toHaveYielded(['B', 'C']);
    });
  });

  it('flushSync should not affect expired work', async () => {
    let setA;
    let setB;
    function App() {
      const [a, _setA] = useState(0);
      const [b, _setB] = useState(0);
      setA = _setA;
      setB = _setB;
      return (
        <>
          <Text text={'A' + a} />
          <Text text={'B' + b} />
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App />);
    });
    expect(Scheduler).toHaveYielded(['A0', 'B0']);

    await act(async () => {
      startTransition(() => {
        setA(1);
      });
      expect(Scheduler).toFlushAndYieldThrough(['A1']);

      // Expire the in-progress update
      Scheduler.unstable_advanceTime(10000);

      ReactNoop.flushSync(() => {
        setB(1);
      });
      expect(Scheduler).toHaveYielded(['A0', 'B1']);

      // Now flush the original update. Because it expired, it should finish
      // without yielding.
      Scheduler.unstable_flushNumberOfYields(1);
      expect(Scheduler).toHaveYielded(['A1', 'B1']);
    });
  });

  it('passive effects of expired update flush after paint', async () => {
    function App({step}) {
      useEffect(() => {
        Scheduler.unstable_yieldValue('Effect: ' + step);
      }, [step]);
      return (
        <>
          <Text text={'A' + step} />
          <Text text={'B' + step} />
          <Text text={'C' + step} />
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App step={0} />);
    });
    expect(Scheduler).toHaveYielded(['A0', 'B0', 'C0', 'Effect: 0']);
    expect(root).toMatchRenderedOutput('A0B0C0');

    await act(async () => {
      startTransition(() => {
        root.render(<App step={1} />);
      });
      // Expire the update
      Scheduler.unstable_advanceTime(10000);

      // The update finishes without yielding. But it does not flush the effect.
      Scheduler.unstable_flushNumberOfYields(1);
      expect(Scheduler).toHaveYielded(['A1', 'B1', 'C1']);
    });
    // The effect flushes after paint.
    expect(Scheduler).toHaveYielded(['Effect: 1']);
  });
});
